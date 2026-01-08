const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema(
  {
    shopName: { type: String, required: true },
    slug: { type: String, unique: true, index: true },
    ownerName: { type: String },
    ownerPhone: { type: String },
    shopPhone: { type: String },
    email: { type: String },
    website: { type: String },
    shopPhoto: { type: String },   // main photo
    shopPhotos: [{ type: String }], // array of additional photos
    ownerPhoto: { type: String },
    address: { type: String },
    shopDescription: { type: String },
    shopArticle: { type: String },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    location: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true },
    joinedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Customer", CustomerSchema);
