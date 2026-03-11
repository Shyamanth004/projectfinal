import { useEffect, useState } from "react";
import "../styles/dashboard.css";

export default function ProfileSection() {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userId = storedUser?.id;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    async function fetchProfile() {
      try {
        const res = await fetch("http://127.0.0.1:3000/me", {
          headers: {
            role: "user",
            "user-id": userId
          }
        });

        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [userId]);

  if (!userId || loading || !profile) return null;

  return (
    <div className="profile-section">

      {/* Profile Avatar */}
      <img
        src={
            profile.profile_image_url
            ? `http://127.0.0.1:3000${profile.profile_image_url}`
            : "/default-avatar.jpg"
        }
        className="profile-img"
        alt="Profile"
      />

      {/* Name */}
      <div className="profile-name">{profile.name}</div>

      {/* Points (placeholder – DB later) */}
      <div className="profile-points">⭐ Points coming soon</div>

      {/* Details */}
      <div className="profile-details">
        <div className="profile-row">
          <span className="profile-label">Phone</span>
          <span className="profile-value">{profile.phone}</span>
        </div>

        <div className="profile-row">
          <span className="profile-label">Role</span>
          <span className="profile-value">Citizen</span>
        </div>
      </div>
    </div>
  );
}
