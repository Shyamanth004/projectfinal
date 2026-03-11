import { useEffect, useState } from "react";
import WorkerTasks from "../components/WorkerTasks";
import "../styles/worker.css";

export default function WorkerDashboard() {
  const auth = JSON.parse(localStorage.getItem("user"));
  const workerId = auth?.id;

  const [worker, setWorker] = useState(null);

  useEffect(() => {
    async function fetchWorker() {
      try {
        const res = await fetch("http://127.0.0.1:3000/worker/me", {
          headers: {
            role: "worker",
            "user-id": workerId
          }
        });

        const data = await res.json();

        if (!res.ok) {
          alert(data.error || "Failed to load worker profile");
          return;
        }

        setWorker(data);
      } catch {
        alert("Server error");
      }
    }

    if (workerId) {
      fetchWorker();
    }
  }, [workerId]);

  if (!worker) return null;

  return (
    <div className="worker-dashboard-page">

      {/* WORKER PROFILE CARD */}
      <div className="worker-dashboard-card">
        <div className="worker-dashboard-profile">
          <img
            src={
              worker.profile_image_url
                ? `http://127.0.0.1:3000${worker.profile_image_url}`
                : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
            }
            alt="Worker"
            className="worker-dashboard-avatar"
          />

          <div className="worker-dashboard-details">
            <h3>{worker.name}</h3>
            <p className="worker-role">Sanitation Worker</p>
            <p className="worker-meta">📍 {worker.ward}</p>
            <p className="worker-meta">📞 {worker.phone}</p>
          </div>
        </div>
      </div>

      {/* TASKS */}
      <WorkerTasks />

    </div>
  );
}
