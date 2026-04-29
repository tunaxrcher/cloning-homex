// test-db.js
const mariadb = require('mariadb');

async function testConnection() {
  const pool = mariadb.createPool({
    host: "127.0.0.1",
    user: "root",
    password: "",
    database: "homex",
    port: 3306,
    connectionLimit: 1
  });

  console.log("⏳ Testing Connection...");
  try {
    const conn = await pool.getConnection();
    console.log("✅ SUCCESS! Connected to Database ID:", conn.threadId);
    console.log("✅ Database is running and reachable.");
    conn.release(); // ปล่อย Connection
  } catch (err) {
    console.error("❌ FAILED to connect:", err.message);
    console.error("👉 Please check if XAMPP/MySQL is running.");
  } finally {
    await pool.end();
  }
}

testConnection();