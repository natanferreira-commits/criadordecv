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
- TODOS os bullets de experiência devem usar verbos no INFINITIVO (ex: "Criar", "Desenvolver", "Gerenciar", "Produzir", "Liderar") — NUNCA use passado ("criou", "desenvolveu") nem gerúndio ("criando")
- RESUMO deve ter 3-4 linhas, direto, sem clichês ("profissional apaixonado", "busco crescimento", etc)
- Não mencione habilidades que o candidato não demonstrou ter no CV original
- Retorne APENAS o CV em markdown, sem comentários, sem explicações

FORMATO DE SAÍDA (use exatamente este markdown):
# NOME DO CANDIDATO
Cargo alinhado à vaga | (21) 96674-0046 | www.natanpuggian.site

## RESUMO
[3-4 linhas específicas para essa vaga]

## EXPERIÊNCIA
### Cargo | Empresa | Período
- Criar/Desenvolver/Gerenciar [descrição relevante para vaga]
- Produzir/Liderar/Estruturar [descrição relevante para vaga]

## EDUCAÇÃO
### Curso | Instituição

## CURSOS E CERTIFICAÇÕES
[apenas os relevantes para essa vaga, máximo 5, no formato: Nome | Instituição]

## HABILIDADES
[apenas as relevantes para a vaga, em lista separada por vírgula]`,

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

    const result = message.content[0].text

    return NextResponse.json({ result })
  } catch (err) {
    console.error('generate error:', err)

    if (err.status === 401) {
      return NextResponse.json({ error: 'API key inválida.' }, { status: 401 })
    }

    return NextResponse.json({ error: err.message || 'Erro ao gerar o CV.' }, { status: 500 })
  }
}
