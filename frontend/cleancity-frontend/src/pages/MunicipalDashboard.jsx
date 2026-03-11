import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/municipal.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

export default function MunicipalDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showWorkerList, setShowWorkerList] = useState(false);
  const [assigningComplaint, setAssigningComplaint] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [municipalInfo, setMunicipalInfo] = useState(null);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  // 🔒 Protect route
  useEffect(() => {
    if (!user || user.role !== "municipal") {
      navigate("/");
    }
  }, [user, navigate]);

  // 📥 Fetch complaints
  useEffect(() => {
    async function fetchComplaints() {
      try {
        const res = await fetch("http://127.0.0.1:3000/all-complaints", {
          headers: { role: "municipal" }
        });

        const data = await res.json();
        setComplaints(data);
      } catch {
        console.error("Failed to fetch complaints");
      }
    }

    if (user?.role === "municipal") {
      fetchComplaints();
    }
  }, [user]);

    // ✅ APPROVE CLEANUP
  async function approveCleanup(complaint) {
    try {
        const res = await fetch(
        "http://127.0.0.1:3000/approve-cleanup",
        {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            role: "municipal"
            },
            body: JSON.stringify({
                complaintId: complaint.complaint_id,
                userId: complaint.user_id
            })
        }
        );

        const data = await res.json();

        if (!res.ok) {
        alert(data.error || "Approval failed");
        return;
        }

        // ✅ Update UI
        setComplaints(prev =>
        prev.map(c =>
            c.complaintId === complaint.complaintId
            ? { ...c, status: "RESOLVED" }
            : c
        )
        );

        setSelectedComplaint(null);
        alert("Cleanup approved successfully ✅");

    } catch (err) {
        alert("Server error");
    }
  }

  useEffect(() => {
    async function fetchWorkers() {
        try {
        const res = await fetch("http://127.0.0.1:3000/workers", {
            headers: { role: "municipal" }
        });
        const data = await res.json();
        setWorkers(data);
        } catch {
        console.error("Failed to fetch workers");
        }
    }

    if (user?.role === "municipal") {
        fetchWorkers();
    }
  }, [user]);

  useEffect(() => {
    async function fetchMunicipalInfo() {
        try {
        const res = await fetch("http://127.0.0.1:3000/municipal/me", {
            headers: {
            role: "municipal",
            "user-id": user.id
            }
        });

        const data = await res.json();
        setMunicipalInfo(data);
        } catch {
        console.error("Failed to fetch municipal info");
        }
    }

    if (user?.role === "municipal") {
        fetchMunicipalInfo();
    }
  }, [user]);

  return (
    <>
      <div className="municipal-page">

        {/* HEADER */}
        <div className="municipal-header">
          <h2>Municipal Dashboard</h2>
          <p>Ward 12 · GHMC</p>
        </div>

        {/* MUNICIPAL INFO */}
        <div className="municipal-card">
          <h3>Municipal Details</h3>
          <div className="municipal-info">
            {municipalInfo && (
                <div className="commissioner-profile">
                    <img
                    src={
                        municipalInfo.commissioner_image_url
                        ? `http://127.0.0.1:3000${municipalInfo.commissioner_image_url}`
                        : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                    }
                    alt="Municipal Commissioner"
                    className="commissioner-avatar"
                    />

                    <div className="commissioner-details">
                    <h4>{municipalInfo.commissioner_name}</h4>
                    <p className="designation">Municipal Commissioner</p>
                    <p className="ward">
                        {municipalInfo.ward} · GHMC
                    </p>
                    <p className="address">
                        {municipalInfo.address}
                    </p>
                    </div>
                </div>
            )}
          </div>

          {/* MAP */}
          <div className="municipal-map">
            <iframe
              title="Municipal Office Location"
              src="https://www.openstreetmap.org/export/embed.html?bbox=78.474%2C17.380%2C78.490%2C17.395&layer=mapnik"
            />
          </div>
        </div>

        {/* COMPLAINTS SECTION */}
        <div className="municipal-card">
          <h3>Ward Complaints</h3>
          <p className="muted-text">
            Complaints raised by citizens of Ward 12
          </p>

          {complaints.length === 0 && (
            <div className="empty-state">
              No complaints registered yet
            </div>
          )}

          {complaints.map(c => {
            const dateObj = new Date(c.created_at);

            return (
              <div
                key={c.complaint_id}
                className="complaint-card clickable"
                onClick={() => setSelectedComplaint(c)}
              >
                <div className="complaint-header">
                  <span className="complaint-id">
                    Complaint #{c.complaint_id}
                  </span>
                  <span className={`status ${c.status}`}>
                    {c.status}
                  </span>
                </div>

                <div className="complaint-desc">
                  {c.description || "No description provided"}
                </div>

                <div className="complaint-meta">
                  <span>{dateObj.toLocaleDateString()}</span>
                  <span>{dateObj.toLocaleTimeString()}</span>
                </div>

                {c.worker_id && (
                  <div className="assigned-worker">
                    Assigned Worker: {c.worker_name || "Not assigned"}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* LEADERBOARD (placeholder) */}
        <div className="municipal-card">
          <h3>Ward Leaderboard</h3>

          <div className="leaderboard-tabs">
            <button className="active">Monthly</button>
            <button>Yearly</button>
          </div>

          <div className="empty-state">
            Leaderboard data will appear here
          </div>
        </div>

        {/* REGISTER WORKER */}
        <div className="municipal-card">
            <h3>Workers Management</h3>
            <p className="muted-text">
                Register new sanitation workers for Ward 12
            </p>
            <button
                className="primary-btn"
                onClick={() => navigate("/register-worker")}
                >
                ➕ Register New Worker
            </button>
        </div>
      </div>

      {/* 🔍 COMPLAINT MODAL */}
      {selectedComplaint && (
        <div className="modal-overlay">
          <div className="municipal-modal">

            <h3>Complaint #{selectedComplaint.complaint_id}</h3>
            <span className={`status ${selectedComplaint.status}`}>
              {selectedComplaint.status}
            </span>

            <div className="modal-section">
              <strong>Description</strong>
              <p>{selectedComplaint.description}</p>
            </div>

            {/* IMAGE */}
            <strong>Complaint Image</strong>
            <div className="modal-image">
              <img
                src={`http://127.0.0.1:3000${selectedComplaint.image_url}`}
                alt="Complaint"
              />
            </div>

            {/* MAP */}
            <strong>Complaint Location</strong>
            <div className="modal-map">
              <MapContainer
                center={[
                  selectedComplaint.latitude,
                  selectedComplaint.longitude
                ]}
                zoom={17}
                style={{ height: "260px", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />
                <Marker
                  position={[
                    selectedComplaint.latitude,
                    selectedComplaint.longitude
                  ]}
                >
                  <Popup>Complaint Location</Popup>
                </Marker>
              </MapContainer>
            </div>

            {/* CLEANUP PROOF */}
            {selectedComplaint.cleanup_proof_url && (
              <>
                <strong>Cleanup Proof</strong>
                <div className="modal-image">
                  <img
                    src={`http://127.0.0.1:3000${selectedComplaint.cleanup_proof_url}`}
                    alt="Cleanup Proof"
                  />
                </div>
              </>
            )}

            {/* ASSIGN WORKER */}
            {selectedComplaint.status === "REGISTERED" && (
              <button
                className="primary-btn"
                onClick={() => {
                  setAssigningComplaint(selectedComplaint);
                  setShowWorkerList(true);
                }}
              >
                Assign Worker
              </button>
            )}

            {/* APPROVE */}
            {selectedComplaint.status === "IN_PROGRESS" && (
              <button
                className="primary-btn approve"
                onClick={() => approveCleanup(selectedComplaint)}
              >
                Approve Cleanup
              </button>
            )}

            {selectedComplaint.status === "IN_PROGRESS" && (
            <button
                className="danger-btn"
                onClick={async () => {
                const confirmReject = window.confirm(
                    "Are you sure you want to reject this cleanup proof?"
                );

                if (!confirmReject) return;

                const res = await fetch(
                    "http://127.0.0.1:3000/reject-cleanup",
                    {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        role: "municipal"
                    },
                    body: JSON.stringify({
                        complaintId: selectedComplaint.complaint_id
                    })
                    }
                );

                const data = await res.json();

                if (!res.ok) {
                    alert(data.error || "Rejection failed");
                    return;
                }

                // Update UI
                setComplaints(prev =>
                    prev.map(c =>
                    c.complaint_id === selectedComplaint.complaint_id
                        ? { ...c, status: "ASSIGNED", cleanup_proof_url: null }
                        : c
                    )
                );

                alert("Cleanup proof rejected ❌");
                setSelectedComplaint(null);
                }}
            >
                Reject Cleanup
            </button>
            )}

            <button
              className="secondary-btn"
              onClick={() => setSelectedComplaint(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* WORKER SELECT */}
      {showWorkerList && assigningComplaint && (
        <div className="modal-overlay">
          <div className="municipal-modal">

            <h3>Select Worker</h3>

            {workers.map(worker => (
              <div
                key={worker.id}
                className="worker-card"
                onClick={async () => {
                  await fetch("http://127.0.0.1:3000/assign-worker", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      role: "municipal"
                    },
                    body: JSON.stringify({
                      complaintId: assigningComplaint.complaint_id,
                      workerId: worker.id
                    })
                  });

                  setComplaints(prev =>
                    prev.map(c =>
                      c.complaint_id === assigningComplaint.complaint_id
                        ? { ...c, status: "ASSIGNED", worker_id: worker.id }
                        : c
                    )
                  );

                  setShowWorkerList(false);
                  setAssigningComplaint(null);
                  setSelectedComplaint(null);
                }}
              >
                <strong>{worker.name}</strong>
                <div className="worker-meta">Ward: {worker.ward}</div>
              </div>
            ))}

            <button
              className="secondary-btn"
              onClick={() => setShowWorkerList(false)}
            >
              Cancel
            </button>

          </div>
        </div>
      )}
    </>
  );
}
