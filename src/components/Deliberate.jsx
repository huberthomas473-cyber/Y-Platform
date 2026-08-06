import { useEffect, useRef, useState } from 'react'

// Chat input is isolated and submits via a plain onSend(text) callback, so a
// future voice-to-text layer (a mic button transcribing into `draft` or calling
// onSend directly) slots in without restructuring the component.
function ChatInput({ disabled, onSend }) {
  const [draft, setDraft] = useState('')

  function submit(e) {
    e.preventDefault()
    const text = draft.trim()
    if (!text || disabled) return
    setDraft('')
    onSend(text)
  }

  return (
    <form className="chat-input" onSubmit={submit}>
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Ask a question or share your view…"
        aria-label="Your message"
        disabled={disabled}
      />
      <button type="submit" className="send-btn" disabled={disabled || !draft.trim()}>
        Send
      </button>
    </form>
  )
}

export default function Deliberate({ issues, sessionId }) {
  const [issueId, setIssueId] = useState(null)
  const [messages, setMessages] = useState([])
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState(null)
  const scrollRef = useRef(null)

  const issue = issues.find((i) => i.id === issueId)

  useEffect(() => {
    if (!issueId) return
    setMessages([])
    setNotice(null)
    fetch(`/api/deliberate?issue=${encodeURIComponent(issueId)}&session=${sessionId}`)
      .then((r) => (r.ok ? r.json() : { messages: [] }))
      .then((data) => setMessages(data.messages ?? []))
      .catch(() => setMessages([]))
  }, [issueId, sessionId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages, pending])

  async function send(text) {
    const next = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setPending(true)
    setNotice(null)
    try {
      const res = await fetch('/api/deliberate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueId,
          sessionId,
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setNotice(data.message ?? 'The facilitator is unavailable right now. Please try again.')
        return
      }
      setMessages((cur) => [...cur, { role: 'assistant', content: data.reply }])
    } catch {
      setNotice('Could not reach the facilitator. Check your connection and try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <section>
      <h2 className="section-title">Deliberate</h2>
      <p className="section-intro">
        Talk an issue through before you vote. The facilitator is an AI held to strict
        neutrality: it presents perspectives from multiple sides and never takes one.
      </p>

      {!issue ? (
        <div className="issue-picker">
          {issues.map((i) => (
            <button key={i.id} className="picker-card" onClick={() => setIssueId(i.id)}>
              <span className="picker-title">{i.title}</span>
              <span className="picker-framing">{i.framing}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="card chat-card">
          <div className="chat-head">
            <div>
              <h3 className="issue-title">{issue.title}</h3>
              <p className="issue-framing">{issue.framing}</p>
            </div>
            <button className="ghost-btn" onClick={() => setIssueId(null)}>
              Change issue
            </button>
          </div>

          <div className="chat-scroll" ref={scrollRef}>
            {messages.length === 0 && !pending && (
              <p className="chat-empty">
                Ask anything about this issue — the case for, the case against, what the
                evidence says, who is affected.
              </p>
            )}
            {messages.map((m, idx) => (
              <div key={idx} className={`chat-msg ${m.role}`}>
                <span className="chat-role">{m.role === 'user' ? 'You' : 'Facilitator'}</span>
                <p>{m.content}</p>
              </div>
            ))}
            {pending && (
              <div className="chat-msg assistant">
                <span className="chat-role">Facilitator</span>
                <p className="chat-thinking">Considering…</p>
              </div>
            )}
            {notice && <p className="chat-notice">{notice}</p>}
          </div>

          <ChatInput disabled={pending} onSend={send} />
        </div>
      )}
    </section>
  )
}
