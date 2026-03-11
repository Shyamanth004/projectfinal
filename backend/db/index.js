const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: "localhost",
  user: "postgres",
  password: process.env.DB_PASSWORD,
  database: "smart_waste_db",
  port: 5432
});

pool.on("connect", () => {
  console.log("✅ PostgreSQL connected");
});

module.exports = pool;
