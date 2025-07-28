import { Schema, model, Types } from "mongoose";

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  roleId: { type: String, ref: "Role", required: true },
  departmentId: { type: String, ref: "Department", required: true },
  isSuperUser: { type: Boolean, default: false }, // 👈 NEW FIELD
});

export const UserModel = model("User", UserSchema);
