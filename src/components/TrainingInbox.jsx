import { useState, useEffect, useCallback } from 'react';
import { getPendingQuestions, teachBot } from '../services/api';
import styles from './Traininginbox.module.css';

/* ── Chevron SVG ─────────────────────────────── */
const ChevronIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 7.5l5 5 5-5" />
  </svg>
);

/* ── Single accordion row ────────────────────── */
function QuestionRow({ question, index, answer, onChange, onSubmit, onSkip }) {
  const [open, setOpen]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const [feedback, setFeedback] = useState(null); // 'success' | 'error' | null
  const [answered, setAnswered] = useState(false);

  const charCount = (answer || '').length;

  const handleSubmit = async () => {
    if (!answer || !answer.trim()) return;
    setLoading(true);
    setFeedback(null);
    try {
      await onSubmit(question.id);
      setFeedback('success');
      setAnswered(true);
      setTimeout(() => setOpen(false), 800);
    } catch {
      setFeedback('error');
    }
    setLoading(false);
  };

  const handleSkip = () => {
    onSkip(question.id);
  };

  /* relative time helper */
  const relTime = (ts) => {
    if (!ts) return '';
    const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className={[styles.questionItem, open ? styles.open : '', answered ? styles.answered : ''].join(' ')}>

      {/* Trigger row */}
      <button className={styles.questionTrigger} onClick={() => setOpen((v) => !v)} type="button">
        <span className={styles.triggerIndex}>{index + 1}</span>
        <span className={styles.triggerText}>{question.question}</span>
        <span className={styles.triggerMeta}>
          {question.created_at && (
            <span className={styles.triggerTime}>{relTime(question.created_at)}</span>
          )}
          <ChevronIcon className={styles.triggerChevron} />
        </span>
      </button>

      {/* Collapsible body */}
      <div className={styles.questionBody}>
        <div className={styles.questionBodyInner}>
          <label className={styles.answerLabel}>Your answer</label>
          <textarea
            className={styles.answerArea}
            placeholder="Type the correct answer here…"
            value={answer || ''}
            onChange={(e) => onChange(question.id, e.target.value)}
            disabled={answered}
          />

          <div className={styles.actionRow}>
            <span className={[styles.charCount, charCount > 0 ? styles.filled : ''].join(' ')}>
              {charCount > 0 ? `${charCount} chars` : 'No answer yet'}
            </span>

            <div className={styles.btnGroup}>
              <button type="button" className={styles.btnSkip} onClick={handleSkip} disabled={answered}>
                Skip
              </button>
              <button
                type="button"
                className={styles.btnTeach}
                onClick={handleSubmit}
                disabled={!answer || !answer.trim() || loading || answered}
              >
                {loading ? 'Teaching…' : answered ? '✓ Taught' : '✦ Teach Bot'}
              </button>
            </div>
          </div>

          {feedback === 'success' && (
            <p className={styles.feedbackSuccess}>✓ Bot has been trained on this answer.</p>
          )}
          {feedback === 'error' && (
            <p className={styles.feedbackError}>⚠ Failed to submit — please try again.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────── */
export default function TrainingInbox({ tenantId }) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers]     = useState({});
  const [spinning, setSpinning]   = useState(false);

  const fetchQuestions = useCallback(async () => {
    try {
      const data = await getPendingQuestions(tenantId);
      setQuestions(data.pending_questions);
    } catch (err) {
      console.error('Failed to fetch questions', err);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchQuestions();
    const interval = setInterval(fetchQuestions, 10000);
    return () => clearInterval(interval);
  }, [fetchQuestions]);

  const handleRefresh = async () => {
    setSpinning(true);
    await fetchQuestions();
    setTimeout(() => setSpinning(false), 500);
  };

  const handleAnswerChange = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmitAnswer = async (questionId) => {
    const answerText = answers[questionId];
    if (!answerText) return;
    await teachBot(questionId, answerText);
    // remove after a short delay so success state shows
    setTimeout(() => {
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      setAnswers((prev) => { const n = { ...prev }; delete n[questionId]; return n; });
    }, 1000);
  };

  const handleSkip = (questionId) => {
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
  };

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.cardHeader}>
        <div className={styles.cardTitleGroup}>
          <span className={styles.cardTitle}>Training Inbox</span>
          <span className={[styles.badge, questions.length === 0 ? styles.empty : ''].join(' ')}>
            {questions.length === 0 ? 'All clear' : `${questions.length} pending`}
          </span>
        </div>
        <button className={styles.refreshBtn} onClick={handleRefresh} title="Refresh" type="button"
          style={{ transition: 'transform 0.5s', transform: spinning ? 'rotate(360deg)' : 'rotate(0deg)' }}>
          ↻
        </button>
      </div>

      {/* Body */}
      {questions.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>✓</div>
          <p className={styles.emptyTitle}>Bot knows everything!</p>
          <p className={styles.emptyText}>No pending questions right now. New ones will appear here automatically.</p>
        </div>
      ) : (
        <div className={styles.questionList}>
          {questions.map((q, i) => (
            <QuestionRow
              key={q.id}
              question={q}
              index={i}
              answer={answers[q.id]}
              onChange={handleAnswerChange}
              onSubmit={handleSubmitAnswer}
              onSkip={handleSkip}
            />
          ))}
        </div>
      )}
    </div>
  );
}