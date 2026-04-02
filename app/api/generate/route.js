import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import certifications from '../../../data/certifications.js'

export const runtime = 'nodejs'
export const maxDuration = 60

const certsText = certifications
  .map(c => `- ${c.name} | ${c.institution}${c.year ? ` | ${c.year}` : ''} | Skills: ${c.skills.join(', ')}`)
  .join('\n')

export async function POST(request) {
  try {
    const { cvText, jobDescription } = await request.json()

    if (!cvText || !jobDescription) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 })
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: `Você é um redator especialista em currículos com foco em aprovação em processos seletivos.

Sua tarefa é reescrever o CV do usuário com personalização REAL para a vaga — não é uma reformatação, é uma reescrita estratégica.

PROCESSO:
1. Leia a descrição da vaga e identifique: cargo exato, habilidades obrigatórias, habilidades desejáveis, tom da empresa (startup/corporação/agência/etc), palavras-chave usadas
2. Reescreva o RESUMO como se o candidato tivesse nascido para essa vaga — mencione o cargo da vaga, as principais habilidades que o candidato TEM e que a vaga PEDE, e por que ele é a escolha certa
3. Para cada experiência, reescreva os bullets para destacar o que É RELEVANTE para essa vaga específica — use as mesmas palavras-chave da descrição da vaga quando possível
4. Coloque as experiências mais relevantes primeiro
5. Adapte completamente o tom: criativo para agências, técnico para startups de tech, formal para corporações
6. Na seção de cursos/certificações, escolha APENAS os que têm relação direta com a vaga (máximo 4-5). Ignore o resto.

REGRAS RÍGIDAS:
- Preserve TODOS os fatos: datas, nomes de empresas, cargos — NUNCA invente
- TODOS os bullets de experiência devem usar verbos no INFINITIVO (ex: "Criar", "Desenvolver", "Gerenciar") — NUNCA use passado nem gerúndio. Se o CV for em inglês, use infinitivo em inglês (ex: "Create", "Develop", "Manage")
- RESUMO deve ter 3-4 linhas, direto, sem clichês ("profissional apaixonado", "passionate professional", "busco crescimento", etc)
- Não mencione habilidades que o candidato não demonstrou ter no CV original
- IDIOMA: detecte o idioma da descrição da vaga e escreva o CV INTEIRO nesse idioma — se a vaga for em inglês, todo o CV deve ser em inglês (incluindo títulos de seção: SUMMARY, EXPERIENCE, EDUCATION, SKILLS, CERTIFICATIONS). Se for em português, tudo em português.
- NUNCA use travessão (— ou –) em nenhuma parte do texto. Use hífen (-) se precisar separar algo
- Retorne APENAS o slug + CV em markdown, sem comentários, sem explicações adicionais

FORMATO DE SAÍDA (use exatamente este markdown, com títulos de seção no idioma da vaga):
# NATAN PUGGIAN
Cargo alinhado à vaga | (21) 96674-0046 | www.natanpuggian.site

## RESUMO (ou SUMMARY se inglês)
[3-4 linhas específicas para essa vaga]

## EXPERIÊNCIA (ou EXPERIENCE se inglês)
### Cargo | Empresa | Período
- Verbo no infinitivo + descrição relevante para vaga

## EDUCAÇÃO (ou EDUCATION se inglês)
### Curso | Instituição

## CURSOS E CERTIFICAÇÕES (ou CERTIFICATIONS se inglês)
[apenas os relevantes para essa vaga, máximo 5, no formato: Nome | Instituição]

## HABILIDADES (ou SKILLS se inglês)
[apenas as relevantes para a vaga, separadas por vírgula]

IMPORTANTE: nas primeiras linhas da sua resposta, antes do CV, coloque exatamente:
SLUG: [nome da empresa OU uma palavra-chave da vaga, sem espaços, sem acentos, ex: Google ou DesignerUX]
REQUIREMENTS: [lista dos requisitos da vaga separados por vírgula, máximo 8, ex: Inglês Fluente, Superior Completo, Photoshop, 2 anos de experiência, CNH B]
Depois pule uma linha e comece o CV com # NATAN PUGGIAN`,

      messages: [
        {
          role: 'user',
          content: `DESCRIÇÃO DA VAGA:
${jobDescription}

---

MEU CV ATUAL:
${cvText}

---

TODOS OS MEUS CURSOS E CERTIFICAÇÕES (selecione apenas os relevantes para essa vaga):
${certsText}

---

Reescreva meu CV completamente personalizado para essa vaga. Retorne apenas o markdown do CV.`,
        },
      ],
    })

    const raw = message.content[0].text

    const lines = raw.split('\n')
    let slug = 'CV'
    let company = ''
    let requirements = []
    let startLine = 0

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('SLUG:')) {
        const rawSlug = lines[i].replace('SLUG:', '').trim()
        company = rawSlug
        slug = rawSlug.replace(/\s+/g, '-')
        startLine = i + 1
      } else if (lines[i].startsWith('REQUIREMENTS:')) {
        requirements = lines[i].replace('REQUIREMENTS:', '').trim().split(',').map(r => r.trim()).filter(Boolean)
        startLine = i + 1
      } else if (lines[i].startsWith('#')) {
        startLine = i
        break
      }
    }

    const cvMarkdown = lines.slice(startLine).join('\n').trimStart()
    const result = cvMarkdown.replace(/[—–]/g, '-')

    return NextResponse.json({ result, slug, company, requirements })
  } catch (err) {
    console.error('generate error:', err)

    if (err.status === 401) {
      return NextResponse.json({ error: 'API key inválida.' }, { status: 401 })
    }

    return NextResponse.json({ error: err.message || 'Erro ao gerar o CV.' }, { status: 500 })
  }
}
