import { useParams, useNavigate, useLocation } from "react-router-dom";

export default function DatasetNav() {
  const { datasetId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { label: "📊 Visualizations", path: `/visualizations/${datasetId}` },
    { label: "💬 Chatbot", path: `/chatbot/${datasetId}` },
    { label: "🤖 AutoML", path: `/automl/${datasetId}` },
    { label: "🎯 ML Prediction", path: `/ml/${datasetId}` },
    { label: "📄 Export Report", path: `/report/${datasetId}` },
  ];

  return (
    <div style={styles.wrapper}>
      <div style={styles.inner}>
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              style={{
                ...styles.tab,
                ...(isActive ? styles.activeTab : styles.inactiveTab),
              }}
            >
              {tab.label}
              {isActive && <span style={styles.activeDot} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    background: "linear-gradient(180deg, #0d1424 0%, #0a0f1e 100%)",
    borderBottom: "1px solid rgba(99, 102, 241, 0.2)",
    padding: "0 32px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
  },
  inner: {
    display: "flex",
    gap: "4px",
    overflowX: "auto",
    alignItems: "center",
    height: "52px",
  },
  tab: {
    position: "relative",
    backgroundColor: "transparent",
    border: "none",
    borderRadius: "8px",
    padding: "8px 16px",
    fontSize: "0.85rem",
    fontWeight: "500",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  activeTab: {
    background:
      "linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.2) 100%)",
    color: "#a5b4fc",
    border: "1px solid rgba(99,102,241,0.3)",
    boxShadow: "0 0 12px rgba(99,102,241,0.15)",
  },
  inactiveTab: {
    color: "#475569",
    border: "1px solid transparent",
  },
  activeDot: {
    width: "5px",
    height: "5px",
    borderRadius: "50%",
    backgroundColor: "#6366f1",
    boxShadow: "0 0 6px #6366f1",
    display: "inline-block",
  },
};
