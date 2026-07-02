// Reusable model comparison table component
// Used by AutoML page to display model results

export default function ModelCompareTable({ results, bestModel, taskType }) {
  if (!results || results.length === 0) return null;

  const isClassification = taskType === "classification";

  const sorted = [...results].sort((a, b) => {
    const key = isClassification ? "accuracy" : "r2";
    return b[key] - a[key];
  });

  return (
    <div style={styles.wrapper}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Rank</th>
            <th style={styles.th}>Model</th>
            {isClassification ? (
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
            <th style={styles.th}>Time</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, index) => {
            const isBest = r.model === bestModel;
            return (
              <tr
                key={r.model}
                style={isBest ? styles.bestRow : index % 2 === 0 ? styles.evenRow : {}}
              >
                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.rankBadge,
                      backgroundColor: ["#10b981", "#3b82f6", "#f59e0b"][index] || "#64748b",
                    }}
                  >
                    #{index + 1}
                  </span>
                </td>
                <td style={styles.td}>
                  <span style={styles.modelName}>
                    {isBest && "🏆 "}
                    {r.model}
                  </span>
                </td>
                {isClassification ? (
                  <>
                    <td style={styles.td}>
                      {(r.accuracy * 100).toFixed(1)}%
                    </td>
                    <td style={styles.td}>
                      {(r.f1_score * 100).toFixed(1)}%
                    </td>
                  </>
                ) : (
                  <>
                    <td style={styles.td}>{r.r2?.toFixed(4)}</td>
                    <td style={styles.td}>{r.mae?.toFixed(4)}</td>
                  </>
                )}
                <td style={styles.td}>{r.training_time}s</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  wrapper: {
    overflowX: "auto",
    borderRadius: "8px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    backgroundColor: "#0f172a",
    color: "#94a3b8",
    padding: "12px 16px",
    textAlign: "left",
    fontSize: "0.82rem",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    borderBottom: "1px solid #334155",
  },
  td: {
    padding: "14px 16px",
    borderBottom: "1px solid #1e293b",
    fontSize: "0.9rem",
    color: "#cbd5e1",
  },
  bestRow: {
    backgroundColor: "#064e3b20",
    borderLeft: "3px solid #10b981",
  },
  evenRow: {
    backgroundColor: "#0f172a40",
  },
  modelName: {
    fontWeight: "600",
    color: "#f1f5f9",
  },
  rankBadge: {
    color: "#fff",
    fontSize: "0.75rem",
    padding: "3px 10px",
    borderRadius: "12px",
    fontWeight: "600",
  },
};
