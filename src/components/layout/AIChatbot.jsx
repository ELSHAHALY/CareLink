import { useState, useRef, useEffect, useCallback } from 'react'
import { sendMessage } from '../../services/aiService'
import '../../styles/chatbot.css'

/**
 * Small inline SVG icons used by the chatbot.
 * Keeps the component self-contained — no external icon dependency.
 */

function RobotIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.8'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
    >
      {/* Head */}
      <rect x='4' y='6' width='16' height='12' rx='3' />
      {/* Eyes */}
      <circle cx='9' cy='12' r='1.5' fill='currentColor' stroke='none' />
      <circle cx='15' cy='12' r='1.5' fill='currentColor' stroke='none' />
      {/* Antenna */}
      <line x1='12' y1='6' x2='12' y2='2' />
      <circle cx='12' cy='2' r='1' fill='currentColor' stroke='none' />
      {/* Mouth */}
      <line x1='9' y1='15' x2='15' y2='15' />
      {/* Ears */}
      <line x1='4' y1='11' x2='2' y2='11' />
      <line x1='20' y1='11' x2='22' y2='11' />
    </svg>
  )
}

function SendIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox='0 0 24 24'
      fill='currentColor'
      aria-hidden='true'
    >
      <path d='M2.01 21L23 12 2.01 3 2 10l15 2-15 2z' />
    </svg>
  )
}

/* ── Initial greeting shown when the chat first opens ──────── */

const INITIAL_MESSAGE = {
  id: 'greeting',
  role: 'assistant',
  content:
    "Hi! I'm CareLink AI. I can help you with booking appointments, finding doctors, managing your account, and more. How can I help you today?",
}

/* ── Component ─────────────────────────────────────────────── */

/**
 * AIChatbot — Floating AI Help Center widget.
 *
 * Props:
 *   onRegisterOpen — callback that receives a function the parent
 *                    can call later to open/restore the chatbot.
 *                    Used by Footer's "Help Center" link.
 */
export default function AIChatbot({ onRegisterOpen }) {
  /* ── State ─────────────────────────────────────────────────── */

  const [chatState, setChatState] = useState('closed') // 'closed' | 'open' | 'minimized'
  const [messages, setMessages] = useState([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  /* ── Refs ──────────────────────────────────────────────────── */

  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  /* ── Register the "open" callback for external callers ────── */

  const openChat = useCallback(() => {
    setChatState('open')
  }, [])

  useEffect(() => {
    onRegisterOpen?.(openChat)
  }, [onRegisterOpen, openChat])

  /* ── Auto-scroll to the newest message ─────────────────────── */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  /* ── Focus textarea when panel opens ───────────────────────── */

  useEffect(() => {
    if (chatState === 'open') {
      // Small timeout so the animation finishes first
      const id = setTimeout(() => textareaRef.current?.focus(), 100)
      return () => clearTimeout(id)
    }
  }, [chatState])

  /* ── Handlers ──────────────────────────────────────────────── */

  async function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    // 1. Add user message immediately
    const userMsg = { id: Date.now().toString(), role: 'user', content: trimmed }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      // 2-3. Build history (exclude greeting id field), call service
      const history = [...messages, userMsg].map(({ role, content }) => ({
        role,
        content,
      }))

      const reply = await sendMessage(trimmed, history)

      // 4. Add assistant response
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: reply },
      ])
    } catch {
      // 6. Show friendly error
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'error',
          content:
            "Sorry, I'm having trouble connecting right now. Please try again.",
        },
      ])
    } finally {
      // 5. Remove loading
      setIsLoading(false)
    }
  }

  function handleKeyDown(e) {
    // Enter sends (unless Shift is held for newline)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleTextareaChange(e) {
    setInput(e.target.value)

    // Auto-grow textarea
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 100) + 'px'
  }

  /* ── Render helpers ────────────────────────────────────────── */

  function renderMessage(msg) {
    const variant =
      msg.role === 'error' ? 'error' : msg.role === 'user' ? 'user' : 'assistant'

    return (
      <div
        key={msg.id}
        className={`chatbot__message chatbot__message--${variant}`}
        role={msg.role === 'error' ? 'alert' : undefined}
      >
        {msg.content}
      </div>
    )
  }

  /* ── Closed state — floating button ────────────────────────── */

  if (chatState === 'closed') {
    return (
      <button
        className='chatbot__trigger'
        onClick={() => setChatState('open')}
        aria-label='Open AI Help Center'
      >
        <RobotIcon className='chatbot__trigger-icon' />
      </button>
    )
  }

  /* ── Minimized state — right-edge tab ──────────────────────── */

  if (chatState === 'minimized') {
    return (
      <button
        className='chatbot__tab'
        onClick={() => setChatState('open')}
        aria-label='Restore AI Help Center'
      >
        <RobotIcon className='chatbot__tab-icon' />
        AI Help
      </button>
    )
  }

  /* ── Open state — full chat panel ──────────────────────────── */

  return (
    <div className='chatbot__panel' role='dialog' aria-label='CareLink AI Help Center'>
      {/* Header */}
      <div className='chatbot__header'>
        <RobotIcon className='chatbot__header-icon' />
        <div>
          <h2 className='chatbot__header-title'>CareLink AI</h2>
          <div className='chatbot__header-status'>Your healthcare assistant</div>
        </div>
        <button
          className='chatbot__close-btn'
          onClick={() => setChatState('minimized')}
          aria-label='Minimize chat'
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div
        className='chatbot__messages'
        role='log'
        aria-live='polite'
        aria-label='Chat messages'
      >
        {messages.map(renderMessage)}

        {isLoading && (
          <div className='chatbot__typing' aria-label='Assistant is typing'>
            <span className='chatbot__typing-dot' />
            <span className='chatbot__typing-dot' />
            <span className='chatbot__typing-dot' />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className='chatbot__input-area'>
        <textarea
          ref={textareaRef}
          className='chatbot__textarea'
          placeholder='Type your message...'
          value={input}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={isLoading}
          aria-label='Message input'
        />
        <button
          className='chatbot__send-btn'
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          aria-label='Send message'
        >
          <SendIcon className='chatbot__send-icon' />
        </button>
      </div>
    </div>
  )
}

