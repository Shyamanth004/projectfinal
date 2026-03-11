import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/registerWorker.css";

export default function RegisterWorker() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    age: "",
    gender: "",
    ward: user?.ward || "",
    image: null
  });

  const [preview, setPreview] = useState(null);

  // 🔒 Protect route
  useEffect(() => {
    if (!user || user.role !== "municipal") {
      navigate("/");
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setForm({ ...form, image: file });
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    const { name, phone, age, gender, ward, image } = form;

    if (!name || !phone || !age || !gender || !image) {
        alert("Please fill all fields");
        return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("phone", phone);
    formData.append("age", age);
    formData.append("gender", gender);
    formData.append("ward", ward);
    formData.append("image", image);

    try {
        const res = await fetch(
        "http://127.0.0.1:3000/register-worker",
        {
            method: "POST",
            headers: {
            role: "municipal"
            },
            body: formData
        }
        );

        const data = await res.json();

        if (!res.ok) {
        alert(data.error || "Registration failed");
        return;
        }

        alert("Worker registered successfully");
        navigate("/municipal");

    } catch (err) {
        alert("Server error");
    }
  };

  return (
    <div className="register-worker-page">
      <div className="register-worker-card">

        <h2>Register New Worker</h2>
        <p className="muted-text">
          Add sanitation worker for {user?.ward}
        </p>

        <label>Worker Photo</label>

        <label className="image-upload">
        {preview ? (
            <img
            src={preview}
            alt="Worker Preview"
            className="image-preview"
            />
        ) : (
            <div className="image-placeholder">
            Upload Photo
            </div>
        )}

        <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
        />
        </label>

        <label>Worker Name</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Enter worker name"
        />

        <label>Age</label>
        <input
        type="number"
        name="age"
        value={form.age}
        onChange={handleChange}
        placeholder="Enter age"
        />

        <label>Gender</label>
        <select
        name="gender"
        value={form.gender}
        onChange={handleChange}
        >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
        </select>

        <label>Phone Number</label>
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="Enter phone number"
        />

        <label>Ward</label>
        <input
          name="ward"
          value={form.ward}
          disabled
        />

        <button className="primary-btn" onClick={handleSubmit}>
          Register Worker
        </button>

        <button
          className="secondary-btn"
          onClick={() => navigate("/municipal")}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
