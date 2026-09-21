import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/uniassist_db';

    const options = {
      autoIndex: process.env.NODE_ENV !== 'production',
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };

    const conn = await mongoose.connect(mongoURI, options);

    console.log(`[MongoDB Connected] Host: ${conn.connection.host} | Database: ${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      console.error(`[MongoDB Runtime Error]: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB Disconnected] Attempting reconnection...');
    });
  } catch (error) {
    console.error(`[MongoDB Initial Connection Error]: ${error.message}`);
    if (error.message.includes('bad auth') || error.message.includes('Authentication failed')) {
      console.error('[Atlas Setup]: Check that your Atlas username/password are correct and that the user has readWrite permissions.');
    } else if (error.message.includes('querySrv EREFUSED') || error.message.includes('ENOTFOUND') || error.message.includes('ETIMEDOUT')) {
      console.error('[Atlas Setup]: Check Network Access in MongoDB Atlas. Ensure 0.0.0.0/0 (Allow access from anywhere) is active for Render.');
    }

    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

export default connectDB;
