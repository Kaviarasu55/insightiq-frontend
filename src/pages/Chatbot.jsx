import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import DatasetNav from "../components/DatasetNav";
import ReactMarkdown from "react-markdown";

const BASE_URL = import.meta.env.VITE_API_URL;

export default function Chatbot({ user }) {
  const { datasetId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState(20);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, [datasetId]);
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async function getAuthHeader() {
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
  }

  async function fetchHistory() {
    try {
      setLoading(true);
      const headers = await getAuthHeader();
      const res = await axios.get(`${BASE_URL}/chat/${datasetId}/history`, {
        headers,
      });
      setMessages(res.data.history || []);
    } catch (err) {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const userMsg = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);
    setError("");

    try {
      const headers = await getAuthHeader();
      const res = await axios.post(
        `${BASE_URL}/chat/${datasetId}`,
        { message: trimmed },
        { headers },
      );
      const assistantMsg = { role: "assistant", content: res.data.reply };
      setMessages((prev) => [...prev, assistantMsg]);
      setRemaining(res.data.messages_remaining);
    } catch (err) {
      const msg =
        err.response?.data?.error || "Failed to get response. Try again.";
      setError(msg);
      setMessages((prev) => prev.slice(0, -1));
      setInput(trimmed);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (loading) {
    return (
      <div style={styles.center}>
        <div style={styles.loadingPulse}>
          <span style={styles.loadingIcon}>💬</span>
          <p style={{ color: "#64748b" }}>Loading chat history...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes typingPulse {
          0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
          30% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <DatasetNav />

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button
            style={styles.backButton}
            onClick={() => navigate(`/overview/${datasetId}`)}
          >
            ← Overview
          </button>
          <div style={styles.headerTitleRow}>
            <div style={styles.headerIconBox}>💬</div>
            <div>
              <h1 style={styles.title}>AI Chatbot</h1>
              <p style={styles.subtitle}>
                Ask questions about your dataset in plain English
              </p>
            </div>
          </div>
        </div>
        <div style={styles.limitBadge}>
          <span style={styles.limitNumber}>{remaining}</span>
          <span style={styles.limitLabel}>messages left today</span>
        </div>
      </div>

      {/* Messages */}
      <div style={styles.messagesContainer}>
        {messages.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIconBox}>🤖</div>
            <h3 style={styles.emptyTitle}>Start a conversation</h3>
            <p style={styles.emptyText}>
              Ask anything about your data — trends, outliers, column meanings,
              or just "summarize this dataset."
            </p>
            <div style={styles.suggestions}>
              {[
                "What are the key trends in this data?",
                "Which columns have the most missing values?",
                "Summarize the top 5 insights",
                "Are there any outliers?",
              ].map((q) => (
                <button
                  key={q}
                  style={styles.suggestionChip}
                  onClick={() => {
                    setInput(q);
                    inputRef.current?.focus();
                  }}
                >
                  <span style={styles.suggestionArrow}>→</span> {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              ...styles.messageBubbleWrapper,
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            {msg.role === "assistant" && <div style={styles.avatarBot}>🤖</div>}
            <div
              style={{
                ...styles.messageBubble,
                ...(msg.role === "user"
                  ? styles.userBubble
                  : styles.assistantBubble),
              }}
            >
              <div style={styles.messageText}><ReactMarkdown>{msg.content}</ReactMarkdown></div>
            </div>
            {msg.role === "user" && <div style={styles.avatarUser}>👤</div>}
          </div>
        ))}

        {sending && (
          <div
            style={{
              ...styles.messageBubbleWrapper,
              justifyContent: "flex-start",
            }}
          >
            <div style={styles.avatarBot}>🤖</div>
            <div style={{ ...styles.messageBubble, ...styles.assistantBubble }}>
              <div style={styles.typingIndicator}>
                <span style={{ ...styles.typingDot, animationDelay: "0ms" }}>
                  ●
                </span>
                <span style={{ ...styles.typingDot, animationDelay: "200ms" }}>
                  ●
                </span>
                <span style={{ ...styles.typingDot, animationDelay: "400ms" }}>
                  ●
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div style={styles.errorBar}>
          <span>⚠️ {error}</span>
          <button style={styles.errorDismiss} onClick={() => setError("")}>
            ✕
          </button>
        </div>
      )}

      {/* Input */}
      <div style={styles.inputBar}>
        <textarea
          ref={inputRef}
          style={styles.textInput}
          placeholder="Ask a question about your data..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={sending}
        />
        <button
          style={{
            ...styles.sendButton,
            opacity: !input.trim() || sending ? 0.4 : 1,
          }}
          onClick={handleSend}
          disabled={!input.trim() || sending}
        >
          {sending ? "..." : "➤"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#0a0f1e",
    display: "flex",
    flexDirection: "column",
    color: "#f1f5f9",
  },
  center: {
    minHeight: "100vh",
    backgroundColor: "#0a0f1e",
    color: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingPulse: { textAlign: "center" },
  loadingIcon: { fontSize: "2.5rem", display: "block", marginBottom: "12px" },

  // Header
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "24px 32px 20px",
    borderBottom: "1px solid rgba(99,102,241,0.1)",
    backgroundColor: "rgba(10,15,30,0.8)",
  },
  headerLeft: { flex: 1 },
  backButton: {
    backgroundColor: "transparent",
    color: "#475569",
    border: "1px solid rgba(99,102,241,0.15)",
    borderRadius: "8px",
    padding: "6px 14px",
    cursor: "pointer",
    marginBottom: "16px",
    fontSize: "0.83rem",
  },
  headerTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  headerIconBox: {
    fontSize: "1.4rem",
    width: "48px",
    height: "48px",
    backgroundColor: "rgba(99,102,241,0.1)",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(99,102,241,0.2)",
    flexShrink: 0,
  },
  title: {
    fontSize: "1.4rem",
    fontWeight: "700",
    color: "#f1f5f9",
    marginBottom: "2px",
    letterSpacing: "-0.02em",
  },
  subtitle: { color: "#475569", fontSize: "0.85rem" },
  limitBadge: {
    background:
      "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: "12px",
    padding: "12px 20px",
    textAlign: "center",
    minWidth: "110px",
  },
  limitNumber: {
    display: "block",
    fontSize: "1.8rem",
    fontWeight: "700",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  limitLabel: { color: "#475569", fontSize: "0.72rem" },

  // Messages
  messagesContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "24px 32px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  // Empty state
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    maxWidth: "500px",
    margin: "0 auto",
  },
  emptyIconBox: {
    fontSize: "3rem",
    display: "block",
    marginBottom: "16px",
    width: "72px",
    height: "72px",
    backgroundColor: "rgba(99,102,241,0.1)",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
    border: "1px solid rgba(99,102,241,0.2)",
  },
  emptyTitle: {
    fontSize: "1.1rem",
    fontWeight: "600",
    color: "#f1f5f9",
    marginBottom: "8px",
  },
  emptyText: {
    color: "#475569",
    fontSize: "0.88rem",
    lineHeight: "1.6",
    marginBottom: "24px",
  },
  suggestions: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  suggestionChip: {
    backgroundColor: "rgba(99,102,241,0.06)",
    color: "#64748b",
    border: "1px solid rgba(99,102,241,0.15)",
    borderRadius: "10px",
    padding: "10px 16px",
    fontSize: "0.85rem",
    cursor: "pointer",
    textAlign: "left",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s",
  },
  suggestionArrow: {
    color: "#6366f1",
    fontWeight: "700",
  },

  // Message bubbles
  messageBubbleWrapper: {
    display: "flex",
    alignItems: "flex-end",
    gap: "10px",
    animation: "fadeInUp 0.3s ease",
  },
  messageBubble: {
    maxWidth: "70%",
    padding: "14px 18px",
    borderRadius: "16px",
    lineHeight: "1.6",
  },
  userBubble: {
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    borderBottomRightRadius: "4px",
    boxShadow: "0 4px 12px rgba(99,102,241,0.2)",
  },
  assistantBubble: {
    backgroundColor: "rgba(15,23,42,0.9)",
    border: "1px solid rgba(99,102,241,0.15)",
    borderBottomLeftRadius: "4px",
  },
  messageText: {
    fontSize: "0.92rem",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    color: "#f1f5f9",
  },
  avatarBot: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "rgba(99,102,241,0.1)",
    border: "1px solid rgba(99,102,241,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.9rem",
    flexShrink: 0,
  },
  avatarUser: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.9rem",
    flexShrink: 0,
  },

  // Typing indicator
  typingIndicator: {
    display: "flex",
    gap: "4px",
    padding: "4px 0",
  },
  typingDot: {
    fontSize: "0.8rem",
    color: "#6366f1",
    animation: "typingPulse 1.4s infinite",
  },

  // Error bar
  errorBar: {
    backgroundColor: "rgba(127,29,29,0.4)",
    color: "#fca5a5",
    padding: "10px 32px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "0.9rem",
    border: "1px solid rgba(248,113,113,0.2)",
  },
  errorDismiss: {
    background: "none",
    border: "none",
    color: "#fca5a5",
    cursor: "pointer",
    fontSize: "1rem",
  },

  // Input bar
  inputBar: {
    display: "flex",
    gap: "12px",
    padding: "16px 32px",
    borderTop: "1px solid rgba(99,102,241,0.1)",
    backgroundColor: "rgba(10,15,30,0.9)",
  },
  textInput: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.8)",
    color: "#f1f5f9",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: "12px",
    padding: "14px 18px",
    fontSize: "0.92rem",
    resize: "none",
    outline: "none",
    fontFamily: "inherit",
    lineHeight: "1.5",
  },
  sendButton: {
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    width: "48px",
    height: "48px",
    fontSize: "1.2rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "0 0 12px rgba(99,102,241,0.3)",
  },
};
