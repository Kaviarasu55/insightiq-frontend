import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function Navbar({ user }) {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    try {
      await signOut(auth);
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }

  return (
    <nav style={styles.navbar}>
      {/* Logo */}
      <div style={styles.logoSection} onClick={() => navigate("/dashboard")}>
        <div style={styles.logoIcon}>IQ</div>
        <span style={styles.logoText}>InsightIQ</span>
      </div>

      {/* Right side */}
      <div style={styles.right} ref={dropdownRef}>
        <button
          style={styles.profileButton}
          onClick={() => setProfileOpen((prev) => !prev)}
        >
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt="profile"
              style={styles.profilePhoto}
            />
          ) : (
            <span style={styles.profileInitial}>
              {user.displayName?.charAt(0) || "U"}
            </span>
          )}
        </button>

        {profileOpen && (
          <div style={styles.dropdown}>
            <div style={styles.dropdownHeader}>
              {user.photoURL && (
                <img
                  src={user.photoURL}
                  alt="profile"
                  style={styles.dropdownPhoto}
                />
              )}
              <p style={styles.userName}>{user.displayName}</p>
              <p style={styles.userEmail}>{user.email}</p>
            </div>
            <div style={styles.divider} />
            <button style={styles.logoutButton} onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

const styles = {
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 32px",
    height: "60px",
    background: "linear-gradient(180deg, #0d1424 0%, #0a0f1e 100%)",
    borderBottom: "1px solid rgba(99,102,241,0.15)",
    position: "sticky",
    top: 0,
    zIndex: 100,
    boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
  },
  logoSection: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
  },
  logoIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.75rem",
    fontWeight: "800",
    color: "#fff",
    letterSpacing: "0.05em",
    boxShadow: "0 0 12px rgba(99,102,241,0.4)",
  },
  logoText: {
    fontSize: "1.1rem",
    fontWeight: "700",
    background: "linear-gradient(135deg, #a5b4fc 0%, #c4b5fd 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: "-0.01em",
  },
  right: {
    position: "relative",
  },
  profileButton: {
    backgroundColor: "transparent",
    border: "2px solid rgba(99,102,241,0.3)",
    borderRadius: "50%",
    width: "38px",
    height: "38px",
    cursor: "pointer",
    padding: 0,
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "border-color 0.2s",
    boxShadow: "0 0 10px rgba(99,102,241,0.2)",
  },
  profilePhoto: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    objectFit: "cover",
  },
  profileInitial: {
    color: "#a5b4fc",
    fontSize: "1rem",
    fontWeight: "600",
  },
  dropdown: {
    position: "absolute",
    right: 0,
    top: "48px",
    background: "linear-gradient(180deg, #0d1424 0%, #0a0f1e 100%)",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: "12px",
    width: "240px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.1)",
    zIndex: 200,
    overflow: "hidden",
  },
  dropdownHeader: {
    padding: "20px 16px",
    textAlign: "center",
  },
  dropdownPhoto: {
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    marginBottom: "10px",
    border: "2px solid rgba(99,102,241,0.3)",
  },
  userName: {
    color: "#f1f5f9",
    fontWeight: "600",
    fontSize: "0.95rem",
    marginBottom: "2px",
  },
  userEmail: {
    color: "#475569",
    fontSize: "0.8rem",
  },
  divider: {
    height: "1px",
    background:
      "linear-gradient(90deg, transparent, rgba(99,102,241,0.2), transparent)",
  },
  logoutButton: {
    width: "100%",
    padding: "12px 16px",
    backgroundColor: "transparent",
    border: "none",
    color: "#f87171",
    fontSize: "0.9rem",
    cursor: "pointer",
    textAlign: "left",
    transition: "background 0.2s",
  },
};
