import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import DatasetNav from "../components/DatasetNav";

const BASE_URL = import.meta.env.VITE_API_URL;

export default function ExportReport({ user }) {
  const { datasetId } = useParams();
  const navigate = useNavigate();

  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMetadata();
  }, [datasetId]);

  async function getAuthHeader() {
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
  }

  async function fetchMetadata() {
    try {
      setLoading(true);
      const headers = await getAuthHeader();
      const res = await axios.get(`${BASE_URL}/datasets/${datasetId}`, {
        headers,
      });
      setMetadata(res.data);
    } catch (err) {
      setError("Failed to load dataset info.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    try {
      setDownloading(true);
      setError("");
      setDownloadSuccess(false);
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
      setDownloadSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Failed to generate report. Please try again.",
      );
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <div style={styles.center}>
        <div style={styles.loadingPulse}>
          <span style={styles.loadingIcon}>📄</span>
          <p style={{ color: "#64748b" }}>Loading report info...</p>
        </div>
      </div>
    );
  }

  const hasML = !!metadata?.ml_results;
  const hasAutoML = !!metadata?.automl_results;

  return (
    <div style={styles.container}>
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
            <div style={styles.headerIconBox}>📄</div>
            <div>
              <h1 style={styles.title}>Export Report</h1>
              <p style={styles.subtitle}>
                Download a comprehensive PDF analysis report for your dataset
              </p>
            </div>
          </div>
        </div>

        {/* Report Card */}
        <div style={styles.reportCard}>
          {/* Report Info */}
          <div style={styles.reportInfo}>
            <div style={styles.reportIconLarge}>📊</div>
            <div>
              <h2 style={styles.reportTitle}>InsightIQ Analysis Report</h2>
              <div style={styles.reportMeta}>
                <span style={styles.metaBadge}>
                  📁 {metadata?.filename || "Dataset"}
                </span>
                <span style={styles.metaBadge}>
                  📊 {metadata?.row_count || 0} rows
                </span>
                <span style={styles.metaBadge}>
                  🗂 {metadata?.col_count || 0} columns
                </span>
              </div>
            </div>
          </div>

          <div style={styles.divider} />

          {/* Contents */}
          <p style={styles.contentsTitle}>REPORT CONTENTS</p>
          <div style={styles.sectionsList}>
            <ReportSection
              icon="📊"
              title="Dataset Overview"
              description="Basic stats, column analysis, and data types"
              included={true}
            />
            <ReportSection
              icon="🤖"
              title="AI Summary"
              description="Groq-generated plain-English dataset summary"
              included={!!metadata?.groq_summary}
            />
            <ReportSection
              icon="🧠"
              title="ML Prediction Results"
              description="Model metrics, feature importance, and AI explanation"
              included={hasML}
            />
            <ReportSection
              icon="⚡"
              title="AutoML Comparison"
              description="Multi-model comparison table and best model analysis"
              included={hasAutoML}
            />
          </div>

          {/* Tip */}
          {(!hasML || !hasAutoML) && (
            <div style={styles.tipBox}>
              <span style={styles.tipIcon}>💡</span>
              <p style={styles.tipText}>
                {!hasML && !hasAutoML
                  ? "Run ML Prediction and AutoML to include their results in the report."
                  : !hasML
                    ? "Run ML Prediction to include model results in the report."
                    : "Run AutoML to include model comparison in the report."}
              </p>
            </div>
          )}

          <div style={styles.divider} />

          {/* Download */}
          <div style={styles.downloadSection}>
            <button
              style={{
                ...styles.downloadButton,
                opacity: downloading ? 0.6 : 1,
              }}
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? "⏳ Generating PDF..." : "⬇️ Download PDF Report"}
            </button>
            <p style={styles.downloadHint}>
              PDF format · Includes all available analysis sections
            </p>
          </div>

          {/* Success */}
          {downloadSuccess && (
            <div style={styles.successBox}>
              <span style={styles.successIcon}>✅</span>
              <div>
                <p style={styles.successTitle}>Report downloaded!</p>
                <p style={styles.successText}>
                  Check your Downloads folder for{" "}
                  <strong>InsightIQ_Report_{datasetId.slice(0, 8)}.pdf</strong>
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={styles.errorBox}>
              <span>⚠️</span>
              <p style={styles.errorText}>{error}</p>
            </div>
          )}
        </div>

        {/* Quick Nav */}
        <div style={styles.navSection}>
          <p style={styles.navTitle}>Need to add more data to your report?</p>
          <div style={styles.navButtons}>
            {!hasML && (
              <button
                style={styles.navButtonGreen}
                onClick={() => navigate(`/ml/${datasetId}`)}
              >
                🧠 Run ML Prediction
              </button>
            )}
            {!hasAutoML && (
              <button
                style={styles.navButtonAmber}
                onClick={() => navigate(`/automl/${datasetId}`)}
              >
                ⚡ Run AutoML
              </button>
            )}
            <button
              style={styles.navButtonIndigo}
              onClick={() => navigate(`/visualizations/${datasetId}`)}
            >
              📊 View Charts
            </button>
            <button
              style={styles.navButtonCyan}
              onClick={() => navigate(`/chatbot/${datasetId}`)}
            >
              💬 AI Chatbot
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportSection({ icon, title, description, included }) {
  return (
    <div
      style={{
        ...styles.sectionItem,
        opacity: included ? 1 : 0.45,
        borderColor: included
          ? "rgba(99,102,241,0.15)"
          : "rgba(99,102,241,0.05)",
      }}
    >
      <div
        style={{
          ...styles.sectionIconBox,
          backgroundColor: included
            ? "rgba(99,102,241,0.1)"
            : "rgba(99,102,241,0.04)",
        }}
      >
        {icon}
      </div>
      <div style={styles.sectionInfo}>
        <p style={styles.sectionItemTitle}>
          {title}
          {included ? (
            <span style={styles.includedBadge}>✓ Included</span>
          ) : (
            <span style={styles.notIncludedBadge}>Not yet run</span>
          )}
        </p>
        <p style={styles.sectionDesc}>{description}</p>
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

  // Report Card
  reportCard: {
    backgroundColor: "rgba(15,23,42,0.8)",
    borderRadius: "16px",
    padding: "32px",
    marginBottom: "20px",
    border: "1px solid rgba(99,102,241,0.15)",
  },
  reportInfo: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "20px",
  },
  reportIconLarge: {
    fontSize: "2.5rem",
    width: "64px",
    height: "64px",
    backgroundColor: "rgba(99,102,241,0.1)",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(99,102,241,0.2)",
    flexShrink: 0,
  },
  reportTitle: {
    fontSize: "1.1rem",
    fontWeight: "700",
    color: "#f1f5f9",
    marginBottom: "8px",
  },
  reportMeta: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  metaBadge: {
    backgroundColor: "rgba(99,102,241,0.08)",
    color: "#64748b",
    fontSize: "0.75rem",
    padding: "3px 10px",
    borderRadius: "20px",
    border: "1px solid rgba(99,102,241,0.1)",
  },
  divider: {
    height: "1px",
    background:
      "linear-gradient(90deg, transparent, rgba(99,102,241,0.2), transparent)",
    margin: "20px 0",
  },
  contentsTitle: {
    color: "#475569",
    fontSize: "0.72rem",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "14px",
  },
  sectionsList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "20px",
  },
  sectionItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
    padding: "14px 16px",
    backgroundColor: "rgba(10,15,30,0.6)",
    borderRadius: "10px",
    border: "1px solid",
    transition: "opacity 0.3s",
  },
  sectionIconBox: {
    fontSize: "1.2rem",
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sectionInfo: { flex: 1 },
  sectionItemTitle: {
    color: "#f1f5f9",
    fontWeight: "600",
    fontSize: "0.88rem",
    marginBottom: "3px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  includedBadge: {
    color: "#10b981",
    fontSize: "0.7rem",
    fontWeight: "700",
    backgroundColor: "rgba(16,185,129,0.1)",
    border: "1px solid rgba(16,185,129,0.2)",
    padding: "2px 8px",
    borderRadius: "10px",
  },
  notIncludedBadge: {
    color: "#f59e0b",
    fontSize: "0.7rem",
    fontWeight: "700",
    backgroundColor: "rgba(245,158,11,0.1)",
    border: "1px solid rgba(245,158,11,0.2)",
    padding: "2px 8px",
    borderRadius: "10px",
  },
  sectionDesc: { color: "#475569", fontSize: "0.8rem", lineHeight: "1.4" },

  // Tip
  tipBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "14px 18px",
    backgroundColor: "rgba(99,102,241,0.05)",
    borderRadius: "10px",
    border: "1px solid rgba(99,102,241,0.15)",
    marginBottom: "4px",
  },
  tipIcon: { fontSize: "1rem", marginTop: "1px" },
  tipText: { color: "#64748b", fontSize: "0.83rem", lineHeight: "1.5" },

  // Download
  downloadSection: { textAlign: "center", padding: "12px 0" },
  downloadButton: {
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    padding: "16px 48px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    marginBottom: "10px",
    boxShadow: "0 0 24px rgba(99,102,241,0.3)",
    display: "block",
    margin: "0 auto 10px",
  },
  downloadHint: { color: "#475569", fontSize: "0.8rem" },

  // Success
  successBox: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "16px 20px",
    background:
      "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.1))",
    borderRadius: "10px",
    border: "1px solid rgba(16,185,129,0.25)",
    marginTop: "16px",
  },
  successIcon: { fontSize: "1.4rem" },
  successTitle: {
    color: "#10b981",
    fontWeight: "600",
    fontSize: "0.9rem",
    marginBottom: "2px",
  },
  successText: { color: "#6ee7b7", fontSize: "0.8rem" },

  // Error
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "14px 18px",
    backgroundColor: "rgba(127,29,29,0.3)",
    border: "1px solid rgba(248,113,113,0.2)",
    borderRadius: "10px",
    marginTop: "16px",
  },
  errorText: { color: "#fca5a5", fontSize: "0.9rem" },

  // Nav Section
  navSection: {
    backgroundColor: "rgba(15,23,42,0.8)",
    borderRadius: "14px",
    padding: "24px 28px",
    marginBottom: "24px",
    border: "1px solid rgba(99,102,241,0.1)",
  },
  navTitle: {
    color: "#64748b",
    fontSize: "0.85rem",
    fontWeight: "500",
    marginBottom: "16px",
  },
  navButtons: { display: "flex", gap: "10px", flexWrap: "wrap" },
  navButtonGreen: {
    background:
      "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.15))",
    color: "#10b981",
    border: "1px solid rgba(16,185,129,0.25)",
    borderRadius: "8px",
    padding: "9px 16px",
    fontSize: "0.85rem",
    fontWeight: "600",
    cursor: "pointer",
  },
  navButtonAmber: {
    background:
      "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.15))",
    color: "#f59e0b",
    border: "1px solid rgba(245,158,11,0.25)",
    borderRadius: "8px",
    padding: "9px 16px",
    fontSize: "0.85rem",
    fontWeight: "600",
    cursor: "pointer",
  },
  navButtonIndigo: {
    background:
      "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))",
    color: "#a5b4fc",
    border: "1px solid rgba(99,102,241,0.25)",
    borderRadius: "8px",
    padding: "9px 16px",
    fontSize: "0.85rem",
    fontWeight: "600",
    cursor: "pointer",
  },
  navButtonCyan: {
    background:
      "linear-gradient(135deg, rgba(6,182,212,0.15), rgba(8,145,178,0.15))",
    color: "#22d3ee",
    border: "1px solid rgba(6,182,212,0.25)",
    borderRadius: "8px",
    padding: "9px 16px",
    fontSize: "0.85rem",
    fontWeight: "600",
    cursor: "pointer",
  },
};
