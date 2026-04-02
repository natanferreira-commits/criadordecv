import { NextResponse } from 'next/server'
import { Client } from '@notionhq/client'

const DATABASE_ID = '19d387f1-a57b-811c-a66a-fcb5e64b7d22'

export const runtime = 'nodejs'

export async function POST(request) {
  try {
    const { company, postingUrl, position } = await request.json()

    if (!process.env.NOTION_API_KEY) {
      return NextResponse.json({ error: 'NOTION_API_KEY não configurada.' }, { status: 500 })
    }

    const notion = new Client({ auth: process.env.NOTION_API_KEY })

    const properties = {
      Company: {
        title: [{ text: { content: company || 'Sem nome' } }],
      },
      Stage: {
        select: { name: 'Applied 🙂' },
      },
      'Due Date': {
        date: { start: new Date().toISOString().split('T')[0] },
      },
    }

    if (postingUrl?.trim()) {
      properties['Posting URL'] = { url: postingUrl.trim() }
    }

    // Map position to existing Notion options
    if (position) {
      const positionMap = {
        'designer visual': 'Designer Visual',
        'visual designer': 'Designer Visual',
        'designer ux': 'Designer ux',
        'ux designer': 'Designer ux',
        'ui designer': 'Designer ux',
        'ux/ui': 'Designer ux',
        'product manager': 'PM',
        'pm': 'PM',
      }
      const key = position.toLowerCase()
      const matched = Object.keys(positionMap).find(k => key.includes(k))
      if (matched) {
        properties['Position'] = {
          multi_select: [{ name: positionMap[matched] }],
        }
      }
    }

    await notion.pages.create({
      parent: { database_id: DATABASE_ID },
      properties,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('notion error:', err)
    return NextResponse.json({ error: err.message || 'Erro ao salvar no Notion.' }, { status: 500 })
  }
}
