'use client'

import { useState, useRef } from 'react'
import { BackgroundPaths } from '@/components/ui/background-paths'

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
    color: 'rgba(255,255,255,0.4)',
    marginBottom: '8px',
  },
  headerH1: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: '1.2',
  },
  headerSub: {
    marginTop: '8px',
    fontSize: '15px',
    color: 'rgba(255,255,255,0.5)',
  },
  card: {
    width: '100%',
    maxWidth: '680px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    padding: '28px 32px',
    marginBottom: '12px',
    backdropFilter: 'blur(12px)',
  },
  cardTitle: {
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.4)',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  cardNum: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.15)',
    color: '#fff',
    fontSize: '10px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  uploadZone: {
    border: '1.5px dashed rgba(255,255,255,0.2)',
    borderRadius: '6px',
    padding: '28px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'border-color 0.15s, background 0.15s',
  },
  uploadZoneHover: {
    borderColor: 'rgba(255,255,255,0.5)',
    background: 'rgba(255,255,255,0.04)',
  },
  uploadIcon: {
    fontSize: '24px',
    marginBottom: '8px',
    color: 'rgba(255,255,255,0.3)',
  },
  uploadText: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.5)',
  },
  uploadTextBold: {
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  uploadSub: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.3)',
    marginTop: '4px',
  },
  fileLoaded: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px',
  },
  fileIcon: {
    fontSize: '20px',
  },
  fileName: {
    fontSize: '14px',
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
    flex: 1,
  },
  fileRemove: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.3)',
    cursor: 'pointer',
    fontSize: '18px',
    lineHeight: 1,
    padding: '2px 4px',
  },
  textarea: {
    width: '100%',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '6px',
    padding: '14px 16px',
    fontSize: '14px',
    color: 'rgba(255,255,255,0.85)',
    background: 'rgba(255,255,255,0.05)',
    resize: 'vertical',
    outline: 'none',
    lineHeight: '1.6',
    transition: 'border-color 0.15s',
  },
  textareaFocus: {
    borderColor: 'rgba(255,255,255,0.35)',
  },
  input: {
    width: '100%',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '6px',
    padding: '12px 16px',
    fontSize: '14px',
    color: 'rgba(255,255,255,0.85)',
    background: 'rgba(255,255,255,0.05)',
    outline: 'none',
    transition: 'border-color 0.15s',
  },
  inputHint: {
    marginTop: '8px',
    fontSize: '12px',
    color: 'rgba(255,255,255,0.3)',
  },
  divider: {
    width: '100%',
    maxWidth: '680px',
    height: '1px',
    background: 'rgba(255,255,255,0.08)',
    margin: '4px 0',
  },
  generateBtn: {
    width: '100%',
    maxWidth: '680px',
    padding: '16px',
    background: 'linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    letterSpacing: '0.04em',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backdropFilter: 'blur(12px)',
  },
  generateBtnDisabled: {
    opacity: 0.3,
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
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    marginTop: '12px',
    overflow: 'hidden',
    backdropFilter: 'blur(12px)',
  },
  resultHeader: {
    padding: '20px 32px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultTitle: {
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.4)',
  },
  resultActions: {
    display: 'flex',
    gap: '8px',
  },
  btnOutline: {
    padding: '8px 16px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    cursor: 'pointer',
    letterSpacing: '0.03em',
    transition: 'all 0.15s',
  },
  btnSolid: {
    padding: '8px 16px',
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '6px',
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
    background: '#fff',
    fontFamily: 'inherit',
    maxHeight: '600px',
    overflowY: 'auto',
  },
  errorBox: {
    width: '100%',
    maxWidth: '680px',
    padding: '16px 20px',
    background: 'rgba(255,50,50,0.1)',
    border: '1px solid rgba(255,100,100,0.3)',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#ff8080',
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
  const [postingUrl, setPostingUrl] = useState('')
  const [fetchingJob, setFetchingJob] = useState(false)
  const [result, setResult] = useState('')
  const [slug, setSlug] = useState('Natan-Puggian')
  const [company, setCompany] = useState('')
  const [requirements, setRequirements] = useState([])
  const [error, setError] = useState('')
  const [jobFocused, setJobFocused] = useState(false)
  const [applied, setApplied] = useState(false)
  const [applying, setApplying] = useState(false)
  const [linkedinStatus, setLinkedinStatus] = useState(null) // { type, message }
  const [linkedinRunning, setLinkedinRunning] = useState(false)

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
      setApplied(false)
      if (data.slug) setSlug(`Natan-Puggian-${data.slug}`)
      if (data.company) setCompany(data.company)
      if (data.requirements) setRequirements(data.requirements)
    } catch (e) {
      setError(e.message || 'Erro ao gerar o CV.')
    } finally {
      setLoading(false)
    }
  }

  const handleFetchJob = async () => {
    if (!postingUrl.trim()) return
    setFetchingJob(true)
    setError('')
    setJobDesc('')
    try {
      const res = await fetch('/api/fetch-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: postingUrl }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setJobDesc(data.jobDescription)
    } catch (e) {
      setError(e.message || 'Erro ao buscar a vaga.')
    } finally {
      setFetchingJob(false)
    }
  }

  const handleLinkedinApply = async () => {
    if (!postingUrl.includes('linkedin.com')) {
      setLinkedinStatus({ type: 'error', message: 'A URL precisa ser do LinkedIn.' })
      return
    }
    setLinkedinRunning(true)
    setLinkedinStatus({ type: 'status', message: 'Iniciando...' })

    try {
      const res = await fetch('/api/linkedin-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobUrl: postingUrl, cvMarkdown: result, cvText, jobDescription: jobDesc }),
      })

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value)
        const lines = text.split('\n').filter(l => l.startsWith('data: '))
        for (const line of lines) {
          try {
            const event = JSON.parse(line.slice(6))
            setLinkedinStatus(event)
            if (event.type === 'success') {
              setApplied(false) // trigger notion save
              handleApplied()
            }
            if (event.type === 'success' || event.type === 'error') {
              setLinkedinRunning(false)
            }
          } catch {}
        }
      }
    } catch (e) {
      setLinkedinStatus({ type: 'error', message: e.message })
      setLinkedinRunning(false)
    }
  }

  const handleApplied = async () => {
    setApplying(true)
    try {
      const res = await fetch('/api/notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, postingUrl, position: jobDesc.slice(0, 200) }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setApplied(true)
    } catch (e) {
      setError(e.message || 'Erro ao salvar no Notion.')
    } finally {
      setApplying(false)
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
      a.download = `${slug}.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('Erro ao exportar.')
    }
  }

  return (
    <BackgroundPaths>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        textarea:focus, input:focus {
          border-color: rgba(255,255,255,0.4) !important;
        }
        ::placeholder {
          color: rgba(255,255,255,0.25) !important;
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

        {/* Step 2 — URL da vaga */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>
            <div style={styles.cardNum}>2</div>
            URL da vaga
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="url"
              style={{ ...styles.input, flex: 1 }}
              placeholder="https://linkedin.com/jobs/... ou gupy.io/..."
              value={postingUrl}
              onChange={(e) => { setPostingUrl(e.target.value); setJobDesc('') }}
            />
            <button
              onClick={handleFetchJob}
              disabled={!postingUrl.trim() || fetchingJob}
              style={{ padding: '12px 18px', background: '#111', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', opacity: (!postingUrl.trim() || fetchingJob) ? 0.4 : 1 }}
            >
              {fetchingJob ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
          {jobDesc && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#aaa', marginBottom: '8px' }}>
                Descrição extraída
              </div>
              <textarea
                style={{ ...styles.textarea, height: '140px', background: '#fafafa', color: '#555', fontSize: '13px' }}
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
              />
            </div>
          )}
          {!jobDesc && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#aaa', marginBottom: '8px' }}>
                Ou cole a descrição manualmente
              </div>
              <textarea
                style={{ ...styles.textarea, height: '140px', ...(jobFocused ? styles.textareaFocus : {}) }}
                placeholder="Cole aqui o texto da vaga..."
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
                onFocus={() => setJobFocused(true)}
                onBlur={() => setJobFocused(false)}
              />
            </div>
          )}
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

        {/* Botões de ação */}
        {result && (
          <div style={{ width: '100%', maxWidth: '680px', marginTop: '12px', display: 'flex', gap: '8px', flexDirection: 'column' }}>

            {/* LinkedIn Easy Apply */}
            {postingUrl?.includes('linkedin.com') && (
              <div>
                {linkedinStatus?.type === 'success' ? (
                  <div style={{ padding: '14px 20px', background: 'rgba(50,200,100,0.1)', border: '1px solid rgba(50,200,100,0.3)', borderRadius: '8px', fontSize: '13px', color: '#4ade80', fontWeight: '500' }}>
                    ✓ Candidatura enviada no LinkedIn!
                  </div>
                ) : (
                  <button
                    onClick={handleLinkedinApply}
                    disabled={linkedinRunning}
                    style={{ width: '100%', padding: '14px', background: 'linear-gradient(to bottom, rgba(10,102,194,0.3), rgba(10,102,194,0.15))', border: '1px solid rgba(10,102,194,0.5)', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#fff', cursor: linkedinRunning ? 'not-allowed' : 'pointer', opacity: linkedinRunning ? 0.7 : 1, letterSpacing: '0.03em', backdropFilter: 'blur(12px)' }}
                  >
                    {linkedinRunning ? '⟳ Automatizando...' : '⚡ Aplicar no LinkedIn (Easy Apply)'}
                  </button>
                )}
                {linkedinStatus && linkedinStatus.type !== 'success' && (
                  <div style={{ marginTop: '8px', padding: '10px 14px', background: linkedinStatus.type === 'error' ? 'rgba(255,50,50,0.1)' : linkedinStatus.type === 'needs_login' ? 'rgba(255,200,0,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${linkedinStatus.type === 'error' ? 'rgba(255,100,100,0.3)' : linkedinStatus.type === 'needs_login' ? 'rgba(255,200,0,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '6px', fontSize: '12px', color: linkedinStatus.type === 'error' ? '#ff8080' : linkedinStatus.type === 'needs_login' ? '#ffd700' : 'rgba(255,255,255,0.6)' }}>
                    {linkedinStatus.type === 'needs_login' ? '🔑 ' : linkedinStatus.type === 'error' ? '✕ ' : '· '}
                    {linkedinStatus.message}
                  </div>
                )}
              </div>
            )}

            {/* Marcar como Aplicado no Notion */}
            {applied ? (
              <div style={{ padding: '14px 20px', background: 'rgba(50,200,100,0.1)', border: '1px solid rgba(50,200,100,0.3)', borderRadius: '8px', fontSize: '13px', color: '#4ade80', fontWeight: '500' }}>
                ✓ Salvo no Notion como "Applied 🙂"
              </div>
            ) : (
              <button
                onClick={handleApplied}
                disabled={applying}
                style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.8)', cursor: applying ? 'not-allowed' : 'pointer', opacity: applying ? 0.5 : 1, letterSpacing: '0.03em', backdropFilter: 'blur(12px)' }}
              >
                {applying ? 'Salvando no Notion...' : '✓ Marcar como Aplicado'}
              </button>
            )}
          </div>
        )}

        {/* Requisitos da vaga */}
        {requirements.length > 0 && (
          <div style={{ width: '100%', maxWidth: '680px', marginTop: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', marginBottom: '10px' }}>
              Requisitos da vaga
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {requirements.map((req, i) => (
                <div key={i} style={{
                  padding: '6px 14px',
                  background: '#fff',
                  border: '1px solid #e5e5e5',
                  borderRadius: '2px',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: '#333',
                  letterSpacing: '0.01em',
                }}>
                  {req}
                </div>
              ))}
            </div>
          </div>
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
    </BackgroundPaths>
  )
}
