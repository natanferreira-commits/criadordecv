import { NextResponse } from 'next/server'

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

async function generatePDF(markdown) {
  const PDFDocument = (await import('pdfkit')).default
  const margin = 56
  const doc = new PDFDocument({ margin, size: 'A4', autoFirstPage: true })
  const pageWidth = 595.28 // A4

  const chunks = []
  doc.on('data', (chunk) => chunks.push(chunk))

  const sections = parseMarkdown(markdown)

  // First section after h1 is the contact/subtitle line
  let afterH1 = false

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i]

    if (section.type === 'space') {
      // ignore blank lines — spacing is controlled per element
      continue
    }

    if (section.type === 'h1') {
      // Name — big, bold, uppercase
      doc.font('Helvetica-Bold')
        .fontSize(22)
        .fillColor('#111111')
        .text(section.text.toUpperCase(), margin, doc.y, { lineGap: 2 })
      afterH1 = true
      continue
    }

    if (afterH1 && section.type === 'paragraph') {
      // Contact line — gray, smaller, right under the name
      doc.moveDown(0.15)
      doc.font('Helvetica')
        .fontSize(9.5)
        .fillColor('#666666')
        .text(section.text, margin, doc.y, { lineGap: 2 })
      // Separator line under header
      doc.moveDown(0.6)
      doc.moveTo(margin, doc.y)
        .lineTo(pageWidth - margin, doc.y)
        .strokeColor('#111111')
        .lineWidth(1)
        .stroke()
      doc.moveDown(0.6)
      afterH1 = false
      continue
    }

    afterH1 = false

    if (section.type === 'h2') {
      // Section title — uppercase, spaced, with underline
      doc.moveDown(0.9)
      doc.font('Helvetica-Bold')
        .fontSize(9)
        .fillColor('#111111')
        .text(section.text.toUpperCase(), margin, doc.y, { characterSpacing: 1.5, lineGap: 4 })
      doc.moveTo(margin, doc.y + 2)
        .lineTo(pageWidth - margin, doc.y + 2)
        .strokeColor('#cccccc')
        .lineWidth(0.5)
        .stroke()
      doc.moveDown(0.5)

    } else if (section.type === 'h3') {
      // Job title line — bold, dark
      doc.moveDown(0.5)
      doc.font('Helvetica-Bold')
        .fontSize(10.5)
        .fillColor('#111111')
        .text(section.text, margin, doc.y, { lineGap: 2 })
      doc.moveDown(0.15)

    } else if (section.type === 'bullet') {
      // Bullet — indented, lighter color, good line height
      const bulletX = margin + 10
      const textX = margin + 20
      const textWidth = pageWidth - margin - textX

      doc.font('Helvetica')
        .fontSize(9.5)
        .fillColor('#444444')

      const currentY = doc.y
      doc.text('·', bulletX, currentY, { width: 10, lineGap: 3 })
      doc.text(section.text, textX, currentY, { width: textWidth, lineGap: 3 })
      doc.moveDown(0.1)

    } else if (section.type === 'paragraph') {
      doc.font('Helvetica')
        .fontSize(9.5)
        .fillColor('#444444')
        .text(section.text, margin, doc.y, { lineGap: 3, width: pageWidth - margin * 2 })
      doc.moveDown(0.2)

    } else if (section.type === 'bold') {
      doc.font('Helvetica-Bold')
        .fontSize(9.5)
        .fillColor('#333333')
        .text(section.text, margin, doc.y, { lineGap: 2 })
      doc.moveDown(0.1)
    }
  }

  doc.end()

  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
  })
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
