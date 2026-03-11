import { useEffect, useState } from "react";

export default function Leaderboard() {
  const [monthly, setMonthly] = useState([]);
  const [yearly, setYearly] = useState([]);
  const [ward, setWard] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;

    fetch("http://127.0.0.1:3000/leaderboard/monthly", {
      headers: {
        role: "user",
        "user-id": userId
      }
    })
      .then(res => res.json())
      .then(data => {
        setWard(data.ward);
        setMonthly(data.leaderboard);
      });

    fetch("http://127.0.0.1:3000/leaderboard/yearly", {
      headers: {
        role: "user",
        "user-id": userId
      }
    })
      .then(res => res.json())
      .then(data => setYearly(data.leaderboard));
  }, []);

  return (
    <div>
      <h3>Ward Leaderboard</h3>
      <p><strong>Ward:</strong> {ward}</p>

      <hr />

      <h3>Monthly Points</h3>
      {monthly.length === 0 && <p>No data yet</p>}
      <ul>
        {monthly.map((item, index) => (
          <li key={item.userId}>
            #{index + 1} — User {item.userId}: {item.points} pts
          </li>
        ))}
      </ul>

      <hr />

      <h3>Yearly Points</h3>
      {yearly.length === 0 && <p>No data yet</p>}
      <ul>
        {yearly.map((item, index) => (
          <li key={item.userId}>
            #{index + 1} — User {item.userId}: {item.points} pts
          </li>
        ))}
      </ul>
    </div>
  );
}
