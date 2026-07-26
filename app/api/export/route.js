import { NextResponse } from 'next/server'
import { generatePDF } from '../../../lib/generate-pdf.js'

export const runtime = 'nodejs'

function parseMarkdown(text) {
  const lines = text.split('\n')
  const sections = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      sections.push({ type: 'space' })
    } else if (trimmed.startsWith('# ')) {
      sections.push({ type: 'h1', text: trimmed.slice(2) })
    } else if (trimmed.startsWith('## ')) {
      sections.push({ type: 'h2', text: trimmed.slice(3) })
    } else if (trimmed.startsWith('### ')) {
      sections.push({ type: 'h3', text: trimmed.slice(4) })
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      sections.push({ type: 'bullet', text: trimmed.slice(2) })
    } else if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      sections.push({ type: 'bold', text: trimmed.slice(2, -2) })
    } else {
      sections.push({ type: 'paragraph', text: trimmed })
    }
  }

  return sections
}

async function generateDOCX(markdown) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle } = await import('docx')
  const sections = parseMarkdown(markdown)

  const children = []

  for (const section of sections) {
    if (section.type === 'space') {
      children.push(new Paragraph({ text: '' }))
    } else if (section.type === 'h1') {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: section.text, bold: true, size: 36, color: '111111' })],
      }))
    } else if (section.type === 'h2') {
      children.push(new Paragraph({
        children: [new TextRun({ text: section.text.toUpperCase(), bold: true, size: 22, color: '111111', characterSpacing: 80 })],
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 1, color: 'cccccc' },
        },
        spacing: { before: 240, after: 120 },
      }))
    } else if (section.type === 'h3') {
      children.push(new Paragraph({
        children: [new TextRun({ text: section.text, bold: true, size: 20, color: '333333' })],
        spacing: { before: 120, after: 60 },
      }))
    } else if (section.type === 'bold') {
      children.push(new Paragraph({
        children: [new TextRun({ text: section.text, bold: true, size: 20, color: '333333' })],
      }))
    } else if (section.type === 'bullet') {
      children.push(new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun({ text: section.text, size: 20, color: '444444' })],
      }))
    } else if (section.type === 'paragraph') {
      children.push(new Paragraph({
        children: [new TextRun({ text: section.text, size: 20, color: '444444' })],
      }))
    }
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 },
        },
      },
      children,
    }],
  })

  return Packer.toBuffer(doc)
}

export async function POST(request) {
  try {
    const { markdown, format } = await request.json()

    if (!markdown || !format) {
      return NextResponse.json({ error: 'Dados ausentes.' }, { status: 400 })
    }

    if (format === 'pdf') {
      const buffer = await generatePDF(markdown)
      return new Response(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="cv-gerado.pdf"',
        },
      })
    } else if (format === 'docx') {
      const buffer = await generateDOCX(markdown)
      return new Response(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': 'attachment; filename="cv-gerado.docx"',
        },
      })
    } else {
      return NextResponse.json({ error: 'Formato inválido.' }, { status: 400 })
    }
  } catch (err) {
    console.error('export error:', err)
    return NextResponse.json({ error: err.message || 'Erro ao exportar.' }, { status: 500 })
  }
}
