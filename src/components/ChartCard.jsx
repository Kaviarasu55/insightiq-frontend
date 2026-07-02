import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ScatterChart,
  Scatter,
  LineChart,
  Line,
} from "recharts";

export default function ChartCard({
  chart,
  onExplain,
  explanation,
  explaining,
}) {
  const { chart_type, column, data, reason } = chart;

  const typeColors = {
    bar: "#6366f1",
    histogram: "#8b5cf6",
    scatter: "#10b981",
    line: "#f59e0b",
  };
  const color = typeColors[chart_type] || "#6366f1";

  function renderChart() {
    if (chart_type === "bar" || chart_type === "histogram") {
      const dataKey = chart_type === "histogram" ? "bin" : "category";
      const valKey =
        chart_type === "histogram"
          ? "count"
          : data[0]?.value !== undefined
            ? "value"
            : "count";
      return (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={data}
            margin={{ top: 5, right: 20, left: 0, bottom: 40 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(99,102,241,0.1)"
            />
            <XAxis
              dataKey={dataKey}
              tick={{ fill: "#64748b", fontSize: 11 }}
              angle={-35}
              textAnchor="end"
            />
            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0d1424",
                border: "1px solid rgba(99,102,241,0.2)",
              }}
            />
            <Bar dataKey={valKey} fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }
    if (chart_type === "scatter") {
      return (
        <ResponsiveContainer width="100%" height={240}>
          <ScatterChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(99,102,241,0.1)"
            />
            <XAxis
              dataKey="x"
              name={chart.x_col}
              tick={{ fill: "#64748b", fontSize: 11 }}
            />
            <YAxis
              dataKey="y"
              name={chart.y_col}
              tick={{ fill: "#64748b", fontSize: 11 }}
            />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{
                backgroundColor: "#0d1424",
                border: "1px solid rgba(99,102,241,0.2)",
              }}
            />
            <Scatter data={data} fill={color} />
          </ScatterChart>
        </ResponsiveContainer>
      );
    }
    if (chart_type === "line") {
      return (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart
            data={data}
            margin={{ top: 5, right: 20, left: 0, bottom: 40 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(99,102,241,0.1)"
            />
            <XAxis
              dataKey="x"
              tick={{ fill: "#64748b", fontSize: 11 }}
              angle={-35}
              textAnchor="end"
            />
            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0d1424",
                border: "1px solid rgba(99,102,241,0.2)",
              }}
            />
            <Line type="monotone" dataKey="y" stroke={color} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      );
    }
    return <p style={{ color: "#64748b" }}>Chart type not supported.</p>;
  }

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={styles.title}>{column}</span>
        <span style={{ ...styles.badge, backgroundColor: color + "22", color }}>
          {chart_type}
        </span>
      </div>
      <div style={styles.chartWrapper}>{renderChart()}</div>
      {reason && (
        <div style={styles.reasonBox}>
          <p style={styles.reasonLabel}>AI INSIGHT</p>
          <p style={styles.reasonText}>{reason}</p>
        </div>
      )}
      <button
        style={styles.explainBtn}
        onClick={onExplain}
        disabled={explaining}
      >
        {explaining ? "Generating..." : "✨ Explain this chart"}
      </button>
      {explanation && (
        <div style={styles.explanationBox}>
          <p style={styles.explanationText}>{explanation}</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: "rgba(15,23,42,0.8)",
    borderRadius: "14px",
    padding: "24px",
    marginBottom: "20px",
    border: "1px solid rgba(99,102,241,0.1)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  title: { fontSize: "0.95rem", fontWeight: "600", color: "#f1f5f9" },
  badge: {
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
  reasonText: { color: "#64748b", fontSize: "0.88rem", lineHeight: "1.6" },
  explainBtn: {
    background:
      "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))",
    color: "#a5b4fc",
    border: "1px solid rgba(99,102,241,0.25)",
    borderRadius: "8px",
    padding: "8px 16px",
    fontSize: "0.85rem",
    cursor: "pointer",
  },
  explanationBox: {
    background: "rgba(99,102,241,0.05)",
    borderRadius: "8px",
    padding: "16px",
    borderLeft: "3px solid #6366f1",
    marginTop: "12px",
  },
  explanationText: { color: "#94a3b8", lineHeight: "1.7", fontSize: "0.9rem" },
};
