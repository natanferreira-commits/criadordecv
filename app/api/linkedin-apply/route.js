import { chromium } from 'playwright'
import Anthropic from '@anthropic-ai/sdk'
import { generatePDF } from '../../../lib/generate-pdf.js'
import path from 'path'
import fs from 'fs'
import os from 'os'

export const runtime = 'nodejs'
export const maxDuration = 300

const PROFILE_DIR = path.join(process.cwd(), '.browser-profile')

// Natan's contact info for standard fields
const CONTACT = {
  phone: '21996740046',
  city: 'Rio de Janeiro',
  state: 'Rio de Janeiro',
  firstName: 'Natan',
  lastName: 'Puggian',
}

async function askClaude(question, cvText, jobDescription, client) {
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 150,
    messages: [{
      role: 'user',
      content: `Você é Natan Puggian, Designer Gráfico com 3 anos de experiência. Responda a pergunta abaixo para uma candidatura de emprego de forma concisa.

CV: ${cvText?.slice(0, 800) || 'Designer Gráfico, 3 anos de experiência em design visual e marketing digital'}
Vaga: ${jobDescription?.slice(0, 400) || ''}

PERGUNTA: ${question}

Responda em no máximo 2 frases. Se for sim/não, responda só "Sim" ou "Não". Se pedir número, responda só o número.`,
    }],
  })
  return msg.content[0].text.trim()
}

async function fillFormFields(page, cvText, jobDescription, client, send) {
  // Handle file upload (resume)
  const fileInputs = await page.locator('input[type="file"]').all()
  for (const fileInput of fileInputs) {
    if (await fileInput.isVisible().catch(() => false)) {
      return { needsFileUpload: true }
    }
  }

  // Get all form elements
  const formElements = await page.locator('.jobs-easy-apply-form-element, [data-test-form-element]').all()

  for (const el of formElements) {
    const label = await el.locator('label, legend').first().textContent().catch(() => '')
      .then(t => t?.replace(/\s+/g, ' ').trim() || '')

    if (!label) continue

    // Select/Dropdown
    const select = el.locator('select').first()
    if (await select.isVisible().catch(() => false)) {
      const currentVal = await select.inputValue().catch(() => '')
      if (!currentVal) {
        const options = await select.locator('option').allTextContents()
        const simIdx = options.findIndex(t => /^(sim|yes)$/i.test(t.trim()))
        if (simIdx > 0) {
          await select.selectOption({ index: simIdx })
        } else if (options.length > 1) {
          await select.selectOption({ index: 1 })
        }
      }
      continue
    }

    // Radio buttons
    const radios = el.locator('input[type="radio"]')
    const radioCount = await radios.count()
    if (radioCount > 0) {
      let anyChecked = false
      for (let i = 0; i < radioCount; i++) {
        if (await radios.nth(i).isChecked().catch(() => false)) { anyChecked = true; break }
      }
      if (!anyChecked) {
        // Try to find Yes/Sim option
        let selected = false
        for (let i = 0; i < radioCount; i++) {
          const radioId = await radios.nth(i).getAttribute('id').catch(() => '')
          const radioLabel = await page.locator(`label[for="${radioId}"]`).textContent().catch(() => '')
          if (/^(sim|yes)$/i.test(radioLabel.trim())) {
            await radios.nth(i).check()
            selected = true
            break
          }
        }
        if (!selected) await radios.first().check().catch(() => {})
      }
      continue
    }

    // Text inputs
    const textInput = el.locator('input[type="text"], input[type="tel"], input[type="number"], input[type="email"]').first()
    if (await textInput.isVisible().catch(() => false)) {
      const currentVal = await textInput.inputValue().catch(() => '')
      if (!currentVal) {
        const labelLower = label.toLowerCase()
        let value = ''

        if (labelLower.includes('telefone') || labelLower.includes('phone') || labelLower.includes('celular') || labelLower.includes('mobile')) {
          value = CONTACT.phone
        } else if (labelLower.includes('cidade') || labelLower.includes('city')) {
          value = CONTACT.city
        } else if (labelLower.includes('sobrenome') || labelLower.includes('last name') || labelLower.includes('surname')) {
          value = CONTACT.lastName
        } else if ((labelLower.includes('primeiro') && labelLower.includes('nome')) || labelLower.includes('first name')) {
          value = CONTACT.firstName
        } else if (labelLower.includes('anos de experiência') || labelLower.includes('years of experience') || labelLower.includes('experience')) {
          value = '3'
        } else if (label.length > 10) {
          send('status', `Claude respondendo: "${label.slice(0, 50)}..."`)
          value = await askClaude(label, cvText, jobDescription, client)
        }

        if (value) await textInput.fill(value)
      }
      continue
    }

    // Textarea
    const textarea = el.locator('textarea').first()
    if (await textarea.isVisible().catch(() => false)) {
      const currentVal = await textarea.inputValue().catch(() => '')
      if (!currentVal && label.length > 5) {
        send('status', `Claude respondendo: "${label.slice(0, 50)}..."`)
        const answer = await askClaude(label, cvText, jobDescription, client)
        await textarea.fill(answer)
      }
      continue
    }
  }

  return { needsFileUpload: false }
}

export async function POST(request) {
  const { jobUrl, cvMarkdown, cvText, jobDescription } = await request.json()
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (type, message) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, message })}\n\n`))
        } catch {}
      }

      let browser = null
      let tempPdfPath = null

      try {
        fs.mkdirSync(PROFILE_DIR, { recursive: true })

        send('status', 'Abrindo navegador...')

        browser = await chromium.launchPersistentContext(PROFILE_DIR, {
          headless: false,
          viewport: { width: 1280, height: 900 },
          args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
        })

        const pages = browser.pages()
        const page = pages.length > 0 ? pages[0] : await browser.newPage()

        // Check login
        send('status', 'Verificando login no LinkedIn...')
        await page.goto('https://www.linkedin.com/feed/', {
          waitUntil: 'domcontentloaded',
          timeout: 15000,
        }).catch(() => {})

        await page.waitForTimeout(2000)

        const isLoggedIn = await page.locator('.global-nav, .authentication-outlet').first()
          .isVisible({ timeout: 5000 }).catch(() => false)

        if (!isLoggedIn) {
          send('needs_login', 'Faça login no LinkedIn no navegador que abriu. A automação continua automaticamente.')

          let loggedIn = false
          for (let i = 0; i < 90; i++) {
            await page.waitForTimeout(2000)
            const nav = await page.locator('.global-nav').isVisible({ timeout: 2000 }).catch(() => false)
            if (nav) { loggedIn = true; break }
          }

          if (!loggedIn) {
            send('error', 'Timeout de login. Tente novamente.')
            await browser.close()
            controller.close()
            return
          }
          send('status', 'Login detectado! Continuando...')
        }

        // Go to job page
        send('status', 'Acessando a vaga...')
        await page.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 20000 })
        await page.waitForTimeout(2500)

        // Click Easy Apply
        send('status', 'Clicando em Candidatura Simplificada...')
        const easyApplyBtn = page.locator([
          'button.jobs-apply-button',
          'button:has-text("Candidatura simplificada")',
          'button:has-text("Easy Apply")',
          '[data-control-name="jobdetails_topcard_inapply"]',
        ].join(', ')).first()

        await easyApplyBtn.click({ timeout: 10000 })
        await page.waitForTimeout(2000)

        // Generate PDF for upload
        send('status', 'Gerando PDF do CV para upload...')
        const pdfBuffer = await generatePDF(cvMarkdown)
        tempPdfPath = path.join(os.tmpdir(), `cv-natan-${Date.now()}.pdf`)
        fs.writeFileSync(tempPdfPath, pdfBuffer)

        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

        // Multi-step form loop
        let step = 0
        let done = false

        while (!done && step < 20) {
          step++
          await page.waitForTimeout(1200)

          send('status', `Preenchendo formulário — passo ${step}...`)

          // Handle resume upload
          const fileInputs = page.locator('input[type="file"]')
          if (await fileInputs.first().isVisible({ timeout: 1000 }).catch(() => false)) {
            send('status', 'Fazendo upload do CV...')
            await fileInputs.first().setInputFiles(tempPdfPath)
            await page.waitForTimeout(2500)
          }

          // Fill form fields
          await fillFormFields(page, cvText, jobDescription, client, send)
          await page.waitForTimeout(800)

          // Check for submit
          const submitBtn = page.locator([
            'button[aria-label="Enviar candidatura"]',
            'button[aria-label="Submit application"]',
            'button:has-text("Enviar candidatura")',
            'button:has-text("Submit application")',
          ].join(', ')).first()

          if (await submitBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
            send('status', 'Enviando candidatura...')
            await submitBtn.click()
            await page.waitForTimeout(2000)
            send('success', 'Candidatura enviada com sucesso!')
            done = true
            break
          }

          // Review step
          const reviewBtn = page.locator([
            'button[aria-label="Review your application"]',
            'button:has-text("Revisar")',
            'button:has-text("Review")',
          ].join(', ')).first()

          if (await reviewBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
            await reviewBtn.click()
            continue
          }

          // Next step
          const nextBtn = page.locator([
            'button[aria-label="Continue to next step"]',
            'button:has-text("Próximo")',
            'button:has-text("Next")',
            'button:has-text("Continuar")',
            'button:has-text("Continue")',
          ].join(', ')).first()

          if (await nextBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
            await nextBtn.click()
            continue
          }

          // Can't proceed — needs manual attention
          send('waiting', 'Formulário precisa de atenção manual. Verifique o navegador e continue.')
          break
        }

        if (!done && step >= 20) {
          send('error', 'Muitos passos no formulário. Verifique manualmente.')
        }

      } catch (err) {
        send('error', `Erro: ${err.message}`)
      } finally {
        if (tempPdfPath) fs.unlink(tempPdfPath, () => {})
        if (browser) await browser.close().catch(() => {})
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
