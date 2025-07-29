import mongoose from 'mongoose';
import { DepartmentModel } from '../models/department.ts';
import { UserModel } from '../models/user.ts';

await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pr-system');

console.log('Setting up proper departments...');

// Create proper departments
const departments = [
  { name: 'Information Technology', description: 'IT Department' },
  { name: 'Human Resources', description: 'HR Department' },
  { name: 'Finance', description: 'Finance Department' },
  { name: 'Operations', description: 'Operations Department' }
];

const createdDepartments = [];

for (const dept of departments) {
  try {
    const existing = await DepartmentModel.findOne({ name: dept.name });
    if (!existing) {
      const newDept = await DepartmentModel.create(dept);
      console.log(`Created department: ${newDept.name} (${newDept._id})`);
      createdDepartments.push(newDept);
    } else {
      console.log(`Department already exists: ${existing.name} (${existing._id})`);
      createdDepartments.push(existing);
    }
  } catch (error) {
    console.error(`Error creating department ${dept.name}:`, error.message);
  }
}

// Update users with proper department IDs
console.log('\nUpdating users with proper department IDs...');

if (createdDepartments.length > 0) {
  const itDepartment = createdDepartments.find(d => d.name === 'Information Technology');
  
  if (itDepartment) {
    // Update jane.smith to use proper IT department
    const jane = await UserModel.findOne({ email: 'jane.smith@company.com' });
    if (jane && jane.departmentId === 'admin') {
      await UserModel.findByIdAndUpdate(jane._id, { departmentId: itDepartment._id });
      console.log(`Updated jane.smith@company.com to IT department`);
    }
  }
}

console.log('\nDepartment setup complete!');
process.exit();
