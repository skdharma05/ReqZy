import bcrypt from "bcryptjs";
import { UserModel } from "../models/user";

export async function ensureSuperUserExists() {
  const existing = await UserModel.findOne({ isSuperUser: true });
  if (existing) {
    console.log("✅ Super user already exists.");
    return;
  }

  console.log("🚀 No super user found. Creating default admin-admin...");

  const hashedPassword = await bcrypt.hash("admin", 10); // you can change this

  const superUser = new UserModel({
    email: "admin",
    password: hashedPassword,
    roleId: "admin", // Assuming this exists in Role collection
    departmentId: "admin", // Assuming this exists in Department collection
    isSuperUser: true,
  });

  await superUser.save();
  console.log("✅ Default super user created: admin/admin");
}
