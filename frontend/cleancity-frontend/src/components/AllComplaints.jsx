import { useEffect, useState } from "react";

export default function AllComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [workerId, setWorkerId] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const municipalId = user?.id;

  useEffect(() => {
    if (!municipalId) return;

    fetch("http://127.0.0.1:3000/all-complaints", {
      headers: {
        role: "municipal",
        "user-id": municipalId
      }
    })
      .then(res => res.json())
      .then(data => setComplaints(data));
  }, []);

  async function assignWorker(complaintId) {
    if (!workerId) {
      alert("Enter worker ID");
      return;
    }

    const res = await fetch("http://127.0.0.1:3000/assign-worker", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        role: "municipal",
        "user-id": municipalId
      },
      body: JSON.stringify({ complaintId, workerId })
    });

    const data = await res.json();
    alert(data.message || data.error);
  }

  async function approveCleanup(complaintId, userId) {
    const res = await fetch("http://127.0.0.1:3000/approve-cleanup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        role: "municipal",
        "user-id": municipalId
      },
      body: JSON.stringify({ complaintId, userId })
    });

    const data = await res.json();
    alert(data.message || data.error);
  }

  return (
    <div>
      <h3>All Complaints</h3>

      {complaints.length === 0 && <p>No complaints available</p>}

      <ul>
        {complaints.map(c => (
          <li key={c.complaintId}>
            Complaint #{c.complaintId} – Status: {c.status} – By User: {c.userId}
            <br />
            Latitude: {c.latitude} | Longitude: {c.longitude}

            {c.status === "REGISTERED" && (
              <div>
                <input
                  type="number"
                  placeholder="Enter worker ID"
                  onChange={e => setWorkerId(e.target.value)}
                  style={{ marginRight: "8px" }}
                />
                <button onClick={() => assignWorker(c.complaintId)}>
                  Assign Worker
                </button>
              </div>
            )}

            {c.status === "IN_PROGRESS" && (
              <button
                style={{ marginTop: "6px" }}
                onClick={() => approveCleanup(c.complaintId, c.userId)}
              >
                Approve Cleanup & Award Points
              </button>
            )}

            <hr />
          </li>
        ))}
      </ul>
    </div>
  );
}
