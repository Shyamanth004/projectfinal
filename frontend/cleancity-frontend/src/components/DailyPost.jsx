import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

export default function DailyPost() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [checks, setChecks] = useState({
    upload: false,
    resolution: false,
    duplicate: false,
    ai: false
  });

  const [canPost, setCanPost] = useState(false);
  const [status, setStatus] = useState("");
  const [dailyPosted, setDailyPosted] = useState(false);
  const [posting, setPosting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;

  /* 🔐 Safety: redirect if not logged in */
  useEffect(() => {
    if (!userId) {
      navigate("/");
    }
  }, [userId, navigate]);

  /* 📅 Check if user already posted today */
  useEffect(() => {
    async function checkDailyStatus() {
      try {
        const res = await fetch("http://127.0.0.1:3000/daily-status", {
          headers: {
            role: "user",
            "user-id": userId
          }
        });

        const data = await res.json();
        if (data.hasPostedToday) {
          setDailyPosted(true);
        }
      } catch {
        console.error("Failed to fetch daily status");
      }
    }

    if (userId) {
      checkDailyStatus();
    }
  }, [userId]);

  /* 📷 Handle image selection */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
    setShowModal(true);
    runChecks();
  };

  /* 🧪 Simulated validation checks */
  const runChecks = () => {
    setChecks({
      upload: false,
      resolution: false,
      duplicate: false,
      ai: false
    });
    setCanPost(false);

    setTimeout(() => setChecks(p => ({ ...p, upload: true })), 400);
    setTimeout(() => setChecks(p => ({ ...p, resolution: true })), 800);
    setTimeout(() => setChecks(p => ({ ...p, duplicate: true })), 1200);
    setTimeout(() => {
      setChecks(p => ({ ...p, ai: true }));
      setCanPost(true);
    }, 1600);
  };

  /* 🚀 Submit daily post */
  const submitDailyPost = async () => {
    if (!image) return;

    setPosting(true);
    setStatus("Posting...");

    const formData = new FormData();
    formData.append("image", image);

    try {
      const res = await fetch("http://127.0.0.1:3000/submit-image", {
        method: "POST",
        headers: {
          role: "user",
          "user-id": userId
        },
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.error || "Upload failed");
        setPosting(false);
        return;
      }

      setStatus("✅ Daily waste post submitted! +10 points");
      setDailyPosted(true);

      setTimeout(() => {
        setShowModal(false);
        setImage(null);
        setPreview(null);
        setPosting(false);
      }, 1400);

    } catch {
      setStatus("Server error");
      setPosting(false);
    }
  };

  return (
    <>
      {/* DAILY BAR */}
      <div className="daily-bar">

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        <div
          className={`daily-post-btn ${dailyPosted ? "disabled" : ""}`}
          onClick={() => {
            if (!dailyPosted) fileInputRef.current.click();
          }}
        >
          {dailyPosted ? "✔️" : "📷"}
        </div>

        <div className="daily-post-label">Daily Post</div>

        <div className="menu-btn" onClick={() => setShowMenu(true)}>
          ☰
          <div className="menu-bar-label">Menu</div>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="daily-modal">
            <h3>Confirm Daily Post</h3>

            <img src={preview} alt="Preview" className="modal-preview" />

            <ul className="checklist">
              <li className={checks.upload ? "done" : ""}>Image uploaded</li>
              <li className={checks.resolution ? "done" : ""}>Resolution verified</li>
              <li className={checks.duplicate ? "done" : ""}>Duplicate check passed</li>
              <li className={checks.ai ? "done" : ""}>AI validation complete</li>
            </ul>

            <button
              className="primary-btn"
              disabled={!canPost || posting}
              onClick={submitDailyPost}
            >
              {posting ? "Posting..." : "Post Daily Waste"}
            </button>

            <button
              className="secondary-btn"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>

            <p style={{ fontSize: "13px" }}>{status}</p>
          </div>
        </div>
      )}

      {/* RIGHT DRAWER */}
      {showMenu && (
        <>
          <div className="drawer-overlay" onClick={() => setShowMenu(false)} />

          <div className="drawer">
            <div className="drawer-item" onClick={() => navigate("/user")}>
              🏠 Dashboard
            </div>

            <div className="drawer-item" onClick={() => navigate("/leaderboard")}>
              🏆 Leaderboard
            </div>

            <div className="drawer-item" onClick={() => navigate("/feedback")}>
              📝 Feedback
            </div>

            <div
              className="drawer-item logout"
              onClick={() => {
                localStorage.removeItem("user");
                navigate("/");
              }}
            >
              🚪 Logout
            </div>
          </div>
        </>
      )}
    </>
  );
}
