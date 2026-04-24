import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/leaderboard.css";

export default function LeaderboardPage() {
  const [monthly, setMonthly] = useState([]);
  const [yearly, setYearly] = useState([]);
  const [activeTab, setActiveTab] = useState("monthly");

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetchLeaderboards();
  }, []);

  const fetchLeaderboards = async () => {
    try {
      const headers = {
        role: "user",
        "user-id": userId
      };

      const [monthlyRes, yearlyRes] = await Promise.all([
        axios.get("http://127.0.0.1:3000/leaderboard/monthly", { headers }),
        axios.get("http://127.0.0.1:3000/leaderboard/yearly", { headers })
      ]);

      setMonthly(monthlyRes.data.leaderboard);
      setYearly(yearlyRes.data.leaderboard);
      console.log("Monthly:", monthlyRes.data);
      console.log("Yearly:", yearlyRes.data);

    } catch (err) {
      console.error("Leaderboard error:", err);
    }
  };

  const data = activeTab === "monthly" ? monthly : yearly;

  const getMedal = (index) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return null;
  };

  return (
    <div className="leaderboard-container">

      {/* Tabs */}
      <div className="tabs">
        <button
          className={activeTab === "monthly" ? "active" : ""}
          onClick={() => setActiveTab("monthly")}
        >
          Monthly
        </button>

        <button
          className={activeTab === "yearly" ? "active" : ""}
          onClick={() => setActiveTab("yearly")}
        >
          Yearly
        </button>
      </div>

      {/* Top 3 */}
      <div className="top-three">
        {data.slice(0, 3).map((user, index) => (
          <div
            key={user.user_id}
            className={`top-card rank-${index} ${
              user.user_id == userId ? "current-user" : ""
            }`}
          >
            <div className="medal">{getMedal(index)}</div>
            <h3>{user.name}</h3>
            <p>{user.points} pts</p>
          </div>
        ))}
      </div>

      {/* Remaining list */}
      <div className="leaderboard-list">
        {data.slice(3).map((user, index) => {
          const rank = index + 4;
          return (
            <div
              key={user.user_id}
              className={`row ${
                user.user_id == userId ? "current-user" : ""
              }`}
            >
              <span>{rank}</span>
              <span>{user.name}</span>
              <span>{user.points} pts</span>
            </div>
          );
        })}
      </div>

    </div>
  );
}