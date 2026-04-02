// Shared PDF generation utility
export async function generatePDF(markdown) {
  const PDFDocument = (await import('pdfkit')).default
  const margin = 56
  const pageWidth = 595.28
  const doc = new PDFDocument({ margin, size: 'A4', autoFirstPage: true })
  const chunks = []
  doc.on('data', (chunk) => chunks.push(chunk))

  const lines = markdown.split('\n')
  let afterH1 = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) continue

    if (trimmed.startsWith('# ')) {
      doc.font('Helvetica-Bold').fontSize(22).fillColor('#111111')
        .text(trimmed.slice(2).toUpperCase(), margin, doc.y, { lineGap: 2 })
      afterH1 = true
      continue
    }

    if (afterH1 && !trimmed.startsWith('#') && !trimmed.startsWith('-')) {
      doc.moveDown(0.15)
      const contactParts = trimmed.split(/(https?:\/\/[^\s]+|www\.[^\s]+)/g).filter(Boolean)
      doc.font('Helvetica').fontSize(9.5)
      contactParts.forEach((part, idx) => {
        const isLast = idx === contactParts.length - 1
        const isUrl = /^(https?:\/\/|www\.)/.test(part)
        if (isUrl) {
          const href = part.startsWith('http') ? part : `https://${part}`
          doc.fillColor('#444444').text(part, { continued: !isLast, link: href, underline: true })
        } else {
          doc.fillColor('#666666').text(part, { continued: !isLast })
        }
      })
      doc.moveDown(0.1)
      doc.moveDown(0.6)
      doc.moveTo(margin, doc.y).lineTo(pageWidth - margin, doc.y).strokeColor('#111111').lineWidth(1).stroke()
      doc.moveDown(0.6)
      afterH1 = false
      continue
    }

    afterH1 = false

    if (trimmed.startsWith('## ')) {
      doc.moveDown(0.9)
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#111111')
        .text(trimmed.slice(3).toUpperCase(), margin, doc.y, { characterSpacing: 1.5, lineGap: 4 })
      doc.moveTo(margin, doc.y + 2).lineTo(pageWidth - margin, doc.y + 2).strokeColor('#cccccc').lineWidth(0.5).stroke()
      doc.moveDown(0.5)
    } else if (trimmed.startsWith('### ')) {
      doc.moveDown(0.5)
      doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#111111').text(trimmed.slice(4), margin, doc.y, { lineGap: 2 })
      doc.moveDown(0.15)
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      const bulletX = margin + 10
      const textX = margin + 20
      const textWidth = pageWidth - margin - textX
      doc.font('Helvetica').fontSize(9.5).fillColor('#444444')
      const currentY = doc.y
      doc.text('·', bulletX, currentY, { width: 10, lineGap: 3 })
      doc.text(trimmed.slice(2), textX, currentY, { width: textWidth, lineGap: 3 })
      doc.moveDown(0.1)
    } else {
      doc.font('Helvetica').fontSize(9.5).fillColor('#444444')
        .text(trimmed, margin, doc.y, { lineGap: 3, width: pageWidth - margin * 2 })
      doc.moveDown(0.2)
    }
  }

  doc.end()
  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
  })
}
