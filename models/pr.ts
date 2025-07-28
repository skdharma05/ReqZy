import { Schema, model, Types, Document } from "mongoose";

/**
 * TypeScript interface for a PurchaseRequisition document
 */
export interface IPurchaseRequisition extends Document {
  item: string;
  quantity: number;
  departmentId: string;
  createdBy: Types.ObjectId;
  status: "pending" | "approved" | "rejected";
  totalValue: number;
  approvalWorkflowId?: string;
  categoryId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseRequisitionSchema = new Schema<IPurchaseRequisition>(
  {
    item: { type: String, required: true },
    quantity: { type: Number, required: true },
    departmentId: { type: String, required: true },
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    totalValue: { type: Number, required: true },
    approvalWorkflowId: { type: String },
    categoryId: { type: String },
  },
  { timestamps: true },
);

export const PurchaseRequisitionModel = model<IPurchaseRequisition>(
  "PurchaseRequisition",
  PurchaseRequisitionSchema,
);
