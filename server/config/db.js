const mongoose = require('mongoose');

const getMongoUri = () => process.env.MONGODB_URI || process.env.MONGO_URI;

const connectDB = async () => {
  if (process.env.SKIP_DB === 'true') {
    console.log('MongoDB connection skipped because SKIP_DB=true');
    return null;
  }

  const mongoUri = getMongoUri();

  if (!mongoUri) {
    console.error('MongoDB connection string is missing. Set MONGODB_URI or MONGO_URI.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
module.exports.getMongoUri = getMongoUri;
