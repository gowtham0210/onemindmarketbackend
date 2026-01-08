const express = require("express");
const router = express.Router();
const JoinRequest = require("../models/JoinRequest");
const auth = require('../middleware/auth');

// Get all join requests
router.get("/", auth, async (req, res) => {
  try {
    const requests = await JoinRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Create join request
router.post("/", async (req, res) => {
  try {
    const joinRequest = await JoinRequest.create(req.body);
    res.status(201).json(joinRequest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete join request
router.delete("/:id", auth, async (req, res) => {
  try {
    const request = await JoinRequest.findByIdAndDelete(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    res.json({ message: "Request deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
