const pool = require("./db/index.js");

pool.query("SELECT NOW()")
  .then(res => console.log("🕒 DB Time:", res.rows[0]))
  .catch(err => console.error("DB Error:", err));

const express = require("express");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: "http://localhost:5173"
}));

app.use("/uploads", express.static("uploads"));
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

const dailyPosts = {};

const fs = require("fs");

const otpStore = {};   // phone -> otp

function maskAadhar(aadhar) {
  return "XXXXXXXX" + aadhar.slice(-4);
}

function isValidAadhar(aadhar) {
  return /^\d{12}$/.test(aadhar);
}

app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Node.js backend is running!");
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      error: "Username and password required"
    });
  }

  try {
    const result = await pool.query(
      `SELECT id, username, ward
       FROM municipal
       WHERE username = $1 AND password = $2`,
      [username, password]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({
        error: "Invalid municipal credentials"
      });
    }

    const municipal = result.rows[0];

    res.json({
      message: "Municipal login successful",
      user: {
        id: municipal.id,
        username: municipal.username,
        ward: municipal.ward,
        role: "municipal"
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Server error"
    });
  }
});

function authorizeRole(requiredRole) {
  return (req, res, next) => {
    const role = req.headers["role"];

    if (!role || role !== requiredRole) {
      return res.status(403).json({
        error: "Access denied"
      });
    }

    next();
  };
}

app.post("/register-user", upload.single("profilePic"), async (req, res) => {
  const { name, age, gender, aadhar, phone, address, ward } = req.body;

  if (!name || !age || !phone || !aadhar || !address || !ward) {
    return res.status(400).json({ error: "All fields required" });
  }

  if (!isValidAadhar(aadhar)) {
    return res.status(400).json({ error: "Invalid Aadhar number" });
  }

  // ✅ THIS IS THE KEY LINE
  const profileImageUrl = req.file
    ? `/uploads/${req.file.filename}`
    : null;

  try {
    const result = await pool.query(
      `INSERT INTO users
       (name, age, gender, aadhar_masked, phone, address, ward, profile_image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, name, phone, ward, profile_image_url`,
      [
        name,
        age,
        gender,
        maskAadhar(aadhar),
        phone,
        address,
        ward,
        profileImageUrl
      ]
    );

    res.json({
      message: "Registration successful",
      user: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Phone already registered" });
  }
});

app.post(
  "/register-worker",
  authorizeRole("municipal"),
  upload.single("image"),
  async (req, res) => {
    const { name, age, gender, ward, phone } = req.body;

    if (!name || !age || !gender || !ward || !phone || !req.file) {
      return res.status(400).json({ error: "All fields required" });
    }

    try {
      const exists = await pool.query(
        `SELECT 1 FROM workers WHERE phone = $1`,
        [phone]
      );

      if (exists.rowCount > 0) {
        return res.status(400).json({
          error: "Worker with this phone already exists"
        });
      }

      const result = await pool.query(
        `INSERT INTO workers
         (name, age, gender, ward, profile_image_url, status, join_date, phone)
         VALUES ($1,$2,$3,$4,$5,'ACTIVE',CURRENT_DATE,$6)
         RETURNING *`,
        [
          name,
          age,
          gender,
          ward,
          `/uploads/${req.file.filename}`,
          phone
        ]
      );

      res.json({
        message: "Worker registered successfully",
        worker: result.rows[0]
      });

    } catch (err) {
      res.status(500).json({ error: "Failed to register worker" });
    }
  }
);

app.post(
  "/assign-worker",
  authorizeRole("municipal"),
  async (req, res) => {
    const { complaintId, workerId } = req.body;

    const result = await pool.query(
      `UPDATE complaints
       SET worker_id = $1,
           status = 'ASSIGNED',
           updated_at = NOW()
       WHERE complaint_id = $2
       RETURNING *`,
      [workerId, complaintId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: "Complaint not found"
      });
    }

    res.json({
      message: "Worker assigned successfully",
      complaint: result.rows[0]
    });
  }
);

app.get(
  "/worker-tasks",
  authorizeRole("worker"),
  async (req, res) => {

    const workerId = req.headers["user-id"];

    const result = await pool.query(
      `SELECT 
        c.*,
        u.name AS user_name
      FROM complaints c
      JOIN users u ON c.user_id = u.id
      WHERE c.worker_id = $1
      ORDER BY c.created_at DESC`,
      [workerId]
    );

    res.json(result.rows);
  }
);

app.post(
  "/upload-cleanup-proof",
  authorizeRole("worker"),
  upload.single("image"),
  async (req, res) => {

    const workerId = req.headers["user-id"];
    const { complaintId } = req.body;
    const result = await pool.query(
      `SELECT * FROM complaints
      WHERE complaint_id = $1 AND worker_id = $2`,
      [complaintId, workerId]
    );

    if (result.rowCount === 0) {
      return res.status(403).json({
        error: "Complaint not found or not assigned to this worker"
      });
    }

    try {
      // Send proof image to AI
      const formData = new FormData();
      formData.append(
        "image",
        fs.createReadStream(req.file.path)
      );

      const aiResponse = await axios.post(
        "http://127.0.0.1:5000/upload-image",
        formData,
        { headers: formData.getHeaders() }
      );

      await pool.query(
        `UPDATE complaints
        SET cleanup_proof_url = $1,
            status = 'IN_PROGRESS',
            updated_at = NOW()
        WHERE complaint_id = $2`,
        [`/uploads/${req.file.filename}`, complaintId]
      );

      res.json({
        message: "Cleanup proof uploaded successfully",
        ai_response: aiResponse.data,
      });

    } catch (error) {
      res.status(400).json({
        error: "Invalid cleanup proof image",
        details: error.message
      });
    }
  }
);

// Image submit route
app.post(
  "/submit-image",
  authorizeRole("user"),
  upload.single("image"),
  async (req, res) => {

    const userId = req.headers["user-id"];
    const today = new Date().toISOString().split("T")[0];

    if (!userId) {
      return res.status(400).json({
        error: "User ID required"
      });
    }

    if (dailyPosts[userId] === today) {
      return res.status(403).json({
        error: "Daily post limit reached"
      });
    }

    try {
      // 🔍 Send image to AI first (VALIDATE BEFORE POINTS)
      const formData = new FormData();
      formData.append("type", "daily");
      formData.append(
        "image",
        fs.createReadStream(req.file.path)
      );

      const aiResponse = await axios.post(
        "http://127.0.0.1:5000/upload-image", // ✅ fixed port
        formData,
        { headers: formData.getHeaders() }
      );

      // ✅ Only after AI success → award points

      // Save points in DB
      await pool.query(
        `INSERT INTO user_points (user_id, month, year, points)
        VALUES ($1, $2, $3, $4)`,
        [
          userId,
          new Date().getMonth() + 1,
          new Date().getFullYear(),
          10
        ]
      );

      // Save today's post
      dailyPosts[userId] = today;

      res.json({
        message: "Daily waste post accepted",
        points_awarded: 10,
        ai_response: aiResponse.data
      });

    } catch (error) {

      console.error("AI Daily Validation Error:", error.message);

      // If AI rejected image → forward real reason
      if (error.response && error.response.data) {
        return res.status(400).json({
          error: error.response.data.reason || "AI validation failed"
        });
      }

      return res.status(500).json({
        error: "Server error during image processing"
      });
    }
  }
);

app.post(
  "/raise-complaint",
  authorizeRole("user"),
  upload.single("image"),
  async (req, res) => {

    const userId = req.headers["user-id"];
    const { latitude, longitude, description } = req.body;

    if (!userId || !latitude || !longitude || !req.file) {
      return res.status(400).json({
        error: "User ID, location, and image are required"
      });
    }

    try {
      // 🔍 AI validation
      const formData = new FormData();
      formData.append("type", "complaint");
      formData.append(
        "image",
        fs.createReadStream(req.file.path)
      );

      await axios.post(
        "http://127.0.0.1:5000/upload-image",
        formData,
        { headers: formData.getHeaders() }
      );

      // 💾 Insert into DB
      const result = await pool.query(
        `INSERT INTO complaints
         (user_id, description, image_url, latitude, longitude, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'REGISTERED', NOW(), NOW())
         RETURNING *`,
        [
          userId,
          description,
          `/uploads/${req.file.filename}`,
          latitude,
          longitude
        ]
      );

      res.json({
        message: "Complaint registered successfully",
        complaint: result.rows[0]
      });

    } 
    catch (error) {
      console.error("AI Validation Error:", error.message);

      // If error came from AI service
      if (error.response && error.response.data) {
        return res.status(400).json({
          error: error.response.data.reason || "AI validation failed"
        });
      }

      // Other unexpected errors
      return res.status(500).json({
        error: "Server error during complaint validation"
      });
    }
  }
);

app.get(
  "/my-complaints",
  authorizeRole("user"),
  async (req, res) => {

    const userId = req.headers["user-id"];
    
    const result = await pool.query(
      `SELECT 
        c.*,
        w.name AS worker_name
      FROM complaints c
      LEFT JOIN workers w ON c.worker_id = w.id
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC;`,
      [userId]
    );

    res.json(result.rows);
  }
);

app.get(
  "/all-complaints",
  authorizeRole("municipal"),
  async (req, res) => {
    const result = await pool.query(
      `SELECT 
        c.*,
        w.name AS worker_name
      FROM complaints c
      LEFT JOIN workers w ON c.worker_id = w.id
      ORDER BY c.created_at DESC;`
    );
    res.json(result.rows);
  }
);

app.post(
  "/approve-cleanup",
  authorizeRole("municipal"),
  async (req, res) => {
    const { userId, complaintId } = req.body;

    if (!userId || !complaintId) {
      return res.status(400).json({ error: "User ID and Complaint ID required" });
    }

    // ✅ Check complaint status first
    const check = await pool.query(
      `SELECT status FROM complaints WHERE complaint_id = $1`,
      [complaintId]
    );

    if (check.rowCount === 0) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    if (check.rows[0].status !== "IN_PROGRESS") {
      return res.status(400).json({
        error: "Cleanup proof not uploaded yet"
      });
    }

    // ✅ Update status
    await pool.query(
      `UPDATE complaints
       SET status = 'RESOLVED', updated_at = NOW()
       WHERE complaint_id = $1`,
      [complaintId]
    );

    // 🔢 POINTS (temporary in-memory)
    const currentMonth = new Date().toISOString().slice(0, 7);

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Check how many rewards already given this month
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM user_points
      WHERE user_id = $1 AND month = $2 AND year = $3 AND points = 5`,
      [userId, month, year]
    );

    if (parseInt(countResult.rows[0].count) >= 3) {
      return res.json({
        message: "Monthly complaint reward limit reached",
        points_awarded: 0
      });
    }

    // Insert points
    await pool.query(
      `INSERT INTO user_points (user_id, month, year, points)
      VALUES ($1, $2, $3, $4)`,
      [userId, month, year, 5]
    );

    res.json({
      message: "Cleanup approved and points awarded",
      points_awarded: 5
    });
  }
);

app.post(
  "/reject-cleanup",
  authorizeRole("municipal"),
  async (req, res) => {
    const { complaintId } = req.body;

    if (!complaintId) {
      return res.status(400).json({ error: "Complaint ID required" });
    }

    // Check complaint
    const check = await pool.query(
      `SELECT status FROM complaints WHERE complaint_id = $1`,
      [complaintId]
    );

    if (check.rowCount === 0) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    if (check.rows[0].status !== "IN_PROGRESS") {
      return res.status(400).json({
        error: "Cleanup proof not uploaded yet"
      });
    }

    // 🔴 Reject cleanup → back to ASSIGNED
    await pool.query(
      `UPDATE complaints
       SET status = 'ASSIGNED',
           cleanup_proof_url = NULL,
           updated_at = NOW()
       WHERE complaint_id = $1`,
      [complaintId]
    );

    res.json({
      message: "Cleanup proof rejected. Worker can upload again."
    });
  }
);

app.get(
  "/leaderboard/monthly",
  authorizeRole("user"),
  async (req, res) => {

    const userId = req.headers["user-id"];

    try {
      // 1️⃣ Get user's ward
      const userResult = await pool.query(
        `SELECT ward FROM users WHERE id = $1`,
        [userId]
      );

      if (userResult.rowCount === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const ward = userResult.rows[0].ward;

      // 2️⃣ Get current month & year
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      // 3️⃣ Leaderboard query
      const leaderboard = await pool.query(
        `SELECT 
           u.id AS user_id,
           u.name,
           COALESCE(SUM(up.points), 0) AS points
         FROM users u
         LEFT JOIN user_points up
           ON u.id = up.user_id
           AND up.month = $1
           AND up.year = $2
         WHERE u.ward = $3
         GROUP BY u.id, u.name
         ORDER BY points DESC`,
        [month, year, ward]
      );

      res.json({
        ward,
        type: "monthly",
        leaderboard: leaderboard.rows
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

app.get("/leaderboard/yearly", authorizeRole("user"), async (req, res) => {
  const userId = req.headers["user-id"];

  try {
    const userResult = await pool.query(
      `SELECT ward FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const ward = userResult.rows[0].ward;
    const year = new Date().getFullYear();

    const leaderboard = await pool.query(
      `SELECT 
         u.id AS user_id,
         u.name,
         COALESCE(SUM(up.points), 0) AS points
       FROM users u
       LEFT JOIN user_points up
         ON u.id = up.user_id
         AND up.year = $1
       WHERE u.ward = $2
       GROUP BY u.id, u.name
       ORDER BY points DESC`,
      [year, ward]
    );

    res.json({
      ward,
      type: "yearly",
      leaderboard: leaderboard.rows
    });

  } catch (err) {
    console.error("YEARLY ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/user-points", authorizeRole("user"), async (req, res) => {
  const userId = req.headers["user-id"];

  try {
    const result = await pool.query(
      `SELECT COALESCE(SUM(points), 0) AS total_points
       FROM user_points
       WHERE user_id = $1`,
      [userId]
    );

    res.json({
      totalPoints: result.rows[0].total_points
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch points" });
  }
});

app.post("/send-otp", async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: "Phone number required" });
  }

  // 1️⃣ Check users table
  let result = await pool.query(
    `SELECT id FROM users WHERE phone = $1`,
    [phone]
  );

  let role = null;
  let userId = null;

  if (result.rowCount > 0) {
    role = "user";
    userId = result.rows[0].id;
  } else {
    // 2️⃣ Check workers table
    result = await pool.query(
      `SELECT id FROM workers WHERE phone = $1 AND status = 'ACTIVE'`,
      [phone]
    );

    if (result.rowCount > 0) {
      role = "worker";
      userId = result.rows[0].id;
    }
  }

  if (!role) {
    return res.status(404).json({
      error: "Phone number not registered"
    });
  }

  // 3️⃣ Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  otpStore[phone] = {
    otp,
    role,
    userId,
    expiresAt: Date.now() + 5 * 60 * 1000
  };

  console.log(`OTP for ${phone} (${role}): ${otp}`);

  res.json({
    message: "OTP sent successfully"
  });
});

app.post("/verify-otp", async (req, res) => {
  const { phone, otp } = req.body;

  const record = otpStore[phone];

  if (
    !record ||
    record.otp !== otp ||
    Date.now() > record.expiresAt
  ) {
    return res.status(401).json({
      error: "Invalid or expired OTP"
    });
  }

  // Cleanup OTP
  delete otpStore[phone];

  res.json({
    message: "Login successful",
    role: record.role,
    id: record.userId
  });
});

app.get(
  "/daily-status",
  authorizeRole("user"),
  (req, res) => {
    const userId = req.headers["user-id"];
    const today = new Date().toISOString().split("T")[0];

    const hasPostedToday = dailyPosts[userId] === today;

    res.json({
      hasPostedToday
    });
  }
);

app.delete(
  "/delete-complaint/:id",
  authorizeRole("user"),
  async (req, res) => {

    const complaintId = req.params.id;
    const userId = req.headers["user-id"];

    const result = await pool.query(
      `DELETE FROM complaints
       WHERE complaint_id = $1
         AND user_id = $2
         AND status = 'REGISTERED'
       RETURNING *`,
      [complaintId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({
        error: "Only registered complaints can be deleted"
      });
    }

    res.json({
      message: "Complaint deleted successfully"
    });
  }
);

app.get(
  "/me",
  authorizeRole("user"),
  async (req, res) => {
    const userId = req.headers["user-id"];

    const result = await pool.query(
      `SELECT name, phone, gender, profile_image_url FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  }
);

app.get(
  "/municipal/me",
  authorizeRole("municipal"),
  async (req, res) => {
    const municipalId = req.headers["user-id"];

    const result = await pool.query(
      `SELECT
         id,
         commissioner_name,
         ward,
         address,
         commissioner_image_url
       FROM municipal
       WHERE id = $1`,
      [municipalId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Municipal not found" });
    }

    res.json(result.rows[0]);
  }
);

app.get(
  "/worker/me",
  authorizeRole("worker"),
  async (req, res) => {
    const workerId = req.headers["user-id"];

    const result = await pool.query(
      `SELECT id, name, phone, ward, profile_image_url
       FROM workers
       WHERE id = $1`,
      [workerId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Worker not found" });
    }

    res.json(result.rows[0]);
  }
);

app.get(
  "/workers",
  authorizeRole("municipal"),
  async (req, res) => {
    const result = await pool.query(
      `SELECT id, name, ward
       FROM workers
       WHERE status = 'ACTIVE'`
    );
    res.json(result.rows);
  }
);

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

app.listen(3000, () => {
  console.log("Node.js server running on http://127.0.0.1:3000");
});
