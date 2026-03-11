import { useState } from "react";
import { apiRequest } from "../api/api";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpStep, setOtpStep] = useState(1);

  const navigate = useNavigate();

  async function sendOtp() {
    const res = await apiRequest("/send-otp", "POST", { phone });

    if (res.error) {
      alert(res.error);
      return;
    }

    alert("OTP sent. Check server console.");
    setOtpStep(2);
  }

  async function verifyOtp() {
    const res = await apiRequest("/verify-otp", "POST", { phone, otp });

    if (res.error) {
        alert(res.error);
        return;
    }

    // ✅ Store user correctly
    const loggedInUser = {
        id: res.id,
        role: res.role
    };

    localStorage.setItem("user", JSON.stringify(loggedInUser));

    // ✅ Route based on role
    if (res.role === "user") navigate("/user");
    if (res.role === "worker") navigate("/worker");
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-title">CleanCity Connect</div>
        <div className="login-subtitle">
          Smart Waste Management Platform
        </div>

        {otpStep === 1 && (
          <>
            <input
              className="login-input"
              placeholder="Enter phone number"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
            <button className="login-btn" onClick={sendOtp}>
              Send OTP
            </button>
          </>
        )}

        {otpStep === 2 && (
          <>
            <input
              className="login-input"
              placeholder="Enter OTP"
              value={otp}
              onChange={e => setOtp(e.target.value)}
            />
            <button className="login-btn" onClick={verifyOtp}>
              Verify OTP
            </button>
          </>
        )}
        <div className="login-footer">
            New user? <a href="/register">Register here</a>
        </div>
      </div>
    </div>
  );
}
