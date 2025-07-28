import { Schema, model } from "mongoose";

const RoleSchema = new Schema({
  id: { type: String, required: true, unique: true }, // e.g., "admin", "approver"
  name: { type: String, required: true },
  permissions: { type: [String], default: [] }, // e.g., ["create_pr", "approve_pr"]
});

export const RoleModel = model("Role", RoleSchema);
