import { Schema, model } from "mongoose";

const PermissionSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: String,
});

export const PermissionModel = model("Permission", PermissionSchema);
