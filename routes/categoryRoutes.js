const express = require("express");
const Category = require("../models/Category");
const router = express.Router();

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function generateUniqueSlug(baseText, excludeId) {
  let base = slugify(baseText || 'category');
  let slug = base;
  let i = 1;
  while (true) {
    const q = { slug };
    if (excludeId) q._id = { $ne: excludeId };
    const exists = await Category.findOne(q).lean();
    if (!exists) return slug;
    slug = `${base}-${i++}`;
  }
}

const auth = require('../middleware/auth');

// Create category
router.post("/", auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name required" });

    const existing = await Category.findOne({ name: name.trim() });
    if (existing) return res.status(409).json({ message: "Category already exists" });

    const slug = await generateUniqueSlug(name);
    const category = await Category.create({ name: name.trim(), slug });
    res.status(201).json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all categories (admin) or categories with customers (user)
router.get("/", async (req, res) => {
  try {
    // Check if request has auth header (admin)
    const isAdmin = req.headers.authorization && req.headers.authorization.startsWith('Bearer');

    if (isAdmin) {
      // Return all categories for admin
      const categories = await Category.find().sort({ name: 1 });
      res.json(categories);
    } else {
      // Return only categories with customers for users
      const categories = await Category.aggregate([
        {
          $lookup: {
            from: "customers",
            localField: "_id",
            foreignField: "category",
            as: "customers"
          }
        },
        {
          $match: {
            "customers.0": { $exists: true }
          }
        },
        {
          $sort: { name: 1 }
        }
      ]);
      res.json(categories);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update category
router.put("/:id", auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name required" });

    const existing = await Category.findOne({ name: name.trim(), _id: { $ne: req.params.id } });
    if (existing) return res.status(409).json({ message: "Category already exists" });

    const slug = await generateUniqueSlug(name, req.params.id);
    const category = await Category.findByIdAndUpdate(req.params.id, { name: name.trim(), slug }, { new: true });
    if (!category) return res.status(404).json({ message: "Category not found" });

    res.json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete category
router.delete("/:id", auth, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json({ message: "Category deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get category by slug
router.get("/slug/:slug", async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) return res.status(404).json({ message: "Not found" });
    res.json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
