import { RoleModel } from "../models/role";
import mongoose from "mongoose";

await mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost:27017/pr-system",
);

await RoleModel.create([
  {
    id: "requester",
    name: "Requester",
    permissions: ["create_pr", "view_pr"],
  },
  {
    id: "approver",
    name: "Approver",
    permissions: ["approve_pr", "view_pr"],
  },
]);

console.log("Roles seeded");
process.exit();
