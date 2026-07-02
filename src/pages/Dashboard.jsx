import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";

const BASE_URL = import.meta.env.VITE_API_URL;

export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState([]);
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchDatasets();
  }, []);

  async function getAuthHeader() {
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
  }

  async function fetchDatasets() {
    try {
      setLoadingDatasets(true);
      const headers = await getAuthHeader();
      const res = await axios.get(`${BASE_URL}/datasets`, { headers });
      setDatasets(res.data.datasets || []);
    } catch (err) {
      setError("Failed to load datasets. Please refresh.");
    } finally {
      setLoadingDatasets(false);
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) {
      setError("Only CSV files are supported.");
      return;
    }
    try {
      setUploading(true);
      setError("");
      const formData = new FormData();
      formData.append("file", file);
      const headers = await getAuthHeader();
      const res = await axios.post(`${BASE_URL}/upload`, formData, { headers });
      navigate(`/overview/${res.data.dataset_id}`, {
        state: { analysisData: res.data },
      });
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      fileInputRef.current.value = "";
    }
  }

  async function handleDelete(datasetId, filename) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${filename}"?\n\nThis will permanently delete the dataset and all its analysis, chat history, and ML results.`,
    );
    if (!confirmed) return;
    try {
      const headers = await getAuthHeader();
      await axios.delete(`${BASE_URL}/datasets/${datasetId}`, { headers });
      setDatasets((prev) => prev.filter((ds) => ds.id !== datasetId));
    } catch (err) {
      setError("Failed to delete dataset. Please try again.");
    }
  }

  async function handleDownloadReport(datasetId) {
    try {
      const headers = await getAuthHeader();
      const res = await axios.get(`${BASE_URL}/report/${datasetId}`, {
        headers,
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `InsightIQ_Report_${datasetId.slice(0, 8)}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Report download failed.");
    }
  }

  const features = [
    {
      icon: "📊",
      label: "Auto Charts",
      desc: "Histograms, bar charts, scatter plots — generated automatically",
      color: "#6366f1",
    },
    {
      icon: "💬",
      label: "AI Chatbot",
      desc: "Ask questions about your data in plain English",
      color: "#8b5cf6",
    },
    {
      icon: "🧠",
      label: "ML Predictions",
      desc: "Train models and predict outcomes — no coding needed",
      color: "#06b6d4",
    },
    {
      icon: "📄",
      label: "PDF Report",
      desc: "Download a full analysis report with AI explanations",
      color: "#10b981",
    },
  ];

  return (
    <div style={styles.container}>
      <Navbar user={user} />

      {/* Hero Section */}
      <div style={styles.hero}>
        <div style={styles.heroGlow} />
        <div style={styles.heroContent}>
          <div style={styles.heroBadge}>✨ AI-Powered Analytics</div>
          <h1 style={styles.heroTitle}>
            Turn your data into
            <span style={styles.heroTitleAccent}> insights</span>
            {" — instantly"}
          </h1>
          <p style={styles.heroSubtitle}>
            Upload any CSV and InsightIQ will automatically analyze it,
            visualize it, explain it in plain English, and let you ask questions
            about it — no data science knowledge needed.
          </p>

          {/* Feature Cards */}
          <div style={styles.featureCards}>
            {features.map((f) => (
              <div key={f.label} style={styles.featureCard}>
                <div
                  style={{
                    ...styles.featureIconBox,
                    background: `linear-gradient(135deg, ${f.color}22, ${f.color}11)`,
                    border: `1px solid ${f.color}33`,
                  }}
                >
                  <span style={styles.featureIcon}>{f.icon}</span>
                </div>
                <p style={styles.featureLabel}>{f.label}</p>
                <p style={styles.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Upload Button */}
          <div style={styles.uploadRow}>
            <button
              style={{
                ...styles.uploadButton,
                opacity: uploading ? 0.7 : 1,
              }}
              onClick={() => fileInputRef.current.click()}
              disabled={uploading}
            >
              {uploading ? "⏳ Uploading..." : <>⬆ Upload CSV to Get Started</>}
            </button>
            <p style={styles.uploadHint}>Max 50,000 rows · CSV files only</p>
          </div>

          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />
        </div>
      </div>

      {/* Error */}
      {error && <div style={styles.errorBox}>⚠️ {error}</div>}

      {/* Datasets Section */}
      <div style={styles.datasetsSection}>
        <div style={styles.datasetsSectionHeader}>
          <h2 style={styles.sectionTitle}>Your Datasets</h2>
          <span style={styles.datasetCount}>
            {datasets?.length ?? 0} dataset
            {(datasets?.length ?? 0) !== 1 ? "s" : ""}
          </span>
        </div>

        {loadingDatasets ? (
          <div style={styles.emptyState}>
            <p style={styles.hint}>Loading your datasets...</p>
          </div>
        ) : (datasets?.length ?? 0) === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>📂</span>
            <p style={styles.emptyText}>No datasets yet.</p>
            <p style={styles.hint}>Upload a CSV above to get started.</p>
          </div>
        ) : (
          datasets.map((ds) => (
            <div key={ds.id} style={styles.datasetCard}>
              <div style={styles.datasetLeft}>
                <div style={styles.datasetIconBox}>📊</div>
                <div style={styles.datasetInfo}>
                  <p style={styles.filename}>{ds.filename}</p>
                  <div style={styles.metaRow}>
                    <span style={styles.metaBadge}>{ds.row_count} rows</span>
                    <span style={styles.metaBadge}>{ds.col_count} columns</span>
                    <span style={styles.metaDate}>{ds.uploaded_at}</span>
                  </div>
                </div>
              </div>
              <div style={styles.actions}>
                <button
                  style={styles.openButton}
                  onClick={() => navigate(`/overview/${ds.id}`)}
                >
                  Open Analysis
                </button>
                <button
                  style={styles.reportButton}
                  onClick={() => handleDownloadReport(ds.id)}
                >
                  📄 Report
                </button>
                <button
                  style={styles.deleteButton}
                  onClick={() => handleDelete(ds.id, ds.filename)}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
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
  },

  // Hero
  hero: {
    position: "relative",
    padding: "48px 32px 40px",
    overflow: "hidden",
    borderBottom: "1px solid rgba(99,102,241,0.1)",
  },
  heroGlow: {
    position: "absolute",
    top: "-100px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "600px",
    height: "300px",
    background:
      "radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  heroContent: {
    position: "relative",
    maxWidth: "900px",
  },
  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "rgba(99,102,241,0.1)",
    border: "1px solid rgba(99,102,241,0.2)",
    color: "#a5b4fc",
    fontSize: "0.8rem",
    fontWeight: "600",
    padding: "4px 12px",
    borderRadius: "20px",
    marginBottom: "16px",
    letterSpacing: "0.02em",
  },
  heroTitle: {
    fontSize: "2rem",
    fontWeight: "800",
    color: "#f1f5f9",
    marginBottom: "12px",
    lineHeight: "1.2",
    letterSpacing: "-0.02em",
  },
  heroTitleAccent: {
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  heroSubtitle: {
    color: "#64748b",
    fontSize: "0.95rem",
    lineHeight: "1.7",
    marginBottom: "32px",
    maxWidth: "700px",
  },

  // Feature Cards
  featureCards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
    gap: "12px",
    marginBottom: "32px",
  },
  featureCard: {
    backgroundColor: "rgba(15,23,42,0.8)",
    borderRadius: "12px",
    padding: "16px",
    border: "1px solid rgba(99,102,241,0.1)",
    backdropFilter: "blur(10px)",
    transition: "border-color 0.2s",
  },
  featureIconBox: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "12px",
  },
  featureIcon: {
    fontSize: "1.3rem",
  },
  featureLabel: {
    fontWeight: "700",
    color: "#f1f5f9",
    marginBottom: "6px",
    fontSize: "0.92rem",
  },
  featureDesc: {
    color: "#475569",
    fontSize: "0.8rem",
    lineHeight: "1.5",
  },

  // Upload
  uploadRow: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
  },
  uploadButton: {
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "13px 28px",
    fontSize: "0.95rem",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 0 20px rgba(99,102,241,0.3)",
    transition: "opacity 0.2s, transform 0.1s",
    letterSpacing: "0.01em",
  },
  uploadHint: {
    color: "#475569",
    fontSize: "0.82rem",
  },

  // Error
  errorBox: {
    margin: "16px 32px 0",
    backgroundColor: "rgba(127,29,29,0.3)",
    border: "1px solid rgba(248,113,113,0.2)",
    color: "#fca5a5",
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "0.9rem",
  },

  // Datasets Section
  datasetsSection: {
    padding: "32px",
  },
  datasetsSectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
  },
  sectionTitle: {
    fontSize: "1.1rem",
    fontWeight: "700",
    color: "#cbd5e1",
  },
  datasetCount: {
    backgroundColor: "rgba(99,102,241,0.1)",
    color: "#6366f1",
    fontSize: "0.78rem",
    fontWeight: "600",
    padding: "2px 10px",
    borderRadius: "20px",
    border: "1px solid rgba(99,102,241,0.2)",
  },

  // Empty state
  emptyState: {
    textAlign: "center",
    padding: "48px 20px",
    backgroundColor: "rgba(15,23,42,0.5)",
    borderRadius: "12px",
    border: "1px dashed rgba(99,102,241,0.2)",
  },
  emptyIcon: {
    fontSize: "2.5rem",
    display: "block",
    marginBottom: "12px",
  },
  emptyText: {
    color: "#cbd5e1",
    fontWeight: "600",
    marginBottom: "4px",
  },
  hint: {
    color: "#475569",
    fontSize: "0.9rem",
  },

  // Dataset Card
  datasetCard: {
    backgroundColor: "rgba(15,23,42,0.8)",
    borderRadius: "12px",
    padding: "18px 20px",
    marginBottom: "10px",
    display: "flex",
    flexDirection: "column",
    border: "1px solid rgba(99,102,241,0.1)",
    transition: "border-color 0.2s",
    gap: "12px",
  },
  datasetLeft: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  datasetIconBox: {
    fontSize: "1.4rem",
    width: "42px",
    height: "42px",
    backgroundColor: "rgba(99,102,241,0.1)",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    border: "1px solid rgba(99,102,241,0.15)",
  },
  datasetInfo: {
    flex: 1,
  },
  filename: {
    fontSize: "0.95rem",
    fontWeight: "600",
    color: "#f1f5f9",
    marginBottom: "6px",
  },
  metaRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  metaBadge: {
    backgroundColor: "rgba(99,102,241,0.08)",
    color: "#64748b",
    fontSize: "0.75rem",
    padding: "2px 8px",
    borderRadius: "20px",
    border: "1px solid rgba(99,102,241,0.1)",
  },
  metaDate: {
    color: "#475569",
    fontSize: "0.75rem",
  },
  actions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  openButton: {
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "8px 16px",
    fontSize: "0.85rem",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 0 12px rgba(99,102,241,0.2)",
  },
  reportButton: {
    backgroundColor: "rgba(16,185,129,0.1)",
    color: "#10b981",
    border: "1px solid rgba(16,185,129,0.2)",
    borderRadius: "8px",
    padding: "8px 16px",
    fontSize: "0.85rem",
    fontWeight: "600",
    cursor: "pointer",
  },
  deleteButton: {
    backgroundColor: "transparent",
    color: "#f87171",
    border: "1px solid rgba(248,113,113,0.2)",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "1rem",
    cursor: "pointer",
  },
};
