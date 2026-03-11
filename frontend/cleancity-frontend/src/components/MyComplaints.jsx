import { useEffect, useState } from "react";

export default function MyComplaints() {
  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user?.id;

    if (!userId) {
      alert("User not logged in");
      return;
    }

    fetch("http://127.0.0.1:3000/my-complaints", {
      headers: {
        role: "user",
        "user-id": userId
      }
    })
      .then(res => res.json())
      .then(data => setComplaints(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h3>My Complaints</h3>

      {complaints.length === 0 && <p>No complaints yet</p>}

      <ul>
        {complaints.map(c => (
          <li key={c.complaintId}>
            Complaint #{c.complaintId} – Status: {c.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
