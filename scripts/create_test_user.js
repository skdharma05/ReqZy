import mongoose from 'mongoose';
import { RoleModel } from '../models/role.ts';

await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pr-system');

console.log('Checking roles...');
const roles = await RoleModel.find({});
console.log('Available roles:', JSON.stringify(roles, null, 2));

console.log('Creating test user...');
const { UserModel } = await import('../models/user.ts');
const { hashPassword } = await import('../utils/auth.ts');

try {
  const existing = await UserModel.findOne({ email: 'jane.smith@company.com' });
  if (existing) {
    console.log('User already exists!');
  } else {
    const hashed = await hashPassword('password123');
    const user = new UserModel({
      email: 'jane.smith@company.com',
      password: hashed,
      roleId: 'requester',
      departmentId: 'admin',
    });

    await user.save();
    console.log('User created successfully!');
  }
} catch (error) {
  console.error('Error creating user:', error.message);
}

process.exit();
