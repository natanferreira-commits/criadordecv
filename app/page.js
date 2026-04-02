'use client'

import { useState, useRef } from 'react'

function renderMarkdown(text) {
  const lines = text.split('\n')
  const elements = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) {
      i++
      continue
    }

    if (trimmed.startsWith('# ')) {
      elements.push(
        <h1 key={i} style={{ fontSize: '22px', fontWeight: '700', color: '#111', marginBottom: '4px', marginTop: '0' }}>
          {trimmed.slice(2)}
        </h1>
      )
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <div key={i} style={{ marginTop: '24px', marginBottom: '8px' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', marginBottom: '6px' }}>
            {trimmed.slice(3)}
          </div>
          <div style={{ height: '1px', background: '#e5e5e5' }} />
        </div>
      )
    } else if (trimmed.startsWith('### ')) {
      elements.push(
        <p key={i} style={{ fontSize: '14px', fontWeight: '600', color: '#111', margin: '12px 0 4px' }}>
          {trimmed.slice(4)}
        </p>
      )
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      const bulletLines = []
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('• '))) {
        bulletLines.push(lines[i].trim().slice(2))
        i++
      }
      elements.push(
        <ul key={`ul-${i}`} style={{ margin: '4px 0 4px 0', paddingLeft: '0', listStyle: 'none' }}>
          {bulletLines.map((b, j) => (
            <li key={j} style={{ fontSize: '13px', color: '#444', lineHeight: '1.6', paddingLeft: '16px', position: 'relative', marginBottom: '2px' }}>
              <span style={{ position: 'absolute', left: '0', color: '#aaa' }}>·</span>
              {b}
            </li>
          ))}
        </ul>
      )
      continue
    } else {
      // Render URLs as clickable links within the text
      const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g
      const parts = trimmed.split(urlRegex)
      const rendered = parts.map((part, j) => {
        if (/^(https?:\/\/|www\.)/.test(part)) {
          const href = part.startsWith('http') ? part : `https://${part}`
          return <a key={j} href={href} target="_blank" rel="noreferrer" style={{ color: '#111', textDecoration: 'underline' }}>{part}</a>
        }
        return part
      })
      elements.push(
        <p key={i} style={{ fontSize: '13px', color: '#555', lineHeight: '1.7', margin: '4px 0' }}>
          {rendered}
        </p>
      )
    }
    i++
  }

  return elements
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f7f7f7',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '48px 24px',
  },
  header: {
    width: '100%',
    maxWidth: '680px',
    marginBottom: '40px',
  },
  headerTitle: {
    fontSize: '13px',
    fontWeight: '600',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#888',
    marginBottom: '8px',
  },
  headerH1: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#111',
    lineHeight: '1.2',
  },
  headerSub: {
    marginTop: '8px',
    fontSize: '15px',
    color: '#666',
  },
  card: {
    width: '100%',
    maxWidth: '680px',
    background: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: '4px',
    padding: '28px 32px',
    marginBottom: '12px',
  },
  cardTitle: {
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#888',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  cardNum: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: '#111',
    color: '#fff',
    fontSize: '10px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  uploadZone: {
    border: '1.5px dashed #ccc',
    borderRadius: '4px',
    padding: '28px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'border-color 0.15s, background 0.15s',
  },
  uploadZoneHover: {
    borderColor: '#111',
    background: '#fafafa',
  },
  uploadIcon: {
    fontSize: '24px',
    marginBottom: '8px',
    color: '#aaa',
  },
  uploadText: {
    fontSize: '14px',
    color: '#666',
  },
  uploadTextBold: {
    fontWeight: '600',
    color: '#111',
  },
  uploadSub: {
    fontSize: '12px',
    color: '#aaa',
    marginTop: '4px',
  },
  fileLoaded: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    background: '#fafafa',
    border: '1px solid #e5e5e5',
    borderRadius: '4px',
  },
  fileIcon: {
    fontSize: '20px',
  },
  fileName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#111',
    flex: 1,
  },
  fileRemove: {
    background: 'none',
    border: 'none',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: '18px',
    lineHeight: 1,
    padding: '2px 4px',
  },
  textarea: {
    width: '100%',
    border: '1px solid #e5e5e5',
    borderRadius: '4px',
    padding: '14px 16px',
    fontSize: '14px',
    color: '#111',
    resize: 'vertical',
    outline: 'none',
    lineHeight: '1.6',
    transition: 'border-color 0.15s',
  },
  textareaFocus: {
    borderColor: '#111',
  },
  input: {
    width: '100%',
    border: '1px solid #e5e5e5',
    borderRadius: '4px',
    padding: '12px 16px',
    fontSize: '14px',
    color: '#111',
    outline: 'none',
    transition: 'border-color 0.15s',
    letterSpacing: '0.05em',
  },
  inputHint: {
    marginTop: '8px',
    fontSize: '12px',
    color: '#aaa',
  },
  divider: {
    width: '100%',
    maxWidth: '680px',
    height: '1px',
    background: '#e5e5e5',
    margin: '4px 0',
  },
  generateBtn: {
    width: '100%',
    maxWidth: '680px',
    padding: '16px',
    background: '#111',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '600',
    letterSpacing: '0.04em',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'opacity 0.15s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  generateBtnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid #fff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  resultCard: {
    width: '100%',
    maxWidth: '680px',
    background: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: '4px',
    marginTop: '12px',
    overflow: 'hidden',
  },
  resultHeader: {
    padding: '20px 32px',
    borderBottom: '1px solid #e5e5e5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultTitle: {
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#888',
  },
  resultActions: {
    display: 'flex',
    gap: '8px',
  },
  btnOutline: {
    padding: '8px 16px',
    background: 'none',
    border: '1px solid #e5e5e5',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#111',
    cursor: 'pointer',
    letterSpacing: '0.03em',
    transition: 'border-color 0.15s',
  },
  btnSolid: {
    padding: '8px 16px',
    background: '#111',
    border: '1px solid #111',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#fff',
    cursor: 'pointer',
    letterSpacing: '0.03em',
  },
  resultContent: {
    padding: '28px 32px',
    fontSize: '14px',
    lineHeight: '1.7',
    color: '#111',
    whiteSpace: 'pre-wrap',
    fontFamily: 'inherit',
    maxHeight: '600px',
    overflowY: 'auto',
  },
  errorBox: {
    width: '100%',
    maxWidth: '680px',
    padding: '16px 20px',
    background: '#fff5f5',
    border: '1px solid #fcc',
    borderRadius: '4px',
    fontSize: '13px',
    color: '#c00',
    marginTop: '12px',
  },
}

function UploadZone({ label, accept, onFile, file, onRemove }) {
  const [hover, setHover] = useState(false)
  const ref = useRef()

  const handleDrop = (e) => {
    e.preventDefault()
    setHover(false)
    const f = e.dataTransfer.files[0]
    if (f) onFile(f)
  }

  return file ? (
    <div style={styles.fileLoaded}>
      <span style={styles.fileIcon}>📄</span>
      <span style={styles.fileName}>{file.name}</span>
      <button style={styles.fileRemove} onClick={onRemove}>×</button>
    </div>
  ) : (
    <>
      <input
        ref={ref}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={(e) => e.target.files[0] && onFile(e.target.files[0])}
      />
      <div
        style={{ ...styles.uploadZone, ...(hover ? styles.uploadZoneHover : {}) }}
        onClick={() => ref.current.click()}
        onDragOver={(e) => { e.preventDefault(); setHover(true) }}
        onDragLeave={() => setHover(false)}
        onDrop={handleDrop}
      >
        <div style={styles.uploadIcon}>↑</div>
        <div style={styles.uploadText}>
          <span style={styles.uploadTextBold}>Clique para enviar</span> ou arraste o arquivo
        </div>
        <div style={styles.uploadSub}>{label}</div>
      </div>
    </>
  )
}

export default function Home() {
  const [cvFile, setCvFile] = useState(null)
  const [cvText, setCvText] = useState('')
  const [jobDesc, setJobDesc] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [jobFocused, setJobFocused] = useState(false)

  const canGenerate = (cvFile || cvText.trim()) && jobDesc.trim() && !loading

  const handleCvFile = async (file) => {
    setCvFile(file)
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch('/api/parse-cv', { method: 'POST', body: form })
      const data = await res.json()
      if (data.text) setCvText(data.text)
    } catch {
      setError('Erro ao processar o arquivo. Tente colar o texto do CV manualmente.')
    }
  }

  const handleGenerate = async () => {
    setLoading(true)
    setError('')
    setResult('')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvText, jobDescription: jobDesc }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data.result)
    } catch (e) {
      setError(e.message || 'Erro ao gerar o CV.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(result)
  }

  const handleDownload = async (format) => {
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown: result, format }),
      })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cv-gerado.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('Erro ao exportar.')
    }
  }

  return (
    <>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        textarea:focus, input:focus {
          border-color: #111 !important;
        }
        .btn-outline:hover {
          border-color: #111;
        }
      `}</style>
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.headerTitle}>Ferramenta</div>
          <h1 style={styles.headerH1}>Gerador de CV</h1>
          <p style={styles.headerSub}>
            Envie seu CV e a descrição da vaga. O Claude reescreve tudo personalizado pra posição.
          </p>
        </div>

        {/* Step 1 — CV atual */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>
            <div style={styles.cardNum}>1</div>
            Seu CV atual
          </div>
          <UploadZone
            label="PDF ou DOCX, até 10MB"
            accept=".pdf,.docx"
            onFile={handleCvFile}
            file={cvFile}
            onRemove={() => { setCvFile(null); setCvText('') }}
          />
          {!cvFile && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#aaa', marginBottom: '8px' }}>
                Ou cole o texto do CV
              </div>
              <textarea
                style={{ ...styles.textarea, height: '140px' }}
                placeholder="Cole aqui o conteúdo do seu CV..."
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Step 2 — Descrição da vaga */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>
            <div style={styles.cardNum}>2</div>
            Descrição da vaga
          </div>
          <textarea
            style={{ ...styles.textarea, height: '180px', ...(jobFocused ? styles.textareaFocus : {}) }}
            placeholder="Cole aqui o texto completo da descrição da vaga..."
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
            onFocus={() => setJobFocused(true)}
            onBlur={() => setJobFocused(false)}
          />
        </div>

        {/* Botão gerar */}
        <button
          style={{ ...styles.generateBtn, ...(canGenerate ? {} : styles.generateBtnDisabled) }}
          onClick={handleGenerate}
          disabled={!canGenerate}
        >
          {loading ? (
            <>
              <div style={styles.spinner} />
              Gerando seu CV...
            </>
          ) : (
            'Gerar CV personalizado'
          )}
        </button>

        {/* Erro */}
        {error && (
          <div style={styles.errorBox}>{error}</div>
        )}

        {/* Resultado */}
        {result && (
          <div style={styles.resultCard}>
            <div style={styles.resultHeader}>
              <div style={styles.resultTitle}>CV Gerado</div>
              <div style={styles.resultActions}>
                <button className="btn-outline" style={styles.btnOutline} onClick={handleCopy}>
                  Copiar
                </button>
                <button style={styles.btnOutline} onClick={() => handleDownload('docx')}>
                  .docx
                </button>
                <button style={styles.btnSolid} onClick={() => handleDownload('pdf')}>
                  Baixar PDF
                </button>
              </div>
            </div>
            <div style={styles.resultContent}>{renderMarkdown(result)}</div>
          </div>
        )}
      </div>
    </>
  )
}
