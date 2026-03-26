import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { chatWithBot } from '../services/api';
import styles from './ChatSandbox.module.css';

const TRAINING_DURATION = 12000;

export default function ChatSandbox() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTraining, setIsTraining] = useState(true);
  const [progress, setProgress] = useState(0);
  const bottomRef = useRef(null);

  /* ── Training timer + progress bar ── */
  useEffect(() => {
    const start = Date.now();

    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.min((elapsed / TRAINING_DURATION) * 100, 100));
    }, 80);

    const done = setTimeout(() => {
      clearInterval(tick);
      setProgress(100);
      setIsTraining(false);
      setMessages([{
        role: 'bot',
        content: "✅ **Ready!** I've finished reading your website. Ask me anything.", // Notice I added markdown bolding here to test it!
      }]);
    }, TRAINING_DURATION);

    return () => { clearInterval(tick); clearTimeout(done); };
  }, []);

  /* ── Auto-scroll ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  /* ── Send ── */
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTraining || loading) return;

    const userMsg = input.trim();

    // 1. Grab the current history BEFORE adding the new message.
    const currentHistory = messages.filter(
      msg => !msg.content.includes('✅') && !msg.content.includes('⚠️')
    );

    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      // 2. Pass the history array to the API
      const data = await chatWithBot(userMsg, currentHistory);
      setMessages(prev => [...prev, { role: 'bot', content: data.answer }]);
    } catch (err) {
      const msg = err.response?.status === 404
        ? 'Session expired. Please log out and generate a new bot.'
        : "Sorry, I'm having trouble connecting to the server.";
      setMessages(prev => [...prev, { role: 'bot', content: `⚠️ ${msg}` }]);
    }

    setLoading(false);
  };

  const isOnline = !isTraining;
  const charLimit = 500;

  return (
    <div className={styles.sandboxCard}>

      {/* ── Header ── */}
      <div className={styles.sandboxHeader}>
        <div className={styles.sandboxTitle}>
          <div className={styles.sandboxTitleIcon}>⚡</div>
          AI Agent
        </div>
        <div className={`${styles.statusBadge} ${isOnline ? styles.online : styles.training}`}>
          <span className={styles.statusDot} />
          {isOnline ? 'System Online' : 'Reading website…'}
        </div>
      </div>

      {/* ── Messages ── */}
      <div className={styles.messageList}>
        {messages.length === 0 && isTraining && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🤖</div>
            <span>Hold tight — your bot is studying your website.</span>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`${styles.messageRow} ${msg.role === 'user' ? styles.user : styles.bot}`}
          >
            {msg.role === 'bot' && (
              <div className={`${styles.avatar} ${styles.botAvatar}`}>✦</div>
            )}
            <div className={`${styles.message} ${msg.role === 'user' ? styles.userMsg : styles.botMsg}`}>

              {msg.role === 'bot' ? (
                <div className={styles.markdown}>
                  <ReactMarkdown>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className={`${styles.messageRow} ${styles.bot}`}>
            <div className={`${styles.avatar} ${styles.botAvatar}`}>✦</div>
            <div className={styles.typingIndicator}>
              <span className={styles.typingDot} />
              <span className={styles.typingDot} />
              <span className={styles.typingDot} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className={styles.inputArea}>
        <form onSubmit={handleSend} className={styles.inputGroup}>
          <input
            type="text"
            className={styles.inputField}
            placeholder={isTraining ? 'Bot is studying…' : 'Ask a question…'}
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, charLimit))}
            disabled={loading || isTraining}
          />
          <button
            type="submit"
            className={styles.sendBtn}
            disabled={loading || isTraining || !input.trim()}
            aria-label="Send"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>

        <div className={`${styles.inputHint} ${input.length > charLimit * 0.9 ? styles.warn : ''}`}>
          {isTraining
            ? `Training… ${Math.round(progress)}%`
            : input.length > 0
              ? `${charLimit - input.length} characters remaining`
              : ''}
        </div>
      </div>

      {/* ── Training shimmer bar ── */}
      {isTraining && (
        <div className={styles.trainingBar}>
          <div
            className={styles.trainingBarFill}
            style={{ width: `${progress}%`, animation: progress < 100 ? undefined : 'none' }}
          />
        </div>
      )}
    </div>
  );
}