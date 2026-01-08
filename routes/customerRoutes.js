const express = require("express");
const multer = require("multer");
const path = require("path");
const Customer = require("../models/Customer");
const Category = require("../models/Category");
const Location = require("../models/Location");

const router = express.Router();

// multer storage (store in backend/uploads)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = file.fieldname + "-" + Date.now();
    cb(null, base + ext);
  }
});

const upload = multer({ storage });

// helper: slugify and ensure unique slug
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
  let base = slugify(baseText || 'shop');
  let slug = base;
  let i = 1;
  // check existence
  while (true) {
    const q = { slug };
    if (excludeId) q._id = { $ne: excludeId };
    const exists = await Customer.findOne(q).lean();
    if (!exists) return slug;
    slug = `${base}-${i++}`;
  }
}

// Create customer with file uploads (shopPhoto, ownerPhoto, shopPhotos)
const auth = require('../middleware/auth');

// Create customer with file uploads (shopPhoto, ownerPhoto, shopPhotos)
router.post("/", auth, upload.fields([{ name: "shopPhoto", maxCount: 1 }, { name: "ownerPhoto", maxCount: 1 }, { name: "shopPhotos", maxCount: 10 }]), async (req, res) => {
  try {
    const body = req.body;

    // Validate category & location ids exist
    const category = await Category.findById(body.category);
    const location = await Location.findById(body.location);
    if (!category || !location) {
      return res.status(400).json({ message: "Invalid category or location" });
    }

    const customerData = {
      shopName: body.shopName,
      ownerName: body.ownerName,
      ownerPhone: body.ownerPhone,
      shopPhone: body.shopPhone,
      email: body.email,
      website: body.website,
      address: body.address,
      shopDescription: body.shopDescription,
      shopArticle: body.shopArticle,
      category: body.category,
      location: body.location,
      joinedAt: body.joinedAt ? new Date(body.joinedAt) : null
    };

    if (req.files?.shopPhoto?.[0]) customerData.shopPhoto = req.files.shopPhoto[0].filename;
    if (req.files?.ownerPhoto?.[0]) customerData.ownerPhoto = req.files.ownerPhoto[0].filename;
    if (req.files?.shopPhotos?.length > 0) {
      customerData.shopPhotos = req.files.shopPhotos.map(f => f.filename);
    }

    // generate unique slug for shopName
    customerData.slug = await generateUniqueSlug(customerData.shopName);

    const customer = await Customer.create(customerData);

    res.status(201).json(customer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all customers (optionally filter by category/location or search by name)
router.get("/", async (req, res) => {
  try {
    const { category, location, q } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (location) filter.location = location;
    if (q) filter.shopName = { $regex: q, $options: "i" };

    const customers = await Customer.find(filter).populate("category location").sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get single customer
// Get single customer by id
router.get("/:id", async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).populate("category location");
    if (!customer) return res.status(404).json({ message: "Not found" });
    res.json(customer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get single customer by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const customer = await Customer.findOne({ slug: req.params.slug }).populate('category location');
    if (!customer) return res.status(404).json({ message: 'Not found' });
    res.json(customer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get customer photos (optionally return a specific group for slider)
// Query param: ?group=1|2|3  -> returns photos at indices where index % 3 === group-1
router.get('/:id/photos', async (req, res) => {
  try {
    const groupQ = req.query.group;
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Not found' });
    const photos = Array.isArray(customer.shopPhotos) ? customer.shopPhotos : [];

    if (!groupQ) {
      return res.json(photos);
    }

    const group = parseInt(groupQ, 10);
    if (![1, 2, 3].includes(group)) {
      return res.status(400).json({ message: 'group must be 1, 2 or 3' });
    }

    const groupPhotos = photos.filter((_, idx) => (idx % 3) === (group - 1));
    return res.json(groupPhotos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update customer
router.put("/:id", auth, upload.fields([{ name: "shopPhoto", maxCount: 1 }, { name: "ownerPhoto", maxCount: 1 }, { name: "shopPhotos", maxCount: 10 }]), async (req, res) => {
  try {
    const body = req.body;
    const customerId = req.params.id;

    // Validate category & location ids exist if provided
    if (body.category) {
      const category = await Category.findById(body.category);
      if (!category) return res.status(400).json({ message: "Invalid category" });
    }
    if (body.location) {
      const location = await Location.findById(body.location);
      if (!location) return res.status(400).json({ message: "Invalid location" });
    }

    const updateData = {
      shopName: body.shopName,
      ownerName: body.ownerName,
      ownerPhone: body.ownerPhone,
      shopPhone: body.shopPhone,
      email: body.email,
      website: body.website,
      address: body.address,
      shopDescription: body.shopDescription,
      shopArticle: body.shopArticle,
      category: body.category,
      location: body.location
    };

    if (body.joinedAt !== undefined) updateData.joinedAt = body.joinedAt ? new Date(body.joinedAt) : null;

    if (req.files?.shopPhoto?.[0]) updateData.shopPhoto = req.files.shopPhoto[0].filename;
    if (req.files?.ownerPhoto?.[0]) updateData.ownerPhoto = req.files.ownerPhoto[0].filename;
    if (req.files?.shopPhotos?.length > 0) {
      updateData.shopPhotos = req.files.shopPhotos.map(f => f.filename);
    }

    // update slug if shopName changed
    if (updateData.shopName) {
      updateData.slug = await generateUniqueSlug(updateData.shopName, customerId);
    }

    const customer = await Customer.findByIdAndUpdate(customerId, updateData, { new: true }).populate("category location");
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    res.json(customer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete customer
router.delete("/:id", auth, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json({ message: "Customer deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
