#!/usr/bin/env bun
/**
 * Presentation Data Seeder
 * 
 * This script populates the database with realistic presentation data:
 * - 5-8 users across different roles
 * - 4 departments with realistic names
 * - 6 categories for purchase requests
 * - 25-30 purchase requests with varied statuses (approved, pending, rejected)
 * - Approval records for tracking
 * 
 * Usage: bun run scripts/seed_presentation_data.ts
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { UserModel } from "../models/user";
import { DepartmentModel } from "../models/department";
import { CategoryModel } from "../models/category";
import { RoleModel } from "../models/role";
import { PurchaseRequisitionModel } from "../models/pr";
import { ApprovalModel } from "../models/approval";

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/pr_system";

// Seed data definitions
const ROLES = [
  {
    id: "admin",
    name: "Administrator",
    permissions: ["manage_users", "manage_departments", "manage_categories", "create_pr", "approve_pr", "view_pr", "view_analytics", "export_reports"]
  },
  {
    id: "manager", 
    name: "Manager",
    permissions: ["create_pr", "approve_pr", "view_pr", "view_analytics", "manage_team"]
  },
  {
    id: "approver",
    name: "Approver", 
    permissions: ["approve_pr", "view_pr", "view_analytics"]
  },
  {
    id: "requester",
    name: "Requester",
    permissions: ["create_pr", "view_pr"]
  }
];

const DEPARTMENTS = [
  { name: "Information Technology" },
  { name: "Human Resources" },
  { name: "Finance & Accounting" },
  { name: "Operations & Logistics" },
  { name: "Marketing & Sales" }
];

const CATEGORIES = [
  { name: "Office Supplies", rules: { autoApproveLimit: 500 } },
  { name: "Technology & Equipment", rules: { managerApprovalRequired: true } },
  { name: "Furniture & Fixtures", rules: { autoApproveLimit: 1000 } },
  { name: "Professional Services", rules: { directorApprovalRequired: true } },
  { name: "Travel & Transportation", rules: { autoApproveLimit: 2000 } },
  { name: "Marketing Materials", rules: { managerApprovalRequired: true } }
];

// Realistic user data for presentation
const USERS = [
  {
    email: "admin@reqzy.com",
    password: "admin123",
    roleId: "admin",
    departmentId: "Information Technology",
    isSuperUser: true
  },
  {
    email: "sarah.johnson@reqzy.com", 
    password: "manager123",
    roleId: "manager",
    departmentId: "Human Resources",
    isSuperUser: false
  },
  {
    email: "mike.davis@reqzy.com",
    password: "manager123", 
    roleId: "manager",
    departmentId: "Finance & Accounting",
    isSuperUser: false
  },
  {
    email: "lisa.chen@reqzy.com",
    password: "approver123",
    roleId: "approver", 
    departmentId: "Operations & Logistics",
    isSuperUser: false
  },
  {
    email: "tom.wilson@reqzy.com",
    password: "approver123",
    roleId: "approver",
    departmentId: "Marketing & Sales", 
    isSuperUser: false
  },
  {
    email: "john.smith@reqzy.com",
    password: "user123",
    roleId: "requester",
    departmentId: "Information Technology",
    isSuperUser: false
  },
  {
    email: "emily.brown@reqzy.com", 
    password: "user123",
    roleId: "requester",
    departmentId: "Human Resources",
    isSuperUser: false
  },
  {
    email: "david.miller@reqzy.com",
    password: "user123", 
    roleId: "requester",
    departmentId: "Finance & Accounting",
    isSuperUser: false
  }
];

// Purchase request templates for realistic data
const PR_TEMPLATES = [
  // Office Supplies
  { item: "Ergonomic Office Chair", category: "Furniture & Fixtures", minPrice: 299, maxPrice: 599, quantity: [1, 2] },
  { item: "Standing Desk Converter", category: "Furniture & Fixtures", minPrice: 199, maxPrice: 399, quantity: [1, 1] },
  { item: "Wireless Keyboard & Mouse Set", category: "Technology & Equipment", minPrice: 89, maxPrice: 149, quantity: [1, 3] },
  { item: "Monitor (27\" 4K)", category: "Technology & Equipment", minPrice: 299, maxPrice: 499, quantity: [1, 2] },
  { item: "Printer Paper (Case)", category: "Office Supplies", minPrice: 45, maxPrice: 65, quantity: [1, 5] },
  { item: "Notebook Set", category: "Office Supplies", minPrice: 15, maxPrice: 35, quantity: [5, 20] },
  { item: "Conference Room Whiteboard", category: "Furniture & Fixtures", minPrice: 199, maxPrice: 399, quantity: [1, 1] },
  
  // Technology
  { item: "Laptop Computer (Business)", category: "Technology & Equipment", minPrice: 899, maxPrice: 1499, quantity: [1, 1] },
  { item: "Software License (Adobe Creative)", category: "Technology & Equipment", minPrice: 599, maxPrice: 899, quantity: [1, 5] },
  { item: "Network Switch (24-port)", category: "Technology & Equipment", minPrice: 299, maxPrice: 599, quantity: [1, 1] },
  { item: "Security Camera System", category: "Technology & Equipment", minPrice: 799, maxPrice: 1299, quantity: [1, 1] },
  { item: "Backup Storage (2TB)", category: "Technology & Equipment", minPrice: 199, maxPrice: 299, quantity: [1, 3] },
  
  // Professional Services
  { item: "Legal Consultation Services", category: "Professional Services", minPrice: 1500, maxPrice: 3500, quantity: [1, 1] },
  { item: "IT Security Audit", category: "Professional Services", minPrice: 2500, maxPrice: 5000, quantity: [1, 1] },
  { item: "Financial Advisory Services", category: "Professional Services", minPrice: 2000, maxPrice: 4000, quantity: [1, 1] },
  { item: "Marketing Campaign Design", category: "Professional Services", minPrice: 1200, maxPrice: 2500, quantity: [1, 1] },
  
  // Travel & Transportation
  { item: "Conference Travel Expenses", category: "Travel & Transportation", minPrice: 800, maxPrice: 1500, quantity: [1, 1] },
  { item: "Client Meeting Travel", category: "Travel & Transportation", minPrice: 400, maxPrice: 800, quantity: [1, 1] },
  { item: "Training Seminar Attendance", category: "Travel & Transportation", minPrice: 600, maxPrice: 1200, quantity: [1, 1] },
  
  // Marketing Materials
  { item: "Trade Show Banner Set", category: "Marketing Materials", minPrice: 299, maxPrice: 599, quantity: [1, 1] },
  { item: "Business Card Printing", category: "Marketing Materials", minPrice: 89, maxPrice: 149, quantity: [1000, 5000] },
  { item: "Company Brochures", category: "Marketing Materials", minPrice: 199, maxPrice: 399, quantity: [500, 2000] },
  { item: "Promotional USB Drives", category: "Marketing Materials", minPrice: 299, maxPrice: 599, quantity: [100, 500] }
];

async function connectDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
}

async function clearExistingData() {
  console.log("🧹 Clearing existing data...");
  await Promise.all([
    UserModel.deleteMany({}),
    DepartmentModel.deleteMany({}),
    CategoryModel.deleteMany({}),
    RoleModel.deleteMany({}),
    PurchaseRequisitionModel.deleteMany({}),
    ApprovalModel.deleteMany({})
  ]);
  console.log("✅ Existing data cleared");
}

async function seedRoles() {
  console.log("👑 Seeding roles...");
  const roles = await RoleModel.insertMany(ROLES);
  console.log(`✅ Created ${roles.length} roles`);
  return roles;
}

async function seedDepartments() {
  console.log("🏢 Seeding departments...");
  const departments = await DepartmentModel.insertMany(DEPARTMENTS);
  console.log(`✅ Created ${departments.length} departments`);
  return departments;
}

async function seedCategories() {
  console.log("📂 Seeding categories...");
  const categories = await CategoryModel.insertMany(CATEGORIES);
  console.log(`✅ Created ${categories.length} categories`);
  return categories;
}

async function seedUsers(departments: any[]) {
  console.log("👥 Seeding users...");
  const users = [];
  
  for (const userData of USERS) {
    const department = departments.find(d => d.name === userData.departmentId);
    if (!department) {
      console.warn(`⚠️  Department not found: ${userData.departmentId}`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = new UserModel({
      email: userData.email,
      password: hashedPassword,
      roleId: userData.roleId,
      departmentId: department._id.toString(),
      isSuperUser: userData.isSuperUser
    });
    
    users.push(await user.save());
  }
  
  console.log(`✅ Created ${users.length} users`);
  return users;
}

async function seedPurchaseRequests(users: any[], departments: any[], categories: any[]) {
  console.log("📝 Seeding purchase requests...");
  const prs = [];
  const statusDistribution = [
    ...Array(12).fill("approved"),   // 12 approved (40%)
    ...Array(10).fill("pending"),    // 10 pending (33%) 
    ...Array(8).fill("rejected")     // 8 rejected (27%)
  ];

  // Generate dates over the last 3 months for realistic timeline
  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));

  for (let i = 0; i < 30; i++) {
    const template = PR_TEMPLATES[Math.floor(Math.random() * PR_TEMPLATES.length)];
    const category = categories.find(c => c.name === template.category);
    const user = users[Math.floor(Math.random() * users.length)];
    const department = departments[Math.floor(Math.random() * departments.length)];
    const status = statusDistribution[i % statusDistribution.length];
    
    // Random quantity within template range
    const quantity = Math.floor(Math.random() * (template.quantity[1] - template.quantity[0] + 1)) + template.quantity[0];
    
    // Random price within template range
    const unitPrice = Math.floor(Math.random() * (template.maxPrice - template.minPrice + 1)) + template.minPrice;
    const totalValue = quantity * unitPrice;
    
    // Random date within last 3 months
    const createdAt = new Date(threeMonthsAgo.getTime() + Math.random() * (now.getTime() - threeMonthsAgo.getTime()));

    const pr = new PurchaseRequisitionModel({
      item: template.item,
      quantity: quantity,
      departmentId: department._id.toString(),
      createdBy: user._id,
      status: status,
      totalValue: totalValue,
      categoryId: category?._id.toString(),
      createdAt: createdAt,
      updatedAt: status === "pending" ? createdAt : new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000)
    });

    prs.push(await pr.save());
  }

  console.log(`✅ Created ${prs.length} purchase requests`);
  console.log(`   📊 Status breakdown:`);
  console.log(`      ✅ Approved: ${prs.filter(pr => pr.status === "approved").length}`);
  console.log(`      ⏳ Pending: ${prs.filter(pr => pr.status === "pending").length}`);
  console.log(`      ❌ Rejected: ${prs.filter(pr => pr.status === "rejected").length}`);
  
  return prs;
}

async function seedApprovals(prs: any[], users: any[]) {
  console.log("✅ Seeding approval records...");
  const approvals = [];
  
  // Create approval records for non-pending PRs
  const processedPrs = prs.filter(pr => pr.status !== "pending");
  const approvers = users.filter(u => u.roleId === "manager" || u.roleId === "approver" || u.roleId === "admin");
  
  for (const pr of processedPrs) {
    const approver = approvers[Math.floor(Math.random() * approvers.length)];
    const approvedAt = new Date(pr.updatedAt);
    
    const approval = new ApprovalModel({
      prId: pr._id.toString(),
      approverId: approver._id.toString(),
      status: pr.status,
      comments: pr.status === "approved" 
        ? `Approved - meets budget requirements and business needs.`
        : `Rejected - ${getRandomRejectionReason()}`,
      approvedAt: approvedAt
    });
    
    approvals.push(await approval.save());
  }
  
  console.log(`✅ Created ${approvals.length} approval records`);
  return approvals;
}

function getRandomRejectionReason(): string {
  const reasons = [
    "exceeds budget allocation for this quarter",
    "duplicate request already approved", 
    "insufficient business justification provided",
    "alternative solution available at lower cost",
    "budget freeze in effect for this category",
    "requires additional approval from director level"
  ];
  return reasons[Math.floor(Math.random() * reasons.length)];
}

async function generateSummaryReport(users: any[], departments: any[], categories: any[], prs: any[]) {
  console.log("\n📊 PRESENTATION DATA SUMMARY");
  console.log("=" .repeat(50));
  
  console.log(`\n👥 USERS (${users.length} total):`);
  const roleGroups = users.reduce((acc, user) => {
    acc[user.roleId] = (acc[user.roleId] || 0) + 1;
    return acc;
  }, {});
  Object.entries(roleGroups).forEach(([role, count]) => {
    console.log(`   ${role}: ${count}`);
  });
  
  console.log(`\n🏢 DEPARTMENTS (${departments.length} total):`);
  departments.forEach(dept => console.log(`   • ${dept.name}`));
  
  console.log(`\n📂 CATEGORIES (${categories.length} total):`);
  categories.forEach(cat => console.log(`   • ${cat.name}`));
  
  console.log(`\n📝 PURCHASE REQUESTS (${prs.length} total):`);
  const statusBreakdown = prs.reduce((acc, pr) => {
    acc[pr.status] = (acc[pr.status] || 0) + 1;
    return acc;
  }, {});
  Object.entries(statusBreakdown).forEach(([status, count]) => {
    const emoji = status === "approved" ? "✅" : status === "pending" ? "⏳" : "❌";
    console.log(`   ${emoji} ${status}: ${count}`);
  });
  
  const totalValue = prs.reduce((sum, pr) => sum + pr.totalValue, 0);
  console.log(`\n💰 TOTAL REQUEST VALUE: $${totalValue.toLocaleString()}`);
  
  const approvedValue = prs.filter(pr => pr.status === "approved")
    .reduce((sum, pr) => sum + pr.totalValue, 0);
  console.log(`💰 APPROVED VALUE: $${approvedValue.toLocaleString()}`);
  
  console.log(`\n🔑 LOGIN CREDENTIALS:`);
  console.log(`   Admin: admin@reqzy.com / admin123`);
  console.log(`   Manager: sarah.johnson@reqzy.com / manager123`);
  console.log(`   Approver: lisa.chen@reqzy.com / approver123`);
  console.log(`   User: john.smith@reqzy.com / user123`);
  
  console.log("\n🎯 Ready for presentation! 🚀");
}

async function main() {
  console.log("🌟 Starting Presentation Data Seeder...\n");
  
  try {
    await connectDatabase();
    await clearExistingData();
    
    const roles = await seedRoles();
    const departments = await seedDepartments();
    const categories = await seedCategories();
    const users = await seedUsers(departments);
    const prs = await seedPurchaseRequests(users, departments, categories);
    const approvals = await seedApprovals(prs, users);
    
    await generateSummaryReport(users, departments, categories, prs);
    
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n📡 Disconnected from database");
  }
}

// Run the seeder
main().catch(console.error);
