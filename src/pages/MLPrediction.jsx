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
} from "recharts";
import DatasetNav from "../components/DatasetNav";
import ReactMarkdown from "react-markdown";

const BASE_URL = import.meta.env.VITE_API_URL;

export default function MLPrediction({ user }) {
  const { datasetId } = useParams();
  const navigate = useNavigate();

  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [targetCol, setTargetCol] = useState("");
  const [training, setTraining] = useState(false);
  const [trainResult, setTrainResult] = useState(null);
  const [trainError, setTrainError] = useState("");
  const [inputValues, setInputValues] = useState({});
  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [predictError, setPredictError] = useState("");

  useEffect(() => {
    fetchDatasetInfo();
  }, [datasetId]);

  async function getAuthHeader() {
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleTrain();
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
      setTrainError("Failed to load dataset info.");
    } finally {
      setLoading(false);
    }
  }

  async function handleTrain() {
    if (!targetCol) return;
    try {
      setTraining(true);
      setTrainError("");
      setTrainResult(null);
      setPrediction(null);
      const headers = await getAuthHeader();
      const res = await axios.post(
        `${BASE_URL}/ml/${datasetId}/train`,
        { target_column: targetCol },
        { headers },
      );
      setTrainResult(res.data);
      const featureCols = res.data.feature_columns || [];
      const defaults = {};
      featureCols.forEach((col) => {
        defaults[col] = "";
      });
      setInputValues(defaults);
    } catch (err) {
      setTrainError(
        err.response?.data?.error || "Training failed. Please try again.",
      );
    } finally {
      setTraining(false);
    }
  }

  async function handlePredict() {
    try {
      setPredicting(true);
      setPredictError("");
      setPrediction(null);
      const processedValues = {};
      for (const [key, val] of Object.entries(inputValues)) {
        const num = Number(val);
        processedValues[key] = isNaN(num) ? val : num;
      }
      const headers = await getAuthHeader();
      const res = await axios.post(
        `${BASE_URL}/ml/${datasetId}/predict`,
        { input_values: processedValues },
        { headers },
      );
      setPrediction(res.data);
    } catch (err) {
      setPredictError(
        err.response?.data?.error || "Prediction failed. Train model first.",
      );
    } finally {
      setPredicting(false);
    }
  }

  if (loading) {
    return (
      <div style={styles.center}>
        <div style={styles.loadingPulse}>
          <span style={styles.loadingIcon}>🧠</span>
          <p style={{ color: "#64748b" }}>Loading dataset info...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{`
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
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
            <div style={styles.headerIconBox}>🎯</div>
            <div>
              <h1 style={styles.title}>ML Prediction</h1>
              <p style={styles.subtitle}>
                Train a model and predict outcomes from your data
              </p>
            </div>
          </div>
        </div>

        {/* Step 1 */}
        <div style={styles.section}>
          <div style={styles.stepBadge}>Step 1</div>
          <h2 style={styles.sectionTitle}>What do you want to predict?</h2>
          <p style={styles.hint}>
            Select the column you want to predict. InsightIQ will automatically
            learn patterns from ALL other columns — no manual setup needed.
          </p>
          <div style={styles.selectRow}>
            <select
              style={styles.select}
              value={targetCol}
              onKeyDown={handleKeyDown}
              onChange={(e) => {
                setTargetCol(e.target.value);
                setTrainResult(null);
                setPrediction(null);
              }}
            >
              {columns.map((col) => (
                <option key={col.name} value={col.name}>
                  {col.name} ({col.type})
                </option>
              ))}
            </select>
            <button
              style={{ ...styles.trainButton, opacity: training ? 0.6 : 1 }}
              onClick={handleTrain}
              disabled={training}
            >
              {training ? "⚙️ Training model..." : "🚀 Train Model"}
            </button>
          </div>
          {trainError && <p style={styles.error}>{trainError}</p>}
          {targetCol && (
            <div style={styles.learningBox}>
              <p style={styles.learningTitle}>
                📚 The model will learn from these columns to predict{" "}
                <strong style={{ color: "#a5b4fc" }}>{targetCol}</strong>:
              </p>
              <div style={styles.chipsRow}>
                {columns
                  .filter((col) => col.name !== targetCol)
                  .map((col) => (
                    <span key={col.name} style={styles.chip}>
                      {col.name}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Step 2 */}
        {trainResult && (
          <div style={styles.section}>
            <div style={styles.stepBadge}>Step 2</div>
            <h2 style={styles.sectionTitle}>Training Results</h2>

            <div style={styles.modelUsedBanner}>
              <span style={styles.modelUsedIcon}>🤖</span>
              <div>
                <p style={styles.modelUsedTitle}>
                  Model Used:{" "}
                  <strong style={{ color: "#a5b4fc" }}>
                    {trainResult.model_name}
                  </strong>
                </p>
                <p style={styles.modelUsedText}>
                  {trainResult.model_name.includes("Random Forest")
                    ? "Recommended by AutoML as the best model for your dataset"
                    : "Selected based on AutoML analysis of your dataset"}
                </p>
              </div>
            </div>

            <div style={styles.taskTypeBadge}>
              {trainResult.task_type === "classification" ? "🏷️" : "📈"}{" "}
              {trainResult.task_type.charAt(0).toUpperCase() +
                trainResult.task_type.slice(1)}
            </div>

            <div style={styles.metricsGrid}>
              {trainResult.task_type === "classification" ? (
                <>
                  <MetricCard
                    label="Accuracy"
                    value={`${(trainResult.metrics.accuracy * 100).toFixed(1)}%`}
                    color="#10b981"
                    description="Out of 100 predictions, this many were correct"
                  />
                  <MetricCard
                    label="F1 Score"
                    value={`${(trainResult.metrics.f1_score * 100).toFixed(1)}%`}
                    color="#6366f1"
                    description="Balance between catching all cases and being precise"
                  />
                </>
              ) : (
                <>
                  <MetricCard
                    label="R² Score"
                    value={trainResult.metrics.r2?.toFixed(4)}
                    color="#10b981"
                    description="How well the model fits your data. Closer to 1.0 = better"
                  />
                  <MetricCard
                    label="MAE"
                    value={trainResult.metrics.mae?.toFixed(4)}
                    color="#f59e0b"
                    description="Average prediction error. Lower = more accurate"
                  />
                  <MetricCard
                    label="RMSE"
                    value={trainResult.metrics.rmse?.toFixed(4)}
                    color="#ef4444"
                    description="Penalizes large errors more. Lower = better"
                  />
                </>
              )}
            </div>

            {trainResult.feature_importance &&
              trainResult.feature_importance.length > 0 && (
                <div style={styles.chartSection}>
                  <h3 style={styles.chartLabel}>Top Important Features</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                      data={trainResult.feature_importance}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(99,102,241,0.1)"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        domain={[0, "auto"]}
                      />
                      <YAxis
                        type="category"
                        dataKey="feature"
                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                        width={70}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0d1424",
                          border: "1px solid rgba(99,102,241,0.2)",
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: "#f1f5f9" }}
                        formatter={(val) => [val.toFixed(4), "Importance"]}
                      />
                      <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                        {trainResult.feature_importance.map((_, i) => (
                          <Cell
                            key={i}
                            fill={
                              [
                                "#6366f1",
                                "#8b5cf6",
                                "#10b981",
                                "#f59e0b",
                                "#ef4444",
                              ][i % 5]
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

            {trainResult.groq_explanation && (
              <div style={styles.explanationBox}>
                <p style={styles.explanationLabel}>🤖 AI Explanation</p>
                <ReactMarkdown>{trainResult.groq_explanation}</ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* Step 3 */}
        {trainResult && (
          <div style={styles.section}>
            <div style={styles.stepBadge}>Step 3</div>
            <h2 style={styles.sectionTitle}>Make a Prediction</h2>
            <p style={styles.hint}>
              Enter values for each feature to predict{" "}
              <strong style={{ color: "#a5b4fc" }}>{targetCol}</strong>
            </p>

            <div style={styles.inputGrid}>
              {(trainResult.feature_columns || []).map((col) => {
                const uniqueVals = trainResult.column_unique_values?.[col];
                return (
                  <div key={col} style={styles.inputGroup}>
                    <label style={styles.inputLabel}>
                      {col}
                      {uniqueVals && (
                        <span style={styles.categoricalBadge}>categorical</span>
                      )}
                    </label>
                    {uniqueVals ? (
                      <select
                        style={styles.inputField}
                        value={inputValues[col] || ""}
                        onChange={(e) =>
                          setInputValues((prev) => ({
                            ...prev,
                            [col]: e.target.value,
                          }))
                        }
                      >
                        <option value="">Select {col}...</option>
                        {uniqueVals.map((val) => (
                          <option key={val} value={val}>
                            {val}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        style={styles.inputField}
                        type="text"
                        placeholder={`Enter ${col}`}
                        value={inputValues[col] || ""}
                        onChange={(e) =>
                          setInputValues((prev) => ({
                            ...prev,
                            [col]: e.target.value,
                          }))
                        }
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <button
              style={{ ...styles.predictButton, opacity: predicting ? 0.6 : 1 }}
              onClick={handlePredict}
              disabled={predicting}
            >
              {predicting ? "Predicting..." : "🔮 Predict"}
            </button>

            {predictError && <p style={styles.error}>{predictError}</p>}

            {prediction && (
              <div style={styles.predictionResult}>
                <div style={styles.predictionHeader}>
                  <span style={styles.predictionLabel}>
                    Predicted {targetCol}
                  </span>
                  <span style={styles.predictionValue}>
                    {prediction.prediction}
                  </span>
                </div>
                {prediction.confidence !== null &&
                  prediction.confidence !== undefined && (
                    <div style={styles.confidenceBar}>
                      <span style={styles.confidenceLabel}>
                        Confidence: {(prediction.confidence * 100).toFixed(1)}%
                      </span>
                      <div style={styles.confidenceTrack}>
                        <div
                          style={{
                            ...styles.confidenceFill,
                            width: `${prediction.confidence * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                {prediction.groq_explanation && (
                  <div style={{ ...styles.explanationBox, marginTop: "16px" }}>
                    <p style={styles.explanationLabel}>🤖 AI Explanation</p>
                    <ReactMarkdown>{prediction.groq_explanation}</ReactMarkdown>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, color, description }) {
  return (
    <div style={styles.metricCard}>
      <span style={styles.metricLabel}>{label}</span>
      <span style={{ ...styles.metricValue, color }}>{value}</span>
      {description && (
        <span style={styles.metricDescription}>{description}</span>
      )}
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
    left: "-200px",
    width: "500px",
    height: "500px",
    background:
      "radial-gradient(ellipse, rgba(99,102,241,0.05) 0%, transparent 70%)",
    pointerEvents: "none",
    zIndex: 0,
  },
  content: { position: "relative", zIndex: 1, padding: "32px" },

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
  headerMain: { display: "flex", alignItems: "center", gap: "14px" },
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

  // Section
  section: {
    backgroundColor: "rgba(15,23,42,0.8)",
    borderRadius: "14px",
    padding: "28px",
    marginBottom: "20px",
    position: "relative",
    border: "1px solid rgba(99,102,241,0.1)",
  },
  stepBadge: {
    position: "absolute",
    top: "-12px",
    left: "20px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    fontSize: "0.72rem",
    fontWeight: "700",
    padding: "4px 14px",
    borderRadius: "20px",
    letterSpacing: "0.06em",
    boxShadow: "0 0 10px rgba(99,102,241,0.3)",
  },
  sectionTitle: {
    fontSize: "1rem",
    fontWeight: "700",
    color: "#cbd5e1",
    marginBottom: "8px",
    marginTop: "4px",
  },
  hint: {
    color: "#475569",
    fontSize: "0.88rem",
    marginBottom: "16px",
    lineHeight: "1.5",
  },
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
  trainButton: {
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "12px 24px",
    fontSize: "0.92rem",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 0 12px rgba(16,185,129,0.25)",
  },
  error: { color: "#f87171", fontSize: "0.88rem", marginTop: "12px" },
  learningBox: {
    marginTop: "20px",
    backgroundColor: "rgba(99,102,241,0.05)",
    borderRadius: "10px",
    padding: "16px 20px",
    border: "1px solid rgba(99,102,241,0.12)",
  },
  learningTitle: {
    color: "#64748b",
    fontSize: "0.85rem",
    marginBottom: "12px",
    lineHeight: "1.5",
  },
  chipsRow: { display: "flex", flexWrap: "wrap", gap: "8px" },
  chip: {
    backgroundColor: "rgba(99,102,241,0.08)",
    color: "#94a3b8",
    border: "1px solid rgba(99,102,241,0.15)",
    borderRadius: "20px",
    padding: "4px 12px",
    fontSize: "0.78rem",
    fontWeight: "500",
  },
  modelUsedBanner: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
    background:
      "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08))",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: "10px",
    padding: "14px 18px",
    marginBottom: "20px",
  },
  modelUsedIcon: { fontSize: "1.4rem", flexShrink: 0 },
  modelUsedTitle: {
    color: "#f1f5f9",
    fontSize: "0.88rem",
    fontWeight: "600",
    marginBottom: "4px",
  },
  modelUsedText: { color: "#475569", fontSize: "0.8rem", lineHeight: "1.4" },
  taskTypeBadge: {
    display: "inline-block",
    backgroundColor: "rgba(99,102,241,0.08)",
    border: "1px solid rgba(99,102,241,0.15)",
    borderRadius: "20px",
    padding: "6px 16px",
    fontSize: "0.82rem",
    color: "#a5b4fc",
    marginBottom: "20px",
    fontWeight: "600",
  },
  metricsGrid: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "24px",
  },
  metricCard: {
    backgroundColor: "rgba(10,15,30,0.8)",
    borderRadius: "12px",
    padding: "20px 24px",
    flex: "1",
    minWidth: "140px",
    textAlign: "center",
    border: "1px solid rgba(99,102,241,0.1)",
  },
  metricLabel: {
    display: "block",
    color: "#475569",
    fontSize: "0.75rem",
    fontWeight: "700",
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  metricValue: { fontSize: "1.8rem", fontWeight: "700" },
  metricDescription: {
    display: "block",
    color: "#334155",
    fontSize: "0.72rem",
    marginTop: "8px",
    lineHeight: "1.4",
  },
  chartSection: { marginBottom: "24px" },
  chartLabel: {
    color: "#64748b",
    fontSize: "0.85rem",
    fontWeight: "600",
    marginBottom: "12px",
  },
  explanationBox: {
    background: "rgba(99,102,241,0.05)",
    borderRadius: "10px",
    padding: "18px 20px",
    borderLeft: "3px solid #6366f1",
  },
  explanationLabel: {
    color: "#6366f1",
    fontSize: "0.75rem",
    fontWeight: "700",
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  explanationText: { color: "#94a3b8", lineHeight: "1.7", fontSize: "0.9rem" },
  inputGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "14px",
    marginBottom: "20px",
  },
  inputGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  inputLabel: { color: "#64748b", fontSize: "0.8rem", fontWeight: "500" },
  inputField: {
    backgroundColor: "rgba(10,15,30,0.8)",
    color: "#f1f5f9",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "0.88rem",
    outline: "none",
  },
  categoricalBadge: {
    marginLeft: "8px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    fontSize: "0.68rem",
    padding: "2px 6px",
    borderRadius: "8px",
    fontWeight: "700",
  },
  predictButton: {
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "12px 28px",
    fontSize: "0.92rem",
    fontWeight: "600",
    cursor: "pointer",
    marginBottom: "20px",
    boxShadow: "0 0 16px rgba(99,102,241,0.3)",
  },
  predictionResult: {
    backgroundColor: "rgba(10,15,30,0.8)",
    borderRadius: "12px",
    padding: "24px",
    border: "1px solid rgba(16,185,129,0.2)",
  },
  predictionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  predictionLabel: { color: "#64748b", fontSize: "0.88rem" },
  predictionValue: { fontSize: "2rem", fontWeight: "700", color: "#10b981" },
  confidenceBar: { marginTop: "8px" },
  confidenceLabel: {
    color: "#64748b",
    fontSize: "0.8rem",
    marginBottom: "6px",
    display: "block",
  },
  confidenceTrack: {
    backgroundColor: "rgba(99,102,241,0.1)",
    borderRadius: "6px",
    height: "8px",
    overflow: "hidden",
  },
  confidenceFill: {
    background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
    height: "100%",
    borderRadius: "6px",
    transition: "width 0.6s ease",
  },
};
