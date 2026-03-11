import { useState, useEffect } from "react";
import "../styles/register.css";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "",
    aadhar: "",
    phone: "",
    address: "",
    ward: ""
  });

  const [status, setStatus] = useState("");
  const [profilePic, setProfilePic] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Auto-detect location on page load → fill address only
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
        );
        const data = await res.json();

        setForm(prev => ({
          ...prev,
          address: data.display_name || ""
        }));
      } catch {
        console.error("Failed to fetch address");
      }
    });
  }, []);

  const handleSubmit = async () => {
    setStatus("Submitting...");

    const formData = new FormData();
    Object.keys(form).forEach(key => formData.append(key, form[key]));
    if (profilePic) formData.append("profilePic", profilePic);

    const res = await fetch("http://127.0.0.1:3000/register-user", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if (res.ok) {
      alert("Registration successful! Please login using OTP.");
      window.location.href = "/";
    } else {
      setStatus(data.error || "Error registering user");
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <h2 className="register-title">User Registration</h2>

        <label>Profile Picture</label>
        <input type="file" accept="image/*"
          onChange={e => setProfilePic(e.target.files[0])}
        />

        <label>Name</label>
        <input name="name" value={form.name} onChange={handleChange} />

        <label>Age</label>
        <input name="age" type="number" value={form.age} onChange={handleChange} />

        <label>Gender</label>
        <select name="gender" value={form.gender} onChange={handleChange}>
          <option value="">Select</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>

        <label>Aadhar Number</label>
        <input name="aadhar" maxLength="12" value={form.aadhar} onChange={handleChange} />

        <label>Phone Number</label>
        <input name="phone" maxLength="10" value={form.phone} onChange={handleChange} />

        <label>Address</label>
        <input name="address" value={form.address} onChange={handleChange} />

        <label>Ward</label>
        <input
          name="ward"
          placeholder="Enter your ward number"
          value={form.ward}
          onChange={handleChange}
        />

        <button className="register-btn" onClick={handleSubmit}>
          Register
        </button>

        <p className="status-text">{status}</p>

        <div className="register-footer">
          Already have an account? <a href="/">Login</a>
        </div>
      </div>
    </div>
  );
}
