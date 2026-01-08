const express = require("express");
const router = express.Router();
const Enquiry = require("../models/Enquiry");

router.post("/", async (req, res) => {
  try {
    const enquiry = await Enquiry.create({
      shop: req.body.shopId,
      name: req.body.name,
      phone: req.body.phone,
      enquiry: req.body.enquiry,
      referredBy: req.body.referredBy
    });
    res.status(201).json(enquiry);
  } catch (err) {
    res.status(500).json({ message: "Failed to save enquiry" });
  }
});

router.get("/", async (req, res) => {
  const enquiries = await Enquiry.find().populate("shop");
  res.json(enquiries);
});

router.delete("/", async (req, res) => {
  await Enquiry.deleteMany({});
  res.json({ success: true });
});


module.exports = router;
