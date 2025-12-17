import { useEffect, useState } from "react";
import api from "../api";

export default function Profile() {
  const [me, setMe] = useState(null);

  useEffect(() => {
    api.get("/auth/me").then((r) => setMe(r.data));
  }, []);

  return (
    <div className="container">
      <div className="card" style={{ padding: 22 }}>
        <div className="small">Profile</div>
        <h2 style={{ margin: "8px 0" }}>Your account</h2>
        <div className="card" style={{ marginTop: 12 }}>
          <div className="small">Email</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{me?.email || "Loading..."}</div>
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
          <a className="btn secondary" href="/">Home</a>
          <a className="btn secondary" href="/dashboard">Dashboard</a>
        </div>
      </div>
    </div>
  );
}
