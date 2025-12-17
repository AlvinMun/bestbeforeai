import { Link, useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  return (
    <div className="bb-container">
      <header className="bb-nav">
        <div className="bb-brand">
          <span style={{ fontSize: 18 }}>BEST BEFORE</span>
          <span style={{ opacity: 0.7 }}>AI</span>
        </div>

        <nav className="bb-nav-links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/register">Register</Link>
          <Link to="/login">Login</Link>
          <Link to="/profile">Profile</Link>
        </nav>
      </header>

      <section className="bb-hero">
        <h1>Welcome to Best Before!</h1>

        {/* Replace with your own image file if you have one */}
        {/* <img src="/receipt.jpg" alt="BestBefore" /> */}

        <p>Say no more to food waste.</p>

        <button
          className="bb-btn primary"
          onClick={() => navigate(token ? "/dashboard" : "/register")}
        >
          Get Started
        </button>
      </section>
    </div>
  );
}
