import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(request) {
  try {
    const { url } = await request.json()
    if (!url) return NextResponse.json({ error: 'URL não informada.' }, { status: 400 })

    // Fetch the page HTML
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      },
    })

    if (!res.ok) throw new Error(`Não foi possível acessar a URL (${res.status})`)

    const html = await res.text()

    // Strip HTML tags to get plain text
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .slice(0, 15000) // limit to avoid token overflow

    // Use Claude to extract the job description cleanly
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `Extraia APENAS o conteúdo da descrição da vaga do texto abaixo. Retorne só o texto da vaga (cargo, empresa, requisitos, responsabilidades, benefícios). Sem comentários, sem explicações.

TEXTO DA PÁGINA:
${text}`,
      }],
    })

    const jobDescription = message.content[0].text

    return NextResponse.json({ jobDescription })
  } catch (err) {
    console.error('fetch-job error:', err)
    return NextResponse.json({ error: err.message || 'Erro ao buscar a vaga.' }, { status: 500 })
  }
}
