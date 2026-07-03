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
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.data.reply },
      ]);
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
      <div style={styles.loadingScreen}>
        <span style={{ fontSize: "2rem" }}>💬</span>
        <p style={{ color: "#64748b", marginTop: "12px" }}>
          Loading chat history...
        </p>
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
        .chatbot-input::placeholder { color: #475569; }
        .chatbot-input:focus { outline: none; border-color: rgba(99,102,241,0.4); }
      `}</style>

      <DatasetNav />

      <div style={styles.header}>
        <button
          style={styles.backButton}
          onClick={() => navigate(`/overview/${datasetId}`)}
        >
          ← Overview
        </button>
        <div style={styles.headerCenter}>
          <span style={styles.headerIcon}>💬</span>
          <span style={styles.headerTitle}>AI Chatbot</span>
        </div>
        <div style={styles.remainingBadge}>
          <span style={styles.remainingNum}>{remaining}</span>
          <span style={styles.remainingLabel}> left</span>
        </div>
      </div>

      <div style={styles.messages}>
        {messages.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🤖</div>
            <h3 style={styles.emptyTitle}>Ask me anything about your data</h3>
            <p style={styles.emptySubtitle}>
              Trends, outliers, summaries — just ask in plain English
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
                  style={styles.chip}
                  onClick={() => {
                    setInput(q);
                    inputRef.current?.focus();
                  }}
                >
                  → {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              ...styles.row,
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              animation: "fadeInUp 0.3s ease",
            }}
          >
            {msg.role === "assistant" && <div style={styles.avatarBot}>🤖</div>}
            <div
              style={{
                ...styles.bubble,
                ...(msg.role === "user" ? styles.userBubble : styles.botBubble),
              }}
            >
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
            {msg.role === "user" && <div style={styles.avatarUser}>👤</div>}
          </div>
        ))}

        {sending && (
          <div style={{ ...styles.row, justifyContent: "flex-start" }}>
            <div style={styles.avatarBot}>🤖</div>
            <div style={{ ...styles.bubble, ...styles.botBubble }}>
              <div style={styles.typing}>
                {[0, 200, 400].map((d) => (
                  <span
                    key={d}
                    style={{ ...styles.dot, animationDelay: `${d}ms` }}
                  >
                    ●
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div style={styles.errorBar}>
          ⚠️ {error}
          <button style={styles.errorX} onClick={() => setError("")}>
            ✕
          </button>
        </div>
      )}

      <div style={styles.inputBar}>
        <textarea
          ref={inputRef}
          className="chatbot-input"
          style={styles.input}
          placeholder="Ask a question about your data..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={sending}
        />
        <button
          style={{
            ...styles.sendBtn,
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
    height: "100vh",
    backgroundColor: "#0a0f1e",
    display: "flex",
    flexDirection: "column",
    color: "#f1f5f9",
    overflow: "hidden",
  },
  loadingScreen: {
    height: "100vh",
    backgroundColor: "#0a0f1e",
    color: "#f1f5f9",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 16px",
    borderBottom: "1px solid rgba(99,102,241,0.15)",
    backgroundColor: "rgba(10,15,30,0.95)",
    flexShrink: 0,
  },
  backButton: {
    backgroundColor: "transparent",
    color: "#475569",
    border: "1px solid rgba(99,102,241,0.15)",
    borderRadius: "8px",
    padding: "5px 12px",
    cursor: "pointer",
    fontSize: "0.8rem",
  },
  headerCenter: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  headerIcon: { fontSize: "1.1rem" },
  headerTitle: {
    fontWeight: "700",
    fontSize: "1rem",
    color: "#f1f5f9",
  },
  remainingBadge: {
    backgroundColor: "rgba(99,102,241,0.1)",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: "20px",
    padding: "4px 12px",
    fontSize: "0.8rem",
  },
  remainingNum: {
    color: "#a5b4fc",
    fontWeight: "700",
  },
  remainingLabel: { color: "#475569" },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px 16px",
    maxWidth: "420px",
    margin: "0 auto",
  },
  emptyIcon: {
    fontSize: "2.5rem",
    width: "64px",
    height: "64px",
    backgroundColor: "rgba(99,102,241,0.1)",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
    border: "1px solid rgba(99,102,241,0.2)",
  },
  emptyTitle: {
    fontSize: "1rem",
    fontWeight: "600",
    color: "#f1f5f9",
    marginBottom: "8px",
  },
  emptySubtitle: {
    color: "#475569",
    fontSize: "0.85rem",
    marginBottom: "20px",
    lineHeight: "1.5",
  },
  suggestions: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  chip: {
    backgroundColor: "rgba(99,102,241,0.06)",
    color: "#64748b",
    border: "1px solid rgba(99,102,241,0.15)",
    borderRadius: "10px",
    padding: "10px 14px",
    fontSize: "0.83rem",
    cursor: "pointer",
    textAlign: "left",
  },
  row: {
    display: "flex",
    alignItems: "flex-end",
    gap: "8px",
  },
  bubble: {
    maxWidth: "75%",
    padding: "12px 16px",
    borderRadius: "16px",
    fontSize: "0.9rem",
    lineHeight: "1.6",
    wordBreak: "break-word",
  },
  userBubble: {
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    borderBottomRightRadius: "4px",
    color: "#fff",
  },
  botBubble: {
    backgroundColor: "rgba(15,23,42,0.9)",
    border: "1px solid rgba(99,102,241,0.15)",
    borderBottomLeftRadius: "4px",
    color: "#f1f5f9",
  },
  avatarBot: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    backgroundColor: "rgba(99,102,241,0.1)",
    border: "1px solid rgba(99,102,241,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.85rem",
    flexShrink: 0,
  },
  avatarUser: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.85rem",
    flexShrink: 0,
  },
  typing: { display: "flex", gap: "4px" },
  dot: {
    fontSize: "0.75rem",
    color: "#6366f1",
    animation: "typingPulse 1.4s infinite",
  },
  errorBar: {
    backgroundColor: "rgba(127,29,29,0.4)",
    color: "#fca5a5",
    padding: "8px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "0.85rem",
    flexShrink: 0,
  },
  errorX: {
    background: "none",
    border: "none",
    color: "#fca5a5",
    cursor: "pointer",
  },
  inputBar: {
    display: "flex",
    gap: "10px",
    padding: "12px 16px",
    borderTop: "1px solid rgba(99,102,241,0.1)",
    backgroundColor: "rgba(10,15,30,0.95)",
    flexShrink: 0,
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.8)",
    color: "#f1f5f9",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: "12px",
    padding: "12px 16px",
    fontSize: "0.9rem",
    resize: "none",
    fontFamily: "inherit",
    lineHeight: "1.5",
  },
  sendBtn: {
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    width: "46px",
    height: "46px",
    fontSize: "1.1rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
};
