import { Types } from "mongoose";
import {
  ApprovalWorkflowModel,
  type IApprovalWorkflow,
  WorkflowRuleModel,
  type IWorkflowRule,
  ApprovalModel,
  type IApproval,
} from "../models/approval";
import PRService from "./prService";
import { UserModel } from "../models";
import { RuleEngine } from "../utils/ruleEngine";

/**
 * Service layer for approval workflows and actions
 */
export class ApprovalService {
  /**
   * Create a new approval workflow for a department
   */
  static async createWorkflow(
    departmentId: string,
    name: string,
  ): Promise<IApprovalWorkflow> {
    const workflow = new ApprovalWorkflowModel({
      departmentId,
      name,
      rules: [],
    });
    await workflow.save();
    return workflow;
  }

  /**
   * Retrieve a workflow by its ID
   */
  static async getWorkflowById(workflowId: string): Promise<IApprovalWorkflow> {
    const workflow = await ApprovalWorkflowModel.findById(workflowId)
      .populate("rules")
      .exec();
    if (!workflow) throw new Error("Workflow not found");
    return workflow;
  }

  /**
   * Add a rule to an existing workflow
   */
  static async addRule(
    workflowId: string,
    condition: string,
    action: string,
  ): Promise<IWorkflowRule> {
    const rule = new WorkflowRuleModel({
      workflowId: new Types.ObjectId(workflowId),
      condition,
      action,
    });
    await rule.save();
    await ApprovalWorkflowModel.findByIdAndUpdate(workflowId, {
      $push: { rules: rule._id },
    });
    return rule;
  }
  /**
   * Initialize approval records for a PR based on a workflow
   */
  static async initApprovals(
    prId: string,
    workflowId: string,
  ): Promise<IApproval[]> {
    const workflow = await ApprovalWorkflowModel.findById(workflowId)
      .populate("rules")
      .exec();
    if (!workflow) throw new Error("Workflow not found");

    const pr = await PRService.getById(prId);
    const prData = pr.toObject();

    // Convert stored rules into a format RuleEngine can evaluate
    const parsedRules = (workflow.rules as IWorkflowRule[]).map((rule) => {
      const parsedCondition = JSON.parse(rule.condition);
      return {
        conditions: Array.isArray(parsedCondition)
          ? parsedCondition
          : [parsedCondition],
        logic: "AND", // You can extend your schema to store logic if needed
        approverRole: rule.action,
      };
    });

    const approverRoles = RuleEngine.determineNextApprovers(
      parsedRules,
      prData,
    );
    if (approverRoles.length === 0) {
      throw new Error("No approvers matched based on workflow rules.");
    }

    // Find users by approver roles
    const approvers = await UserModel.find({
      roleId: { $in: approverRoles },
      departmentId: pr.departmentId, // optional: restrict to same department
    }).exec();

    if (approvers.length === 0) {
      throw new Error("No users found for the approver roles.");
    }

    const approvals: IApproval[] = [];

    for (const user of approvers) {
      const approval = new ApprovalModel({
        prId: pr._id,
        approverId: user._id,
        status: "pending",
        approvedAt: null,
      });
      await approval.save();
      approvals.push(approval);
    }

    return approvals;
  }
  /**
   * Record an approval action and advance workflow
   */
  static async recordApproval(
    prId: string,
    approverId: string,
    status: "approved" | "rejected",
    comments?: string,
  ): Promise<IApproval> {
    // Create or update the specific approval record
    const approval = await ApprovalModel.findOneAndUpdate(
      { prId, approverId },
      { status, comments, approvedAt: new Date() },
      { new: true, upsert: true },
    ).exec();

    // If rejected, update PR status immediately
    if (status === "rejected") {
      await PRService.changeStatus(prId, "rejected", approverId, comments);
    }
    // If all rules approved, finalize PR
    const pending = await ApprovalModel.countDocuments({
      prId,
      status: "pending",
    }).exec();
    if (pending === 0) {
      await PRService.changeStatus(prId, "approved", approverId, comments);
    }

    return approval;
  }

  /**
   * Get all approvals for a given PR
   */
  static async getApprovals(prId: string): Promise<IApproval[]> {
    return ApprovalModel.find({ prId }).exec();
  }
}

export default ApprovalService;
