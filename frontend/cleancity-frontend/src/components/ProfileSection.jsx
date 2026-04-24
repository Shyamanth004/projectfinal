import { useEffect, useState } from "react";
import "../styles/dashboard.css";

export default function ProfileSection() {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userId = storedUser?.id;

  const [points, setPoints] = useState(0);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    async function fetchData() {
      try {
        // Fetch profile
        const profileRes = await fetch("http://127.0.0.1:3000/me", {
          headers: {
            role: "user",
            "user-id": userId
          }
        });

        const profileData = await profileRes.json();
        setProfile(profileData);

        // Fetch points
        const pointsRes = await fetch("http://127.0.0.1:3000/user-points", {
          headers: {
            role: "user",
            "user-id": userId
          }
        });

        const pointsData = await pointsRes.json();
        setPoints(pointsData.totalPoints);

      } catch (err) {
        console.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId]);
  console.log(profile);
  if (!userId || loading || !profile) return null;

  return (
    <div
      className={`profile-section ${
        profile.gender === "male"
          ? "profile-male"
          : profile.gender === "female"
          ? "profile-female"
          : "profile-neutral"
      }`}
    >
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

      {/* Points */}
      <div className="profile-points">Points: {points} ⭐</div><hr />

      {/* Badges Section */}
      <div className="badges-section">
        <div className="badges-title">Badges</div>

        <div className="badges-container">
          <div className="badge-box"></div>
          <div className="badge-box"></div>
          <div className="badge-box"></div>
        </div>
      </div>

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
