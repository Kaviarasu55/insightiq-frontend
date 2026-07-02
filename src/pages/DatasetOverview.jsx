import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import DatasetNav from "../components/DatasetNav";

const BASE_URL = import.meta.env.VITE_API_URL;

export default function DatasetOverview({ user }) {
  const { datasetId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const passedData = location.state?.analysisData;
  const [data, setData] = useState(passedData || null);
  const [loading, setLoading] = useState(!passedData);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!passedData) fetchDataset();
  }, [datasetId]);

  async function getAuthHeader() {
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
  }

  async function fetchDataset() {
    try {
      setLoading(true);
      const headers = await getAuthHeader();
      const res = await axios.get(`${BASE_URL}/datasets/${datasetId}`, {
        headers,
      });
      setData(res.data);
    } catch (err) {
      setError("Failed to load dataset.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div style={styles.center}>Loading dataset...</div>;
  if (error) return <div style={styles.center}>{error}</div>;
  if (!data) return <div style={styles.center}>No data found.</div>;

  const previewRows = data.preview || data.sample_rows || [];
  const columnList = data.columns || data.column_analysis || [];

  return (
    <div style={styles.container}>
      <DatasetNav />

      {/* Page Glow */}
      <div style={styles.pageGlow} />

      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <button
            style={styles.backButton}
            onClick={() => navigate("/dashboard")}
          >
            ← Dashboard
          </button>
          <div style={styles.headerMain}>
            <div style={styles.fileIconBox}>📁</div>
            <div>
              <h1 style={styles.title}>
                {data.filename || "Dataset Overview"}
              </h1>
              <div style={styles.metaRow}>
                <span style={styles.metaBadge}>📊 {data.row_count} rows</span>
                <span style={styles.metaBadge}>
                  🗂 {data.col_count} columns
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Summary */}
        {data.groq_summary && (
          <div style={styles.summaryBox}>
            <div style={styles.summaryHeader}>
              <span style={styles.summaryIcon}>🤖</span>
              <h2 style={styles.summaryTitle}>AI Summary</h2>
            </div>
            <p style={styles.summaryText}>{data.groq_summary}</p>
          </div>
        )}

        {/* Preview Table */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Data Preview</h2>
            <span style={styles.sectionBadge}>
              first {previewRows.length} rows
            </span>
          </div>
          {previewRows.length === 0 ? (
            <p style={styles.hint}>No preview available.</p>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {Object.keys(previewRows[0]).map((col) => (
                      <th key={col} style={styles.th}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr
                      key={i}
                      style={i % 2 === 0 ? styles.trEven : styles.trOdd}
                    >
                      {Object.values(row).map((val, j) => (
                        <td key={j} style={styles.td}>
                          {val === null ? (
                            <span style={styles.null}>null</span>
                          ) : (
                            String(val)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Column Analysis */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Column Analysis</h2>
            <span style={styles.sectionBadge}>{columnList.length} columns</span>
          </div>
          {columnList.length === 0 ? (
            <p style={styles.hint}>No column analysis available.</p>
          ) : (
            <div style={styles.cardsGrid}>
              {columnList.map((col) => (
                <ColumnCard key={col.name} col={col} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ColumnCard({ col }) {
  const typeConfig = {
    numeric: {
      color: "#6366f1",
      bg: "rgba(99,102,241,0.1)",
      border: "rgba(99,102,241,0.2)",
    },
    categorical: {
      color: "#8b5cf6",
      bg: "rgba(139,92,246,0.1)",
      border: "rgba(139,92,246,0.2)",
    },
    datetime: {
      color: "#10b981",
      bg: "rgba(16,185,129,0.1)",
      border: "rgba(16,185,129,0.2)",
    },
  };
  const config = typeConfig[col.type] || {
    color: "#64748b",
    bg: "rgba(100,116,139,0.1)",
    border: "rgba(100,116,139,0.2)",
  };

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <span style={styles.colName}>{col.name}</span>
        <span
          style={{
            ...styles.typeBadge,
            color: config.color,
            backgroundColor: config.bg,
            border: `1px solid ${config.border}`,
          }}
        >
          {col.type}
        </span>
      </div>

      <div style={styles.statRow}>
        <span style={styles.statLabel}>Nulls</span>
        <span style={styles.statValue}>
          {col.null_count} ({col.null_percentage}%)
        </span>
      </div>
      <div style={styles.statRow}>
        <span style={styles.statLabel}>Unique</span>
        <span style={styles.statValue}>{col.unique_count}</span>
      </div>

      {col.type === "numeric" && (
        <>
          <div style={styles.statDivider} />
          <div style={styles.statRow}>
            <span style={styles.statLabel}>Mean</span>
            <span style={styles.statValue}>{col.mean}</span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statLabel}>Median</span>
            <span style={styles.statValue}>{col.median}</span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statLabel}>Min / Max</span>
            <span style={styles.statValue}>
              {col.min} / {col.max}
            </span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statLabel}>Std Dev</span>
            <span style={styles.statValue}>{col.std}</span>
          </div>
        </>
      )}

      {col.type === "categorical" && col.top_values && (
        <>
          <div style={styles.statDivider} />
          <div style={styles.statRow}>
            <span style={styles.statLabel}>Top Values</span>
            <span style={styles.statValue}>
              {col.top_values
                .map((item) => `${item.value} (${item.count})`)
                .join(", ")}
            </span>
          </div>
        </>
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
    fontSize: "1rem",
  },
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
    marginBottom: "20px",
    fontSize: "0.83rem",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  },
  headerMain: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  fileIconBox: {
    fontSize: "2rem",
    width: "56px",
    height: "56px",
    backgroundColor: "rgba(99,102,241,0.1)",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(99,102,241,0.2)",
    flexShrink: 0,
  },
  title: {
    fontSize: "1.6rem",
    fontWeight: "700",
    color: "#f1f5f9",
    marginBottom: "8px",
    letterSpacing: "-0.02em",
  },
  metaRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  metaBadge: {
    backgroundColor: "rgba(99,102,241,0.08)",
    color: "#64748b",
    fontSize: "0.78rem",
    padding: "3px 10px",
    borderRadius: "20px",
    border: "1px solid rgba(99,102,241,0.12)",
  },

  // Summary
  summaryBox: {
    background:
      "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.08) 100%)",
    borderRadius: "12px",
    padding: "20px 24px",
    marginBottom: "28px",
    border: "1px solid rgba(99,102,241,0.15)",
    borderLeft: "3px solid #6366f1",
  },
  summaryHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "12px",
  },
  summaryIcon: { fontSize: "1.1rem" },
  summaryTitle: {
    fontSize: "0.95rem",
    fontWeight: "600",
    color: "#a5b4fc",
  },
  summaryText: {
    color: "#94a3b8",
    lineHeight: "1.8",
    fontSize: "0.92rem",
  },

  // Sections
  section: { marginBottom: "36px" },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
  },
  sectionTitle: {
    fontSize: "1rem",
    fontWeight: "700",
    color: "#cbd5e1",
  },
  sectionBadge: {
    backgroundColor: "rgba(99,102,241,0.08)",
    color: "#6366f1",
    fontSize: "0.75rem",
    fontWeight: "600",
    padding: "2px 10px",
    borderRadius: "20px",
    border: "1px solid rgba(99,102,241,0.15)",
  },
  hint: { color: "#475569", fontSize: "0.9rem" },

  // Table
  tableWrapper: {
    overflowX: "auto",
    borderRadius: "10px",
    border: "1px solid rgba(99,102,241,0.1)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.85rem",
  },
  th: {
    background:
      "linear-gradient(180deg, rgba(99,102,241,0.15) 0%, rgba(99,102,241,0.08) 100%)",
    color: "#a5b4fc",
    padding: "12px 16px",
    textAlign: "left",
    whiteSpace: "nowrap",
    fontWeight: "600",
    fontSize: "0.8rem",
    letterSpacing: "0.03em",
    borderBottom: "1px solid rgba(99,102,241,0.15)",
  },
  trEven: { backgroundColor: "rgba(15,23,42,0.6)" },
  trOdd: { backgroundColor: "rgba(10,15,30,0.6)" },
  td: {
    padding: "10px 16px",
    color: "#cbd5e1",
    borderBottom: "1px solid rgba(99,102,241,0.05)",
    fontSize: "0.85rem",
  },
  null: { color: "#334155", fontStyle: "italic" },

  // Column Cards
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: "12px",
  },
  card: {
    backgroundColor: "rgba(15,23,42,0.8)",
    borderRadius: "12px",
    padding: "16px",
    border: "1px solid rgba(99,102,241,0.1)",
    transition: "border-color 0.2s",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
  },
  colName: {
    fontWeight: "600",
    color: "#f1f5f9",
    fontSize: "0.92rem",
  },
  typeBadge: {
    fontSize: "0.7rem",
    padding: "2px 8px",
    borderRadius: "10px",
    fontWeight: "600",
  },
  statDivider: {
    height: "1px",
    backgroundColor: "rgba(99,102,241,0.08)",
    margin: "10px 0",
  },
  statRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "6px",
  },
  statLabel: { color: "#475569", fontSize: "0.8rem" },
  statValue: {
    color: "#94a3b8",
    fontSize: "0.8rem",
    textAlign: "right",
    maxWidth: "60%",
  },
};
