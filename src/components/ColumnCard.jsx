export default function ColumnCard({ col }) {
  const typeColors = {
    numeric: { bg: "rgba(99,102,241,0.1)", color: "#6366f1" },
    categorical: { bg: "rgba(16,185,129,0.1)", color: "#10b981" },
    datetime: { bg: "rgba(245,158,11,0.1)", color: "#f59e0b" },
  };
  const t = typeColors[col.type] || typeColors.categorical;

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={styles.colName}>{col.name}</span>
        <span
          style={{ ...styles.typeBadge, backgroundColor: t.bg, color: t.color }}
        >
          {col.type}
        </span>
      </div>

      {col.type === "numeric" && (
        <div style={styles.statsGrid}>
          <StatItem label="Mean" value={col.mean} />
          <StatItem label="Min" value={col.min} />
          <StatItem label="Max" value={col.max} />
          <StatItem label="Std" value={col.std} />
        </div>
      )}

      {col.type === "categorical" && col.top_values && (
        <div style={styles.topValues}>
          <p style={styles.topLabel}>Top Values</p>
          {col.top_values.map((v) => (
            <div key={v.value} style={styles.topRow}>
              <span style={styles.topVal}>{v.value}</span>
              <span style={styles.topCount}>{v.count}</span>
            </div>
          ))}
        </div>
      )}

      {col.type === "datetime" && (
        <p style={styles.datetimeName}>📅 Datetime column</p>
      )}

      <div style={styles.footer}>
        <span style={styles.footerItem}>🔢 {col.unique_count} unique</span>
        <span
          style={{
            ...styles.footerItem,
            color: col.null_count > 0 ? "#f87171" : "#10b981",
          }}
        >
          ⚠ {col.null_count} nulls ({col.null_percentage}%)
        </span>
      </div>
    </div>
  );
}

function StatItem({ label, value }) {
  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ color: "#475569", fontSize: "0.75rem", marginBottom: "2px" }}>
        {label}
      </p>
      <p style={{ color: "#f1f5f9", fontSize: "0.9rem", fontWeight: "600" }}>
        {value ?? "—"}
      </p>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: "rgba(15,23,42,0.8)",
    borderRadius: "12px",
    padding: "16px",
    border: "1px solid rgba(99,102,241,0.1)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  colName: { fontSize: "0.95rem", fontWeight: "600", color: "#f1f5f9" },
  typeBadge: {
    fontSize: "0.72rem",
    fontWeight: "600",
    padding: "2px 10px",
    borderRadius: "20px",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginBottom: "12px",
    backgroundColor: "rgba(99,102,241,0.05)",
    borderRadius: "8px",
    padding: "10px",
  },
  topValues: { marginBottom: "10px" },
  topLabel: {
    color: "#475569",
    fontSize: "0.75rem",
    fontWeight: "600",
    marginBottom: "6px",
    textTransform: "uppercase",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "4px 0",
    borderBottom: "1px solid rgba(99,102,241,0.05)",
  },
  topVal: { color: "#cbd5e1", fontSize: "0.85rem" },
  topCount: { color: "#6366f1", fontSize: "0.85rem", fontWeight: "600" },
  datetimeName: { color: "#64748b", fontSize: "0.88rem", marginBottom: "10px" },
  footer: {
    display: "flex",
    gap: "12px",
    paddingTop: "10px",
    borderTop: "1px solid rgba(99,102,241,0.08)",
  },
  footerItem: { fontSize: "0.78rem", color: "#475569" },
};
