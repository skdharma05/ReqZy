import { RoleModel } from "../models/role";
import mongoose from "mongoose";

await mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost:27017/pr-system",
);

// Check if admin role already exists
const existingAdmin = await RoleModel.findOne({ id: "admin" });

if (!existingAdmin) {
  await RoleModel.create({
    id: "admin",
    name: "Administrator",
    permissions: [
      "create_pr", 
      "view_pr", 
      "update_pr", 
      "approve_pr", 
      "manage_users", 
      "manage_categories", 
      "manage_departments", 
      "manage_workflow"
    ],
  });
  console.log("Admin role created");
} else {
  console.log("Admin role already exists");
}

process.exit();
