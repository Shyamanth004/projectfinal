import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

export default function WorkerTasks() {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [proofImage, setProofImage] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));
  const workerId = user?.id;

  // 📥 Fetch assigned tasks (DB)
  useEffect(() => {
    if (!workerId) return;

    fetch("http://127.0.0.1:3000/worker-tasks", {
      headers: {
        role: "worker",
        "user-id": workerId
      }
    })
      .then(res => res.json())
      .then(data => setTasks(data))
      .catch(() => setTasks([]));
  }, [workerId]);

  // 📤 Upload cleanup proof
  async function uploadProof(task) {
    if (!proofImage) {
      alert("Please select a cleanup image");
      return;
    }

    const formData = new FormData();
    formData.append("image", proofImage);
    formData.append("complaintId", task.complaint_id);

    const res = await fetch(
      "http://127.0.0.1:3000/upload-cleanup-proof",
      {
        method: "POST",
        headers: {
          role: "worker",
          "user-id": workerId
        },
        body: formData
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Upload failed");
      return;
    }

    // ✅ Update UI
    setTasks(prev =>
      prev.map(t =>
        t.complaint_id === task.complaint_id
          ? { ...t, status: "IN_PROGRESS", cleanup_proof_url: data.cleanup_proof_url }
          : t
      )
    );

    setProofImage(null);
    setSelectedTask(null);
    alert("Cleanup proof uploaded successfully ✅");
  }

  return (
    <>
      {/* TASK LIST */}
      <div className="worker-tasks-card">
        <h3>Assigned Tasks</h3>

        {tasks.length === 0 && (
          <p className="muted-text">No tasks assigned yet</p>
        )}

        {tasks.map(task => (
          <div
            key={task.complaint_id}
            className="worker-task-card clickable"
            onClick={() => setSelectedTask(task)}
          >
            <div className="worker-task-header">
              <strong>Complaint #{task.complaint_id}</strong>
              <span className={`status ${task.status}`}>
                {task.status}
              </span>
            </div>

            <div className="worker-task-meta">
              📍 {task.latitude}, {task.longitude}
            </div>
          </div>
        ))}
      </div>

      {/* TASK DETAILS MODAL */}
      {selectedTask && (
        <div className="modal-overlay">
          <div className="municipal-modal">

            <h3>Complaint #{selectedTask.complaint_id}</h3>
            <span className={`status ${selectedTask.status}`}>
              {selectedTask.status}
            </span>

            <div className="modal-section">
              <strong>Description</strong>
              <p>{selectedTask.description || "No description provided"}</p>
            </div>

            {/* COMPLAINT IMAGE */}
            <strong>Complaint Image</strong>
            <div className="modal-image">
              <img
                src={`http://127.0.0.1:3000${selectedTask.image_url}`}
                alt="Complaint"
              />
            </div>

            {/* LOCATION MAP */}
            <strong>Complaint Location</strong>
            <div className="modal-map">
              <MapContainer
                center={[selectedTask.latitude, selectedTask.longitude]}
                zoom={17}
                style={{ height: "260px", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  attribution="© OpenStreetMap © CARTO"
                />
                <Marker position={[selectedTask.latitude, selectedTask.longitude]}>
                  <Popup>Complaint Location</Popup>
                </Marker>
              </MapContainer>
            </div>

            {/* CLEANUP PROOF (after upload) */}
            {selectedTask.cleanup_proof_url && (
              <>
                <strong>Uploaded Cleanup Proof</strong>
                <div className="modal-image">
                  <img
                    src={`http://127.0.0.1:3000${selectedTask.cleanup_proof_url}`}
                    alt="Cleanup Proof"
                  />
                </div>
              </>
            )}

            {/* UPLOAD PROOF */}
            {selectedTask.status === "ASSIGNED" && (
              <>
                <div className="worker-dashboard-upload-wrapper">
                  <label className="worker-dashboard-upload-label">
                    📷 Select Cleanup Proof
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => setProofImage(e.target.files[0])}
                    />
                  </label>

                  <button
                    className="worker-dashboard-upload-btn"
                    onClick={() => uploadProof(selectedTask)}
                  >
                    Upload Proof
                  </button>
                </div>

                {proofImage && (
                  <div className="worker-dashboard-upload-status">
                    Image selected ✔
                  </div>
                )}
              </>
            )}

            {selectedTask.status === "IN_PROGRESS" && (
              <div className="worker-dashboard-upload-status">
                ✅ Proof submitted. Awaiting approval.
              </div>
            )}

            <button
              className="secondary-btn"
              onClick={() => setSelectedTask(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
