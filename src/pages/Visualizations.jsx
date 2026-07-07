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
  ScatterChart,
  Scatter,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  Cell,
} from "recharts";
import DatasetNav from "../components/DatasetNav";

const BASE_URL = import.meta.env.VITE_API_URL;

function typeColor(type) {
  const colors = {
    histogram: "#6366f1",
    bar: "#8b5cf6",
    scatter: "#10b981",
    line: "#f59e0b",
    boxplot: "#f43f5e",
  };
  return colors[type] || "#64748b";
}

export default function Visualizations({ user }) {
  const { datasetId } = useParams();
  const navigate = useNavigate();

  const [charts, setCharts] = useState([]);
  const [columnAnalysis, setColumnAnalysis] = useState([]);
  const [explanations, setExplanations] = useState({});
  const [loadingExpl, setLoadingExpl] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [manualXCol, setManualXCol] = useState("");
  const [manualYCol, setManualYCol] = useState("");
  const [manualChartType, setManualChartType] = useState("any");
  const [manualChart, setManualChart] = useState(null);
  const [manualExplanation, setManualExplanation] = useState("");
  const [manualLoading, setManualLoading] = useState(false);

  useEffect(() => {
    fetchCharts();
  }, [datasetId]);

  async function getAuthHeader() {
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
  }

  async function fetchCharts() {
    try {
      setLoading(true);
      const headers = await getAuthHeader();
      const res = await axios.get(`${BASE_URL}/visualize/${datasetId}`, {
        headers,
      });
      setCharts(res.data.charts || []);
      const cols = res.data.column_analysis || [];
      setColumnAnalysis(cols);
      if (cols.length > 0) setManualXCol(cols[0].name);
      if (cols.length > 1) setManualYCol(cols[1].name);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load charts.");
    } finally {
      setLoading(false);
    }
  }

  async function handleExplain(chart, index) {
    try {
      setLoadingExpl((prev) => ({ ...prev, [index]: true }));
      const headers = await getAuthHeader();
      const res = await axios.post(
        `${BASE_URL}/visualize/${datasetId}/explain`,
        {
          chart_type: chart.chart_type,
          column_name: chart.column || `${chart.x_col} vs ${chart.y_col}`,
          stats: chart.data,
        },
        { headers },
      );
      setExplanations((prev) => ({ ...prev, [index]: res.data.explanation }));
    } catch (err) {
      setExplanations((prev) => ({
        ...prev,
        [index]: "Explanation unavailable.",
      }));
    } finally {
      setLoadingExpl((prev) => ({ ...prev, [index]: false }));
    }
  }

  async function handleManualChart() {
    try {
      setManualLoading(true);
      setManualChart(null);
      setManualExplanation("");
      const headers = await getAuthHeader();
      const res = await axios.post(
        `${BASE_URL}/visualize/${datasetId}/manual`,
        { chart_type: manualChartType, x_col: manualXCol, y_col: manualYCol },
        { headers },
      );
      setManualChart(res.data);
      const explRes = await axios.post(
        `${BASE_URL}/visualize/${datasetId}/explain`,
        {
          chart_type: res.data.chart_type,
          column_name: `${manualXCol} vs ${manualYCol}`,
          stats: {},
        },
        { headers },
      );
      setManualExplanation(explRes.data.explanation);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to generate chart.");
    } finally {
      setManualLoading(false);
    }
  }

  if (loading)
    return (
      <div style={styles.center}>
        <div style={styles.loadingContent}>
          <span style={styles.loadingIcon}>📊</span>
          <p>Loading charts from your data...</p>
        </div>
      </div>
    );
  if (error) return <div style={styles.center}>{error}</div>;

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
            <div>
              <h1 style={styles.title}>Visualizations</h1>
              <p style={styles.subtitle}>
                <span style={styles.subtitleBadge}>
                  📊 {charts.length} charts
                </span>
                generated automatically from your data
              </p>
            </div>
          </div>
        </div>

        {/* Auto-generated charts */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Auto-Generated Charts</h2>
            <span style={styles.sectionBadge}>{charts.length} charts</span>
          </div>

          {charts.length === 0 && (
            <div style={styles.emptyState}>
              <p>No charts could be generated for this dataset.</p>
            </div>
          )}

          {charts.map((chart, index) => (
            <div key={index} style={styles.chartCard}>
              <div style={styles.chartHeader}>
                <h3 style={styles.chartTitle}>
                  {chart.column || `${chart.x_col} vs ${chart.y_col}`}
                </h3>
                <span
                  style={{
                    ...styles.typeBadge,
                    backgroundColor: `${typeColor(chart.chart_type)}22`,
                    color: typeColor(chart.chart_type),
                    border: `1px solid ${typeColor(chart.chart_type)}44`,
                  }}
                >
                  {chart.chart_type}
                </span>
              </div>

              <div style={styles.chartWrapper}>{renderChart(chart)}</div>

              {chart.reason && (
                <div style={styles.reasonBox}>
                  <p style={styles.reasonLabel}>💡 Why this chart?</p>
                  <p style={styles.reasonText}>{chart.reason}</p>
                </div>
              )}

              {!explanations[index] && (
                <button
                  style={styles.explainButton}
                  onClick={() => handleExplain(chart, index)}
                  disabled={loadingExpl[index]}
                >
                  {loadingExpl[index]
                    ? "Getting AI explanation..."
                    : "✨ Get detailed explanation"}
                </button>
              )}

              {explanations[index] && (
                <div style={styles.explanationBox}>
                  <p style={styles.explanationText}>{explanations[index]}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Custom Chart */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Custom Chart</h2>
          </div>
          <p style={styles.hint}>
            Select columns to visualize. Pick X for categories/values and Y for
            the metric to aggregate.
          </p>

          <div style={styles.customChartBox}>
            <div style={styles.manualControls}>
              <div style={styles.selectGroup}>
                <label style={styles.label}>Chart Type</label>
                <select
                  style={styles.select}
                  value={manualChartType}
                  onChange={(e) => setManualChartType(e.target.value)}
                >
                  <option value="any">Any (AI decides)</option>
                  <option value="histogram">Histogram</option>
                  <option value="bar">Bar Chart</option>
                  <option value="scatter">Scatter Plot</option>
                  <option value="line">Line Chart</option>
                </select>
              </div>

              <div style={styles.selectGroup}>
                <label style={styles.label}>
                  X Column (categories / values)
                </label>
                <select
                  style={styles.select}
                  value={manualXCol}
                  onChange={(e) => setManualXCol(e.target.value)}
                >
                  {columnAnalysis.map((col) => (
                    <option key={col.name} value={col.name}>
                      {col.name} ({col.type})
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.selectGroup}>
                <label style={styles.label}>Y Column (metric to show)</label>
                <select
                  style={styles.select}
                  value={manualYCol}
                  onChange={(e) => setManualYCol(e.target.value)}
                >
                  {columnAnalysis.map((col) => (
                    <option key={col.name} value={col.name}>
                      {col.name} ({col.type})
                    </option>
                  ))}
                </select>
              </div>

              <button
                style={styles.generateButton}
                onClick={handleManualChart}
                disabled={manualLoading}
              >
                {manualLoading ? "Generating..." : "⚡ Generate Chart"}
              </button>
            </div>
          </div>

          {manualChart && (
            <div style={styles.chartCard}>
              <div style={styles.chartHeader}>
                <h3 style={styles.chartTitle}>
                  {manualChart.x_col}
                  {manualChart.y_col && manualChart.y_col !== manualChart.x_col
                    ? ` vs ${manualChart.y_col}`
                    : ""}
                </h3>
                <span
                  style={{
                    ...styles.typeBadge,
                    backgroundColor: `${typeColor(manualChart.chart_type)}22`,
                    color: typeColor(manualChart.chart_type),
                    border: `1px solid ${typeColor(manualChart.chart_type)}44`,
                  }}
                >
                  {manualChart.chart_type}
                  {manualChart.ai_decided ? " · AI picked" : " · custom"}
                </span>
              </div>
              <div style={styles.chartWrapper}>{renderChart(manualChart)}</div>
              {manualExplanation && (
                <div style={styles.explanationBox}>
                  <p style={styles.explanationText}>{manualExplanation}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function renderChart(chart) {
  const { chart_type, data } = chart;

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <p style={{ color: "#64748b" }}>No data available for this chart.</p>
    );
  }

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: "#0d1424",
      border: "1px solid rgba(99,102,241,0.2)",
      borderRadius: "8px",
    },
    labelStyle: { color: "#f1f5f9" },
    itemStyle: { color: "#f1f5f9" },
  };

  if (chart_type === "histogram") {
    const COLORS = [
      "#6366f1",
      "#8b5cf6",
      "#a855f7",
      "#ec4899",
      "#ef4444",
      "#f97316",
      "#f59e0b",
      "#84cc16",
      "#10b981",
      "#06b6d4",
      "#3b82f6",
      "#0ea5e9",
    ];
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 20, left: 20, bottom: 45 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
          <XAxis
            dataKey="bin"
            tick={{ fill: "#64748b", fontSize: 11 }}
            angle={-30}
            textAnchor="end"
            height={60}
            label={{
              value: chart.column,
              position: "insideBottom",
              offset: -40,
              fill: "#475569",
            }}
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 12 }}
            label={{
              value: "Frequency",
              angle: -90,
              position: "insideLeft",
              fill: "#475569",
            }}
          />
          <Tooltip {...tooltipStyle} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chart_type === "bar") {
    const COLORS = [
      "#6366f1",
      "#8b5cf6",
      "#10b981",
      "#f59e0b",
      "#ef4444",
      "#06b6d4",
      "#f97316",
      "#84cc16",
    ];
    const isAggregated = data[0] && "value" in data[0];
    const yKey = isAggregated ? "value" : "count";
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 20, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
          <XAxis
            dataKey="category"
            tick={{ fill: "#64748b", fontSize: 12 }}
            label={{
              value: chart.column,
              position: "insideBottom",
              offset: -5,
              fill: "#475569",
            }}
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 12 }}
            label={{
              value: isAggregated ? "Value" : "Count",
              angle: -90,
              position: "insideLeft",
              fill: "#475569",
            }}
          />
          <Tooltip
            {...tooltipStyle}
            formatter={(val) =>
              typeof val === "number" ? val.toLocaleString() : val
            }
          />
          <Bar dataKey={yKey} radius={[4, 4, 0, 0]}>
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chart_type === "scatter") {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
          <XAxis
            dataKey="x"
            name={chart.x_col}
            tick={{ fill: "#64748b", fontSize: 12 }}
            label={{
              value: chart.x_col,
              position: "insideBottom",
              offset: -5,
              fill: "#475569",
            }}
          />
          <YAxis
            dataKey="y"
            name={chart.y_col}
            tick={{ fill: "#64748b", fontSize: 12 }}
            label={{
              value: chart.y_col,
              angle: -90,
              position: "insideLeft",
              fill: "#475569",
            }}
          />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} {...tooltipStyle} />
          <Scatter data={data} fill="#6366f1" />
        </ScatterChart>
      </ResponsiveContainer>
    );
  }

  if (chart_type === "line") {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 20, left: 20, bottom: 45 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
          <XAxis
            dataKey="x"
            tick={{ fill: "#64748b", fontSize: 11 }}
            angle={-30}
            textAnchor="end"
            height={60}
            label={{
              value: chart.x_col || chart.column,
              position: "insideBottom",
              offset: -40,
              fill: "#475569",
            }}
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 12 }}
            label={{
              value: chart.y_col || "Value",
              angle: -90,
              position: "insideLeft",
              fill: "#475569",
            }}
          />
          <Tooltip {...tooltipStyle} />
          <Line
            type="monotone"
            dataKey="y"
            stroke="#6366f1"
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <p style={{ color: "#64748b" }}>Unsupported chart type: {chart_type}</p>
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
  loadingContent: {
    textAlign: "center",
    color: "#64748b",
  },
  loadingIcon: {
    fontSize: "2.5rem",
    display: "block",
    marginBottom: "12px",
  },
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
  content: {
    position: "relative",
    zIndex: 1,
    padding: "32px",
  },
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
    gap: "16px",
  },
  title: {
    fontSize: "1.6rem",
    fontWeight: "700",
    color: "#f1f5f9",
    marginBottom: "6px",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    color: "#475569",
    fontSize: "0.88rem",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  subtitleBadge: {
    backgroundColor: "rgba(99,102,241,0.1)",
    color: "#6366f1",
    fontSize: "0.78rem",
    fontWeight: "600",
    padding: "2px 8px",
    borderRadius: "20px",
    border: "1px solid rgba(99,102,241,0.2)",
  },
  section: { marginBottom: "40px" },
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
  hint: {
    color: "#475569",
    fontSize: "0.88rem",
    marginBottom: "16px",
    lineHeight: "1.6",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px",
    backgroundColor: "rgba(15,23,42,0.5)",
    borderRadius: "12px",
    border: "1px dashed rgba(99,102,241,0.2)",
    color: "#475569",
  },
  chartCard: {
    backgroundColor: "rgba(15,23,42,0.8)",
    borderRadius: "14px",
    padding: "24px",
    marginBottom: "20px",
    border: "1px solid rgba(99,102,241,0.1)",
  },
  chartHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  chartTitle: {
    fontSize: "0.95rem",
    fontWeight: "600",
    color: "#f1f5f9",
  },
  typeBadge: {
    fontSize: "0.75rem",
    padding: "3px 10px",
    borderRadius: "20px",
    fontWeight: "600",
  },
  chartWrapper: { marginBottom: "16px" },
  reasonBox: {
    backgroundColor: "rgba(99,102,241,0.05)",
    borderRadius: "8px",
    padding: "12px 16px",
    borderLeft: "3px solid rgba(99,102,241,0.4)",
    marginTop: "12px",
    marginBottom: "12px",
  },
  reasonLabel: {
    color: "#6366f1",
    fontSize: "0.75rem",
    fontWeight: "600",
    marginBottom: "4px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  reasonText: {
    color: "#64748b",
    fontSize: "0.88rem",
    lineHeight: "1.6",
  },
  explainButton: {
    background:
      "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))",
    color: "#a5b4fc",
    border: "1px solid rgba(99,102,241,0.25)",
    borderRadius: "8px",
    padding: "8px 16px",
    fontSize: "0.85rem",
    cursor: "pointer",
    marginTop: "4px",
  },
  explanationBox: {
    background: "rgba(99,102,241,0.05)",
    borderRadius: "8px",
    padding: "16px",
    borderLeft: "3px solid #6366f1",
    marginTop: "12px",
  },
  explanationText: {
    color: "#94a3b8",
    lineHeight: "1.7",
    fontSize: "0.9rem",
  },
  customChartBox: {
    backgroundColor: "rgba(15,23,42,0.6)",
    borderRadius: "12px",
    padding: "20px",
    border: "1px solid rgba(99,102,241,0.1)",
    marginBottom: "20px",
  },
  manualControls: {
    display: "flex",
    gap: "16px",
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
  selectGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { color: "#64748b", fontSize: "0.82rem", fontWeight: "500" },
  select: {
    backgroundColor: "rgba(10,15,30,0.8)",
    color: "#f1f5f9",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "0.88rem",
    minWidth: "200px",
  },
  generateButton: {
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "9px 20px",
    fontSize: "0.9rem",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 0 12px rgba(99,102,241,0.3)",
  },
};
