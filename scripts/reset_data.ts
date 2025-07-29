#!/usr/bin/env bun
/**
 * Database Reset Script
 * 
 * Quickly clears all presentation data from the database
 * Usage: bun run scripts/reset_data.ts
 */

import mongoose from "mongoose";
import { UserModel } from "../models/user";
import { DepartmentModel } from "../models/department";
import { CategoryModel } from "../models/category";
import { RoleModel } from "../models/role";
import { PurchaseRequisitionModel } from "../models/pr";
import { ApprovalModel } from "../models/approval";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/pr_system";

async function main() {
  console.log("🧹 Resetting database...");
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");
    
    await Promise.all([
      UserModel.deleteMany({}),
      DepartmentModel.deleteMany({}),
      CategoryModel.deleteMany({}),
      RoleModel.deleteMany({}),
      PurchaseRequisitionModel.deleteMany({}),
      ApprovalModel.deleteMany({})
    ]);
    
    console.log("✅ Database cleared successfully");
    
  } catch (error) {
    console.error("❌ Reset failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("📡 Disconnected from database");
  }
}

main().catch(console.error);
