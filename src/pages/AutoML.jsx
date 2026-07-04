import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  Legend,
} from "recharts";
import DatasetNav from "../components/DatasetNav";

const BASE_URL = import.meta.env.VITE_API_URL;

export default function AutoML({ user }) {
  const { datasetId } = useParams();
  const navigate = useNavigate();

  const [columns, setColumns] = useState([]);
  const [targetCol, setTargetCol] = useState("");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDatasetInfo();
  }, [datasetId]);

  async function getAuthHeader() {
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleRunAutoML();
  }

  async function fetchDatasetInfo() {
    try {
      setLoading(true);
      const headers = await getAuthHeader();
      const res = await axios.get(`${BASE_URL}/datasets/${datasetId}`, {
        headers,
      });
      const cols = res.data.column_analysis || res.data.columns || [];
      setColumns(cols);
      if (cols.length > 0) setTargetCol(cols[cols.length - 1].name);
    } catch (err) {
      setError("Failed to load dataset info.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRunAutoML() {
    if (!targetCol) return;
    try {
      setRunning(true);
      setError("");
      setResult(null);
      const headers = await getAuthHeader();
      const res = await axios.post(
        `${BASE_URL}/automl/${datasetId}`,
        { target_column: targetCol },
        { headers },
      );
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "AutoML failed. Please try again.");
    } finally {
      setRunning(false);
    }
  }

  if (loading) {
    return (
      <div style={styles.center}>
        <div style={styles.loadingPulse}>
          <span style={styles.loadingIcon}>⚡</span>
          <p style={{ color: "#64748b" }}>Loading dataset info...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes runPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.3); }
        }
      `}</style>

      <DatasetNav />
      <div style={styles.pageGlow} />

      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <button
            style={styles.backButton}
            onClick={() => navigate(`/overview/${datasetId}`)}
          >
            ← Overview
          </button>
          <div style={styles.headerMain}>
            <div style={styles.headerIconBox}>🤖</div>
            <div>
              <h1 style={styles.title}>AutoML — Find the Best Model</h1>
              <p style={styles.subtitle}>
                Not sure which AI model works best? We'll test multiple models
                and tell you the winner.
              </p>
            </div>
          </div>
          <div style={styles.differenceBox}>
            <div style={styles.differenceItem}>
              <span style={styles.diffIcon}>🎯</span>
              <div>
                <p style={styles.diffTitle}>ML Prediction</p>
                <p style={styles.diffDesc}>
                  Use a model to predict a specific new value
                </p>
              </div>
            </div>
            <div style={styles.differenceDivider}>vs</div>
            <div style={styles.differenceItem}>
              <span style={styles.diffIcon}>🤖</span>
              <div>
                <p style={styles.diffTitle}>AutoML</p>
                <p style={styles.diffDesc}>
                  Find which model is most accurate for your data
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Target Selection */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Select Target Column</h2>
          <p style={styles.hint}>
            Choose the column you want to predict. AutoML will train 3 different
            models and compare their performance.
          </p>
          <div style={styles.selectRow}>
            <select
              style={styles.select}
              value={targetCol}
              onKeyDown={handleKeyDown}
              onChange={(e) => {
                setTargetCol(e.target.value);
                setResult(null);
              }}
            >
              {columns.map((col) => (
                <option key={col.name} value={col.name}>
                  {col.name} ({col.type})
                </option>
              ))}
            </select>
            <button
              style={{ ...styles.runButton, opacity: running ? 0.6 : 1 }}
              onClick={handleRunAutoML}
              disabled={running}
            >
              {running ? "⚙️ Training all models..." : "⚡ Run AutoML"}
            </button>
          </div>
          {error && <p style={styles.error}>{error}</p>}
        </div>

        {/* Running animation */}
        {running && (
          <div style={styles.runningCard}>
            <div style={styles.runningAnimation}>
              <span style={styles.runningDot}>●</span>
              <span style={{ ...styles.runningDot, animationDelay: "0.3s" }}>
                ●
              </span>
              <span style={{ ...styles.runningDot, animationDelay: "0.6s" }}>
                ●
              </span>
            </div>
            <h3 style={styles.runningTitle}>Training Models</h3>
            <p style={styles.runningText}>
              Comparing Logistic Regression, Random Forest, and Gradient
              Boosting with cross-validation...
            </p>
          </div>
        )}

        {/* Results */}
        {result && (
          <>
            {/* Task + Best Model */}
            <div style={styles.section}>
              <div style={styles.resultHeader}>
                <div style={styles.taskTypeBadge}>
                  {result.task_type === "classification" ? "🏷️" : "📈"}{" "}
                  {result.task_type.charAt(0).toUpperCase() +
                    result.task_type.slice(1)}
                </div>
                <div style={styles.bestModelBadge}>
                  🏆 Best: {result.best_model}
                </div>
              </div>

              <h2 style={styles.sectionTitle}>Model Comparison</h2>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Model</th>
                      {result.task_type === "classification" ? (
                        <>
                          <th style={styles.th}>Accuracy</th>
                          <th style={styles.th}>F1 Score</th>
                        </>
                      ) : (
                        <>
                          <th style={styles.th}>R²</th>
                          <th style={styles.th}>MAE</th>
                        </>
                      )}
                      <th style={styles.th}>Time (s)</th>
                      <th style={styles.th}>Rank</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.results
                      .sort((a, b) => {
                        const key =
                          result.task_type === "classification"
                            ? "accuracy"
                            : "r2";
                        return b[key] - a[key];
                      })
                      .map((r, index) => {
                        const isBest = r.model === result.best_model;
                        return (
                          <tr
                            key={r.model}
                            style={
                              isBest
                                ? styles.bestRow
                                : index % 2 === 0
                                  ? styles.evenRow
                                  : {}
                            }
                          >
                            <td style={styles.td}>
                              <span style={styles.modelName}>
                                {isBest && "🏆 "}
                                {r.model}
                              </span>
                            </td>
                            {result.task_type === "classification" ? (
                              <>
                                <td style={styles.td}>
                                  <span style={styles.scoreValue}>
                                    {(r.accuracy * 100).toFixed(1)}%
                                  </span>
                                </td>
                                <td style={styles.td}>
                                  <span style={styles.scoreValue}>
                                    {(r.f1_score * 100).toFixed(1)}%
                                  </span>
                                </td>
                              </>
                            ) : (
                              <>
                                <td style={styles.td}>
                                  <span style={styles.scoreValue}>
                                    {r.r2?.toFixed(4)}
                                  </span>
                                </td>
                                <td style={styles.td}>
                                  <span style={styles.scoreValue}>
                                    {r.mae?.toFixed(4)}
                                  </span>
                                </td>
                              </>
                            )}
                            <td style={styles.td}>{r.training_time}s</td>
                            <td style={styles.td}>
                              <span
                                style={{
                                  ...styles.rankBadge,
                                  background:
                                    [
                                      "linear-gradient(135deg, #10b981, #059669)",
                                      "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                      "linear-gradient(135deg, #f59e0b, #d97706)",
                                    ][index] || "#64748b",
                                }}
                              >
                                #{index + 1}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Visual Comparison */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Visual Comparison</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={result.results.map((r) => ({
                    model: r.model.replace("Regressor","").replace("Classifier","").replace("Gradient Boosting","Grad Boost").replace("Linear Regression","Linear Reg"),
                    score:
                      result.task_type === "classification" ? r.accuracy : r.r2,
                    secondary:
                      result.task_type === "classification" ? r.f1_score : null,
                  }))}
                  margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(99,102,241,0.1)"
                  />
                  <XAxis
                    dataKey="model"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0d1424",
                      border: "1px solid rgba(99,102,241,0.2)",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#f1f5f9" }}
                    formatter={(val) => [
                      `${(val * 100).toFixed(2)}%`,
                      result.metric_label,
                    ]}
                  />
                  <Bar
                    dataKey="score"
                    name={result.metric_label}
                    fill="#ffffff"
                    radius={[4, 4, 0, 0]}
                  >
                    {result.results.map((r, i) => (
                      <Cell
                        key={i}
                        fill={
                          r.model === result.best_model ? "#10b981" : "#6366f1"
                        }
                      />
                    ))}
                  </Bar>
                  {result.task_type === "classification" && (
                    <Bar
                      dataKey="secondary"
                      name="F1 Score"
                      fill="#8b5cf6"
                      radius={[4, 4, 0, 0]}
                      opacity={0.7}
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* AI Explanation */}
            {result.groq_explanation && (
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>AI Analysis</h2>
                {(() => {
                  const scores = result.results.map((r) =>
                    result.task_type === "classification" ? r.accuracy : r.r2,
                  );
                  const diff = Math.max(...scores) - Math.min(...scores);
                  if (diff < 0.02) {
                    return (
                      <div style={styles.similarScoresBox}>
                        <span style={styles.similarScoresIcon}>💡</span>
                        <div>
                          <p style={styles.similarScoresTitle}>
                            All models perform similarly
                          </p>
                          <p style={styles.similarScoresText}>
                            The difference between best and worst is only{" "}
                            <strong>{(diff * 100).toFixed(2)}%</strong>. We
                            recommend{" "}
                            <strong style={{ color: "#10b981" }}>
                              {result.best_model}
                            </strong>{" "}
                            as it achieved the best score with fastest training
                            time.
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
                <div style={styles.explanationBox}>
                  <p style={styles.explanationLabel}>
                    🤖 Why {result.best_model} won
                  </p>
                  <p style={styles.explanationText}>
                    {result.groq_explanation}
                  </p>
                </div>
              </div>
            )}

            {/* Use Best Model */}
            <div style={styles.useModelCard}>
              <div style={styles.useModelLeft}>
                <span style={styles.useModelIcon}>🏆</span>
                <div>
                  <p style={styles.useModelTitle}>Ready to make predictions?</p>
                  <p style={styles.useModelText}>
                    Use{" "}
                    <strong style={{ color: "#10b981" }}>
                      {result.best_model}
                    </strong>{" "}
                    — the best model for your data — to predict new values.
                  </p>
                </div>
              </div>
              <button
                style={styles.useModelButton}
                onClick={() => navigate(`/ml/${datasetId}`)}
              >
                Go to ML Prediction →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#0a0f1e",
    color: "#f1f5f9",
    position: "relative",
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
  pageGlow: {
    position: "fixed",
    top: "-200px",
    right: "-200px",
    width: "500px",
    height: "500px",
    background:
      "radial-gradient(ellipse, rgba(99,102,241,0.06) 0%, transparent 70%)",
    pointerEvents: "none",
    zIndex: 0,
  },
  content: {
    position: "relative",
    zIndex: 1,
    padding: "32px",
  },

  // Header
  header: {
    marginBottom: "32px",
    paddingBottom: "24px",
    borderBottom: "1px solid rgba(99,102,241,0.1)",
  },
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
  headerMain: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "20px",
  },
  headerIconBox: {
    fontSize: "1.5rem",
    width: "52px",
    height: "52px",
    backgroundColor: "rgba(99,102,241,0.1)",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(99,102,241,0.2)",
    flexShrink: 0,
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: "700",
    color: "#f1f5f9",
    marginBottom: "4px",
    letterSpacing: "-0.02em",
  },
  subtitle: { color: "#475569", fontSize: "0.88rem" },

  // Difference box
  differenceBox: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    backgroundColor: "rgba(15,23,42,0.6)",
    borderRadius: "12px",
    padding: "16px 20px",
    border: "1px solid rgba(99,102,241,0.1)",
  },
  differenceItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flex: 1,
    minWidth: "200px",
  },
  diffIcon: { fontSize: "1.3rem", flexShrink: 0 },
  diffTitle: {
    color: "#a5b4fc",
    fontWeight: "600",
    fontSize: "0.88rem",
    marginBottom: "2px",
  },
  diffDesc: { color: "#475569", fontSize: "0.8rem" },
  differenceDivider: {
    color: "#334155",
    fontWeight: "700",
    fontSize: "0.85rem",
    padding: "6px 12px",
    backgroundColor: "rgba(99,102,241,0.05)",
    borderRadius: "20px",
    border: "1px solid rgba(99,102,241,0.1)",
  },

  // Section
  section: {
    backgroundColor: "rgba(15,23,42,0.8)",
    borderRadius: "14px",
    padding: "28px",
    marginBottom: "20px",
    border: "1px solid rgba(99,102,241,0.1)",
  },
  sectionTitle: {
    fontSize: "1rem",
    fontWeight: "700",
    color: "#cbd5e1",
    marginBottom: "12px",
  },
  hint: {
    color: "#475569",
    fontSize: "0.88rem",
    marginBottom: "16px",
    lineHeight: "1.5",
  },

  // Select + run
  selectRow: {
    display: "flex",
    gap: "16px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  select: {
    backgroundColor: "rgba(10,15,30,0.8)",
    color: "#f1f5f9",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "0.92rem",
    minWidth: "240px",
  },
  runButton: {
    background: "linear-gradient(135deg, #f59e0b, #d97706)",
    color: "#000",
    border: "none",
    borderRadius: "8px",
    padding: "12px 24px",
    fontSize: "0.95rem",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 0 16px rgba(245,158,11,0.25)",
  },
  error: { color: "#f87171", fontSize: "0.9rem", marginTop: "12px" },

  // Running
  runningCard: {
    backgroundColor: "rgba(15,23,42,0.8)",
    borderRadius: "14px",
    padding: "40px",
    textAlign: "center",
    border: "1px solid rgba(99,102,241,0.15)",
    marginBottom: "20px",
  },
  runningAnimation: {
    display: "flex",
    justifyContent: "center",
    gap: "8px",
    marginBottom: "16px",
  },
  runningDot: {
    fontSize: "1.5rem",
    color: "#6366f1",
    animation: "runPulse 1.2s ease-in-out infinite",
  },
  runningTitle: {
    fontSize: "1.1rem",
    fontWeight: "600",
    color: "#f1f5f9",
    marginBottom: "8px",
  },
  runningText: { color: "#475569", fontSize: "0.88rem" },

  // Result header
  resultHeader: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    marginBottom: "20px",
    flexWrap: "wrap",
  },
  taskTypeBadge: {
    backgroundColor: "rgba(99,102,241,0.08)",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: "20px",
    padding: "6px 16px",
    fontSize: "0.82rem",
    color: "#a5b4fc",
    fontWeight: "600",
  },
  bestModelBadge: {
    background:
      "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.15))",
    border: "1px solid rgba(16,185,129,0.3)",
    borderRadius: "20px",
    padding: "6px 16px",
    fontSize: "0.82rem",
    color: "#10b981",
    fontWeight: "700",
  },

  // Table
  tableWrapper: {
    overflowX: "auto",
    borderRadius: "10px",
    border: "1px solid rgba(99,102,241,0.1)",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    background:
      "linear-gradient(180deg, rgba(99,102,241,0.12), rgba(99,102,241,0.06))",
    color: "#6366f1",
    padding: "12px 16px",
    textAlign: "left",
    fontSize: "0.75rem",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    borderBottom: "1px solid rgba(99,102,241,0.15)",
  },
  td: {
    padding: "14px 16px",
    borderBottom: "1px solid rgba(99,102,241,0.05)",
    fontSize: "0.88rem",
    color: "#94a3b8",
  },
  bestRow: {
    backgroundColor: "rgba(16,185,129,0.05)",
    borderLeft: "3px solid #10b981",
  },
  evenRow: { backgroundColor: "rgba(99,102,241,0.02)" },
  modelName: { fontWeight: "600", color: "#f1f5f9" },
  scoreValue: { fontWeight: "700", color: "#f1f5f9", fontFamily: "monospace" },
  rankBadge: {
    color: "#fff",
    fontSize: "0.72rem",
    padding: "3px 10px",
    borderRadius: "12px",
    fontWeight: "700",
  },

  // Explanation
  explanationBox: {
    background: "rgba(99,102,241,0.05)",
    borderRadius: "10px",
    padding: "18px 20px",
    borderLeft: "3px solid #6366f1",
  },
  explanationLabel: {
    color: "#6366f1",
    fontSize: "0.78rem",
    fontWeight: "700",
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  explanationText: { color: "#94a3b8", lineHeight: "1.7", fontSize: "0.9rem" },

  // Similar scores
  similarScoresBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
    backgroundColor: "rgba(99,102,241,0.06)",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: "10px",
    padding: "16px 20px",
    marginBottom: "16px",
  },
  similarScoresIcon: { fontSize: "1.4rem", flexShrink: 0 },
  similarScoresTitle: {
    color: "#a5b4fc",
    fontWeight: "600",
    fontSize: "0.88rem",
    marginBottom: "6px",
  },
  similarScoresText: {
    color: "#64748b",
    fontSize: "0.83rem",
    lineHeight: "1.6",
  },

  // Use model
  useModelCard: {
    background:
      "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.1))",
    border: "1px solid rgba(16,185,129,0.25)",
    borderRadius: "14px",
    padding: "24px 28px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
    marginBottom: "24px",
  },
  useModelLeft: {
    display: "flex",
    alignItems: "flex-start",
    gap: "16px",
    flex: 1,
  },
  useModelIcon: { fontSize: "2rem", flexShrink: 0 },
  useModelTitle: {
    color: "#10b981",
    fontWeight: "700",
    fontSize: "1rem",
    marginBottom: "6px",
  },
  useModelText: { color: "#6ee7b7", fontSize: "0.86rem", lineHeight: "1.5" },
  useModelButton: {
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "12px 24px",
    fontSize: "0.92rem",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap",
    boxShadow: "0 0 12px rgba(16,185,129,0.25)",
  },
};
