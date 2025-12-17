import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function Login() {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:8000/auth/login", {
        email,
        password,
      });

      // adjust key name if your backend returns token differently
      const token = res.data.access_token || res.data.token;
      if (!token) throw new Error("No token returned from backend");

      localStorage.setItem("token", token);
      nav("/dashboard");
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "Login failed. Please try again.";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-center">
      <form className="card" onSubmit={onSubmit}>
        <h1>Welcome back</h1>

        <label>Email</label>
        <input
          className="bb-input"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>Password</label>
        <input
          className="bb-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <div style={{ marginTop: 8, color: "#fecaca", fontSize: 14 }}>
            {error}
          </div>
        )}

        <button className="bb-btn primary" disabled={loading} style={{ width: "100%", marginTop: 14 }}>
          {loading ? "Logging in..." : "Log in"}
        </button>

        <p style={{ marginTop: 14, color: "rgba(255,255,255,0.7)" }}>
          No account yet? <Link to="/register" style={{ fontWeight: 700 }}>Create one</Link>
        </p>
      </form>
    </div>
  );
}
