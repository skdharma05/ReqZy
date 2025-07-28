import { Schema, model, Types, Document } from "mongoose";

/**
 * Represents a step in an approval workflow
 */
export interface IWorkflowRule extends Document {
  workflowId: Types.ObjectId;
  condition: string; // JSONPath or business rule expression
  action: string; // e.g. next approver role or user
}

const WorkflowRuleSchema = new Schema<IWorkflowRule>(
  {
    workflowId: {
      type: Types.ObjectId,
      ref: "ApprovalWorkflow",
      required: true,
    },
    condition: { type: String, required: true },
    action: { type: String, required: true },
  },
  { timestamps: true },
);

export const WorkflowRuleModel = model<IWorkflowRule>(
  "WorkflowRule",
  WorkflowRuleSchema,
);

/**
 * Defines a named approval workflow for a department
 */
export interface IApprovalWorkflow extends Document {
  departmentId: string;
  name: string;
  rules: Types.ObjectId[]; // references to WorkflowRule
}

const ApprovalWorkflowSchema = new Schema<IApprovalWorkflow>(
  {
    departmentId: { type: String, required: true },
    name: { type: String, required: true },
    rules: [{ type: Types.ObjectId, ref: "WorkflowRule" }],
  },
  { timestamps: true },
);

export const ApprovalWorkflowModel = model<IApprovalWorkflow>(
  "ApprovalWorkflow",
  ApprovalWorkflowSchema,
);

/**
 * Records an individual approval action on a PR
 */
export interface IApproval extends Document {
  prId: Types.ObjectId;
  approverId: Types.ObjectId;
  status: "approved" | "rejected";
  comments?: string;
  approvedAt: Date;
}

const ApprovalSchema = new Schema<IApproval>(
  {
    prId: { type: Types.ObjectId, ref: "PurchaseRequisition", required: true },
    approverId: { type: Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["approved", "rejected"], required: true },
    comments: { type: String },
    approvedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const ApprovalModel = model<IApproval>("Approval", ApprovalSchema);
