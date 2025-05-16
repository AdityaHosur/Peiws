const { MongoClient, GridFSBucket } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

let gfsBucket;

// Initialize MongoDB connection and GridFS bucket
const connectToGridFS = async () => {
  try {
    const client = new MongoClient(process.env.MONGO_URI);

    await client.connect();
    const db = client.db(); // Use the default database from the connection string
    gfsBucket = new GridFSBucket(db, { bucketName: 'uploads' });

    console.log('GridFS bucket initialized');
  } catch (error) {
    console.error('Error initializing GridFS bucket:', error);
  }
};

const getGridFSBucket = () => {
  if (!gfsBucket) {
    throw new Error('GridFS bucket is not initialized');
  }
  return gfsBucket;
};

module.exports = { connectToGridFS, getGridFSBucket };