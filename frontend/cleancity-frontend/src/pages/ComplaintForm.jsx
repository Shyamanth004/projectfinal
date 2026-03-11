import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

export default function ComplaintForm() {
  const [image, setImage] = useState(null);
  const [description, setDescription] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [locationStatus, setLocationStatus] = useState("Detecting location...");
  const [status, setStatus] = useState("");
  const [userDetails, setUserDetails] = useState(null);

  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;

  // 📍 Auto-capture GPS on load
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocationStatus("Location detected");
      },
      () => {
        setLocationStatus("Location access denied");
      }
    );
  }, []);

  useEffect(() => {
    if (!userId) return;

    fetch("http://127.0.0.1:3000/me", {
      headers: {
        role: "user",
        "user-id": userId
      }
    })
      .then(res => res.json())
      .then(data => setUserDetails(data))
      .catch(() => setUserDetails(null));
  }, [userId]);

  async function raiseComplaint() {
    if (!image) {
      alert("Please select an image");
      return;
    }

    if (!description.trim()) {
      alert("Please enter a description");
      return;
    }

    if (!latitude || !longitude) {
      alert("Location not detected. Please allow location access.");
      return;
    }

    setStatus("Submitting complaint...");

    const formData = new FormData();
    formData.append("image", image);
    formData.append("description", description);
    formData.append("latitude", latitude);
    formData.append("longitude", longitude);

    const res = await fetch("http://127.0.0.1:3000/raise-complaint", {
      method: "POST",
      headers: {
        role: "user",
        "user-id": userId
      },
      body: formData
    });

    const data = await res.json();

    if (data.error) {
      setStatus(data.error);
    } else {
      alert("Complaint raised successfully");
      navigate("/user");
    }
  }

  return (
    <div className="complaint-container">
      <div className="complaint-form">

        <div className="complaint-section-title">Raise Complaint</div>

        {/* User Info */}
        {userDetails && (
          <div className="complaint-user-info">
            <div>
              <label>Name:</label>
              <input type="text" value={userDetails.name} disabled />
            </div>

            <div>
              <label>Phone:</label>
              <input type="text" value={userDetails.phone} disabled />
            </div>
          </div>
        )}

        {/* Location */}
        <p className="location-text">📍 {locationStatus}</p>

        {latitude && longitude && (
          <p className="coords-text">
            Lat: {latitude.toFixed(5)}, Lon: {longitude.toFixed(5)}
          </p>
        )}

        {/* Image */}
        <label>Upload Complaint Photo</label>
        <input
          style={{ marginBottom: "10px", color: "black" }}
          type="file"
          accept="image/*"
          onChange={e => setImage(e.target.files[0])}
        />

        {/* Description */}
        <label>Description</label>
        <textarea
          placeholder="Describe the issue (overflowing bin, garbage pile, illegal dumping, etc.)"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows="4"
        />

        <button className="primary-btn" onClick={raiseComplaint}>
          Submit Complaint
        </button>

        <p>{status}</p>
      </div>
    </div>
  );
}
