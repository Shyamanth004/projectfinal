import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function ComplaintsSection() {
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;

    fetch("http://127.0.0.1:3000/my-complaints", {
      headers: {
        role: "user",
        "user-id": userId
      }
    })
      .then(res => res.json())
      .then(data => setComplaints(data))
      .catch(() => setComplaints([]));
  }, [userId]);

  async function deleteComplaint(complaintId) {
    if (!window.confirm("Are you sure you want to delete this complaint?")) {
      return;
    }

    const res = await fetch(
      `http://127.0.0.1:3000/delete-complaint/${complaintId}`,
      {
        method: "DELETE",
        headers: {
          role: "user",
          "user-id": userId
        }
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Delete failed");
      return;
    }

    setComplaints(prev =>
      prev.filter(c => c.complaint_id !== complaintId)
    );

    setSelectedComplaint(null);
    alert("Complaint deleted successfully 🗑️");
  }

  return (
    <>
      <div className="section">
        <div className="section-title">My Complaints</div>

        {complaints.length === 0 && (
          <p>No complaints filed yet.</p>
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
                <span>📅 {dateObj.toLocaleDateString()}</span>
                <span>⏰ {dateObj.toLocaleTimeString()}</span>
              </div>
            </div>
          );
        })}

        <button
          className="primary-btn"
          onClick={() => navigate("/complaint/new")}
        >
          Raise Complaint
        </button>
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

            {selectedComplaint.worker_name && (
                <div className="modal-section">
                    <strong>Assigned Worker</strong>
                    <p>{selectedComplaint.worker_name}</p>
                </div>
            )}

            {/* COMPLAINT IMAGE */}
            <strong>Complaint Image</strong>
            <div className="modal-image">
              <img
                src={`http://127.0.0.1:3000${selectedComplaint.image_url}`}
                alt="Complaint"
              />
            </div>

            {/* LOCATION MAP */}
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
                  attribution="© OpenStreetMap © CARTO"
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

            {/* DELETE OPTION */}
            {selectedComplaint.status === "REGISTERED" && (
              <button
                className="danger-btn"
                onClick={() =>
                  deleteComplaint(selectedComplaint.complaint_id)
                }
              >
                🗑️ Delete Complaint
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
    </>
  );
}
