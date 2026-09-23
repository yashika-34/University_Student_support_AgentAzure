import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/uniassist_db');

const db = mongoose.connection.db;
const usersCollection = db.collection('users');

// Hash passwords correctly (plain-text -> bcrypt, bypassing the double-hash issue)
const facultyHash = await bcrypt.hash('Faculty@1234', 10);
const studentHash = await bcrypt.hash('Student@1234', 10);

const demoUsers = [
  { email: 'dr.alan@university.edu', hash: facultyHash },
  { email: 'alex.student@university.edu', hash: studentHash },
  { email: 'emma.student@university.edu', hash: studentHash },
  { email: 'liam.student@university.edu', hash: studentHash },
  { email: 'priya.student@university.edu', hash: studentHash },
  { email: 'carlos.student@university.edu', hash: studentHash },
  { email: 'test.student@university.edu', hash: studentHash },
];

for (const u of demoUsers) {
  const result = await usersCollection.updateOne(
    { email: u.email },
    { $set: { passwordHash: u.hash } }
  );
  console.log(`Updated ${u.email} — matched: ${result.matchedCount}, modified: ${result.modifiedCount}`);
}

await mongoose.disconnect();
console.log('All demo user passwords fixed successfully!');
process.exit(0);
