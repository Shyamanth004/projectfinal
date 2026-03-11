import { useState } from "react";
import { apiRequest } from "../api/api";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

export default function MunicipalLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  const navigate = useNavigate();

  async function login() {
    setStatus("Logging in...");

    const res = await apiRequest("/login", "POST", {
      username,
      password
    });

    if (res.error) {
      setStatus(res.error);
      return;
    }

    localStorage.setItem("user", JSON.stringify(res.user));
    navigate("/municipal");
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-title">Municipal Login</div>
        <div className="login-subtitle">
          Authorized Access Only
        </div>

        <input
          className="login-input"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />

        <input
          className="login-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <button className="login-btn" onClick={login}>
          Login
        </button>

        <p className="status-text">{status}</p>
      </div>
    </div>
  );
}
