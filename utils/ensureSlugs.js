const Customer = require('../models/Customer');
const Category = require('../models/Category');
const Location = require('../models/Location');

async function ensureSlugs() {
  try {
    // Backfill customers
    const customers = await Customer.find({ $or: [ { slug: { $exists: false } }, { slug: null } ] }).lean();
    if (customers && customers.length > 0) {
      console.log(`Found ${customers.length} customers without slugs. Generating...`);
      function slugify(text) {
        return text
          .toString()
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-');
      }
      for (const c of customers) {
        let base = slugify(c.shopName || 'shop');
        let slug = base;
        let i = 1;
        while (await Customer.findOne({ slug })) {
          slug = `${base}-${i++}`;
        }
        await Customer.findByIdAndUpdate(c._id, { slug });
      }
    }

    // Backfill categories
    const categories = await Category.find({ $or: [ { slug: { $exists: false } }, { slug: null } ] }).lean();
    if (categories && categories.length > 0) {
      console.log(`Found ${categories.length} categories without slugs. Generating...`);
      function slugify(text) {
        return text
          .toString()
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-');
      }
      for (const c of categories) {
        let base = slugify(c.name || 'category');
        let slug = base;
        let i = 1;
        while (await Category.findOne({ slug })) {
          slug = `${base}-${i++}`;
        }
        await Category.findByIdAndUpdate(c._id, { slug });
      }
    }

    // Backfill locations
    const locations = await Location.find({ $or: [ { slug: { $exists: false } }, { slug: null } ] }).lean();
    if (locations && locations.length > 0) {
      console.log(`Found ${locations.length} locations without slugs. Generating...`);
      function slugify(text) {
        return text
          .toString()
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-');
      }
      for (const l of locations) {
        let base = slugify(l.name || 'location');
        let slug = base;
        let i = 1;
        while (await Location.findOne({ slug })) {
          slug = `${base}-${i++}`;
        }
        await Location.findByIdAndUpdate(l._id, { slug });
      }
    }
  } catch (err) {
    console.error('Error ensuring slugs:', err);
  }
}

module.exports = ensureSlugs;
