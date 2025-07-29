import mongoose from 'mongoose';
import { UserModel } from '../models/user.ts';

await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pr-system');

console.log('Checking indexes...');
const indexes = await UserModel.collection.getIndexes();
console.log('Current indexes:', indexes);

console.log('Dropping username index if it exists...');
try {
  await UserModel.collection.dropIndex('username_1');
  console.log('Username index dropped successfully');
} catch (error) {
  console.log('Username index does not exist or could not be dropped:', error.message);
}

process.exit();
