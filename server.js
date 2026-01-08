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
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

app.use("/uploads", express.static(uploadDir));

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

connectDB(MONGO_URI);

// ensure admin user exists if env vars provided

const ensureSlugs = require('./utils/ensureSlugs');
ensureSlugs();

app.use("/api/categories", categoryRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/join-requests", joinRequestRoutes);
app.use("/api/enquiries", require("./routes/enquiryRoutes"));


// basic health route
app.get("/", (req, res) => res.send("MERN Search Backend is running"));

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
