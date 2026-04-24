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
    <div className="login-body">
      <div className="login-page">
        {/* Birds in sky */}
        <div className="sky-icons">
          <img src="/sky.png" className="bird-icon bird1" alt="" />
          <img src="/sky.png" className="bird-icon bird2" alt="" />
        </div>

        {/* Trees at bottom */}
        <div className="tree-icons">
          <img src="/tree.png" className="tree-icon tree1" alt="" />
          <img src="/tree.png" className="tree-icon tree2" alt="" />
        </div>

        <div className="sun-icons">
          <img src="/sun.png" className="sun-icon" alt="" />
        </div>

        <div className="lion-icons">
          <img src="/lion.png" className="lion-icon" alt="" />
        </div>

        <div className="bush-icons">
          <img src="/bush.png" className="bush-icon bush1" alt="" />
          <img src="/bush.png" className="bush-icon bush2" alt="" />
        </div>

        <div className="rabbit-icons">
          <img src="/rabbit.png" className="rabbit-icon" alt="" />
        </div>

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
        {/* <div className="login-anonym">
          - Made In India
        </div> */}
      </div>
    </div>
  );
}
