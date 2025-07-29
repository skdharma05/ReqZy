import mongoose from 'mongoose';
import { UserModel } from '../models/user.ts';
import { RoleModel } from '../models/role.ts';
import { DepartmentModel } from '../models/department.ts';

await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pr-system');

console.log('Testing users query...');

try {
  const users = await UserModel.find({}).select('-password').limit(2);
  console.log('Raw users:', JSON.stringify(users, null, 2));

  console.log('Testing role lookup...');
  if (users.length > 0) {
    const role = await RoleModel.findOne({ id: users[0].roleId });
    console.log('Role found:', role);

    console.log('Testing department lookup...');
    const department = await DepartmentModel.findById(users[0].departmentId);
    console.log('Department found:', department);
  }

} catch (error) {
  console.error('Error:', error);
}

process.exit();
