import { Router } from "express";
import { 
  register, 
  login, 
  getAllUsers, 
  getUserById, 
  createUser, 
  updateUser, 
  deleteUser, 
  resetUserPassword 
} from "./userController";
import {
  createPR,
  getAllPRs,
  getPRById,
  getPRsByUser,
  getPRsByDepartment,
  updatePR,
  changeStatus,
} from "./prController";
import {
  createWorkflow,
  addRule,
  initApprovals,
  recordApproval,
  getApprovals,
  getPendingApprovals,
  approveRequest,
  rejectRequest,
  batchApprove,
  getApprovalHistory,
} from "./approvalController";
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "./categoryController";
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "./departmentController";
import { authenticate, authorize } from "../utils/middlewares";
import { validateCreatePR } from "../utils/validation";

import { createSuperUser, deleteSuperUser } from "./adminController";

const router = Router();

// Auth Routes
router.post("/user/register", register);
router.post("/user/login", login);

// User Management Routes (Admin)
router.get("/users", authenticate, authorize("manage_users"), getAllUsers);
router.get("/users/:id", authenticate, authorize("manage_users"), getUserById);
router.post("/users", authenticate, authorize("manage_users"), createUser);
router.put("/users/:id", authenticate, authorize("manage_users"), updateUser);
router.delete("/users/:id", authenticate, authorize("manage_users"), deleteUser);
router.post("/users/:id/reset-password", authenticate, authorize("manage_users"), resetUserPassword);

// PR Routes
router.get("/pr", authenticate, authorize("view_pr"), getAllPRs);
router.post(
  "/pr",
  authenticate,
  authorize("create_pr"),
  validateCreatePR,
  createPR,
);
router.get("/pr/:id", authenticate, authorize("view_pr"), getPRById);
router.get("/pr/user/:userId", authenticate, authorize("view_pr"), getPRsByUser);
router.get(
  "/pr/department/:departmentId",
  authenticate,
  authorize("view_pr"),
  getPRsByDepartment,
);
router.put("/pr/:id", authenticate, authorize("update_pr"), updatePR);
router.patch(
  "/pr/:id/status",
  authenticate,
  authorize("approve_pr"),
  changeStatus,
);

// Category Routes
router.get("/categories", authenticate, getCategories);
router.get("/categories/:id", authenticate, getCategoryById);
router.post("/categories", authenticate, authorize("manage_categories"), createCategory);
router.put("/categories/:id", authenticate, authorize("manage_categories"), updateCategory);
router.delete("/categories/:id", authenticate, authorize("manage_categories"), deleteCategory);

// Department Routes
router.get("/departments", authenticate, getDepartments);
router.get("/departments/:id", authenticate, getDepartmentById);
router.post("/departments", authenticate, authorize("manage_departments"), createDepartment);
router.put("/departments/:id", authenticate, authorize("manage_departments"), updateDepartment);
router.delete("/departments/:id", authenticate, authorize("manage_departments"), deleteDepartment);

// Approval-Workflow Routes
router.post(
  "/workflow",
  authenticate,
  authorize("manage_workflow"),
  createWorkflow,
);
router.post(
  "/workflow/:workflowId/rule",
  authenticate,
  authorize("manage_workflow"),
  addRule,
);
router.post(
  "/pr/:prId/approvals/init",
  authenticate,
  authorize("approve_pr"),
  initApprovals,
);
router.post(
  "/pr/:prId/approvals",
  authenticate,
  authorize("approve_pr"),
  recordApproval,
);
router.get(
  "/pr/:prId/approvals",
  authenticate,
  authorize("view_pr"),
  getApprovals,
);

// Approval Routes (matching frontend expectations)
router.get("/approval/pending", authenticate, authorize("approve_pr"), getPendingApprovals);
router.get("/approval/history", authenticate, authorize("view_pr"), getApprovalHistory);
router.post("/approval/batch/approve", authenticate, authorize("approve_pr"), batchApprove);
router.get("/approval/:prId", authenticate, authorize("view_pr"), getApprovals);
router.post("/approval/:prId/approve", authenticate, authorize("approve_pr"), approveRequest);
router.post("/approval/:prId/reject", authenticate, authorize("approve_pr"), rejectRequest);

const adminRouter = Router();

adminRouter.post("/superUser", createSuperUser);
adminRouter.delete("/superUser/:email", deleteSuperUser);

router.use("/admin", authenticate, authorize("manage_users"), adminRouter);

export default router;
