// Shared PDF generation utility.
// Garante SEMPRE 1 pagina: mede a altura do conteudo e, se passar de uma
// pagina A4, reduz fonte e espacamento proporcionalmente ate caber.
export async function generatePDF(markdown) {
  const PDFDocument = (await import('pdfkit')).default

  const margin = 48
  const pageWidth = 595.28 // A4
  const pageHeight = 841.89 // A4
  const usableHeight = pageHeight - margin * 2

  // Tamanhos base (escala = 1). Tudo que ocupa altura eh multiplicado por `s`.
  const base = { h1: 22, contact: 9.5, h2: 9, h3: 10.5, bullet: 9.5, paragraph: 9.5 }

  // Desenha o CV inteiro em `doc` na escala `s`. Retorna a altura ocupada.
  function layout(doc, s) {
    const startY = doc.y
    const g = (n) => n * s // escala para gaps/offsets absolutos
    const lines = markdown.split('\n')
    let afterH1 = false

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim()
      if (!trimmed) continue

      if (trimmed.startsWith('# ')) {
        doc.font('Helvetica-Bold').fontSize(base.h1 * s).fillColor('#111111')
          .text(trimmed.slice(2).toUpperCase(), margin, doc.y, { lineGap: g(2) })
        afterH1 = true
        continue
      }

      if (afterH1 && !trimmed.startsWith('#') && !trimmed.startsWith('-')) {
        doc.moveDown(0.15)
        const parts = trimmed.split(/(https?:\/\/[^\s]+|www\.[^\s]+)/g).filter(Boolean)
        doc.font('Helvetica').fontSize(base.contact * s)
        parts.forEach((part, idx) => {
          const isLast = idx === parts.length - 1
          const isUrl = /^(https?:\/\/|www\.)/.test(part)
          if (isUrl) {
            const href = part.startsWith('http') ? part : `https://${part}`
            doc.fillColor('#444444').text(part, { continued: !isLast, link: href, underline: true })
          } else {
            doc.fillColor('#666666').text(part, { continued: !isLast })
          }
        })
        doc.moveDown(0.6)
        doc.moveTo(margin, doc.y).lineTo(pageWidth - margin, doc.y).strokeColor('#111111').lineWidth(1).stroke()
        doc.moveDown(0.6)
        afterH1 = false
        continue
      }

      afterH1 = false

      if (trimmed.startsWith('## ')) {
        doc.moveDown(0.9)
        doc.font('Helvetica-Bold').fontSize(base.h2 * s).fillColor('#111111')
          .text(trimmed.slice(3).toUpperCase(), margin, doc.y, { characterSpacing: 1.5, lineGap: g(4) })
        doc.moveTo(margin, doc.y + g(2)).lineTo(pageWidth - margin, doc.y + g(2)).strokeColor('#cccccc').lineWidth(0.5).stroke()
        doc.moveDown(0.5)
      } else if (trimmed.startsWith('### ')) {
        doc.moveDown(0.5)
        doc.font('Helvetica-Bold').fontSize(base.h3 * s).fillColor('#111111').text(trimmed.slice(4), margin, doc.y, { lineGap: g(2) })
        doc.moveDown(0.15)
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        const bulletX = margin + g(10)
        const textX = margin + g(20)
        const textWidth = pageWidth - margin - textX
        doc.font('Helvetica').fontSize(base.bullet * s).fillColor('#444444')
        const currentY = doc.y
        doc.text('·', bulletX, currentY, { width: g(10), lineGap: g(3) })
        doc.text(trimmed.slice(2), textX, currentY, { width: textWidth, lineGap: g(3) })
        doc.moveDown(0.1)
      } else {
        doc.font('Helvetica').fontSize(base.paragraph * s).fillColor('#444444')
          .text(trimmed, margin, doc.y, { lineGap: g(3), width: pageWidth - margin * 2 })
        doc.moveDown(0.2)
      }
    }

    return doc.y - startY
  }

  // Passo 1: medir numa pagina bem alta pra o PDFKit nunca paginar.
  const measureDoc = new PDFDocument({ margin, size: [pageWidth, 20000], autoFirstPage: true })
  measureDoc.on('data', () => {}) // drena o stream
  const contentHeight = layout(measureDoc, 1)
  measureDoc.end()

  // Escala pra caber em 1 pagina, com margem de seguranca. Nunca aumenta.
  let scale = (usableHeight / contentHeight) * 0.97
  scale = Math.min(1, scale)
  scale = Math.max(scale, 0.5) // piso de sanidade; o limite de conteudo evita chegar aqui

  // Passo 2: A4 real, pagina unica.
  const doc = new PDFDocument({ margin, size: 'A4', autoFirstPage: true })
  const chunks = []
  doc.on('data', (chunk) => chunks.push(chunk))
  layout(doc, scale)
  doc.end()

  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
  })
}
