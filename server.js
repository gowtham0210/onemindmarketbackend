const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./config/db");

const categoryRoutes = require("./routes/categoryRoutes");
const locationRoutes = require("./routes/locationRoutes");
const customerRoutes = require("./routes/customerRoutes");
const authRoutes = require("./routes/authRoutes");
const joinRequestRoutes = require("./routes/joinRequestRoutes");

const app = express();
app.use(cors({
  origin: ['http://localhost:3000', 'https://onemindmarket.in']
}));
app.use(express.json());

// ensure uploads folder exists
let uploadDir = path.join(__dirname, "uploads");

// On Netlify/Lambda, root is read-only. We must use /tmp.
try {
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
} catch (err) {
  if (err.code === 'EROFS') {
    console.log("Read-only filesystem detected. Switching upload dir to /tmp/uploads");
    uploadDir = "/tmp/uploads";
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
  } else {
    throw err;
  }
}

app.use("/uploads", express.static(uploadDir));

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

connectDB(MONGO_URI);

// ensure admin user exists if env vars provided

// const ensureSlugs = require('./utils/ensureSlugs');
// ensureSlugs(); // Disable backfill on Serverless boot to prevent timeout

if (!MONGO_URI) {
  console.error("FATAL: MONGO_URI is missing in Environment Variables!");
}

app.use("/api/categories", categoryRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/join-requests", joinRequestRoutes);
app.use("/api/enquiries", require("./routes/enquiryRoutes"));


// basic health route
app.get("/", (req, res) => {
  const status = mongoose.connection.readyState;
  const statusMap = {
    0: "Disconnected",
    1: "Connected",
    2: "Connecting",
    3: "Disconnecting",
  };
  res.send(`MERN Backend Running. DB Status: ${statusMap[status] || status}`);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
