import { Router } from "express";
import { register, login } from "./userController";
import {
  createPR,
  getPRById,
  getPRByUser,
  getPRByDepartment,
  updatePR,
  changeStatus,
} from "./prController";
import {
  createWorkflow,
  addRule,
  initApprovals,
  recordApproval,
  getApprovals,
} from "./approvalController";
import { authenticate, authorize } from "../utils/middlewares";
import { validateCreatePR } from "../utils/validation";

import { createSuperUser, deleteSuperUser } from "./adminController";

const router = Router();

// Auth
router.post("/user/register", register);
router.post("/user/login", login);

// PR Routes
router.post(
  "/pr",
  authenticate,
  authorize("create_pr"),
  validateCreatePR,
  createPR,
);
router.get("/pr/:id", authenticate, authorize("view_pr"), getPRById);
router.get("/pr/user/:userId", authenticate, authorize("view_pr"), getPRByUser);
router.get(
  "/pr/department/:departmentId",
  authenticate,
  authorize("view_pr"),
  getPRByDepartment,
);
router.put("/pr/:id", authenticate, authorize("update_pr"), updatePR);
router.patch(
  "/pr/:id/status",
  authenticate,
  authorize("approve_pr"),
  changeStatus,
);

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

const adminRouter = Router();

adminRouter.post("/superUser", createSuperUser);
adminRouter.delete("/superUser/:email", deleteSuperUser);

router.use("/admin", authenticate, authorize("manage_users"), adminRouter);

export default router;
