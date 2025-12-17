import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

export default function Register() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!email || !password) {
      setErr("Please enter email and password.");
      return;
    }
    if (password !== confirm) {
      setErr("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/register", { email, password });
      localStorage.setItem("accessToken", res.data.access_token);
      nav("/dashboard");
    } catch (error) {
        if (!error.response) {
            setErr(`Network error: ${error.message}. Is backend running and reachable?`);
        } else {
            const data = error.response.data;
            const detail = data?.detail;

            if (Array.isArray(detail)) {
            setErr(detail.map(d => d.msg).join(" | "));
            } else {
            setErr(detail || `Registration failed (HTTP ${error.response.status})`);
            }
        }
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={{ marginTop: 0 }}>Create account</h2>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <label>
            Email
            <input
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
            />
          </label>

          <label>
            Password
            <input
              style={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              type="password"
              autoComplete="new-password"
            />
          </label>

          <label>
            Confirm password
            <input
              style={styles.input}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              type="password"
              autoComplete="new-password"
            />
          </label>

          {err ? <div style={styles.error}>{err}</div> : null}

          <button style={styles.button} disabled={loading}>
            {loading ? "Creating..." : "Register"}
          </button>
        </form>

        <p style={{ marginBottom: 0, marginTop: 12 }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 },
  card: {
    width: "100%",
    maxWidth: 420,
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 20,
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    marginTop: 6,
    borderRadius: 10,
    border: "1px solid #d1d5db",
    outline: "none",
  },
  button: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #111827",
    background: "#111827",
    color: "white",
    cursor: "pointer",
  },
  error: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #fecaca",
    background: "#fef2f2",
  },
};
