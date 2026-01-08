const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/onemind', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    // Do NOT exit process on Netlify/Serverless, as it causes "Runtime.ExitError"
    // and prevents seeing the actual error log.
    // process.exit(1); 
  }
};

module.exports = connectDB;
