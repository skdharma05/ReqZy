import {
  PurchaseRequisitionModel,
  type IPurchaseRequisition,
} from "../models/pr";
import { Types } from "mongoose";

/**
 * Data required to create a PR
 */
export interface CreatePRData {
  item: string;
  quantity: number;
  departmentId: string;
  createdBy: string; // will be cast to ObjectId
  totalValue: number;
  approvalWorkflowId?: string;
  categoryId?: string;
}

export class PRService {
  /**
   * Fetch a single PR by its ID
   */
  static async getById(prId: string): Promise<IPurchaseRequisition> {
    const pr = await PurchaseRequisitionModel.findById(prId)
      .populate("createdBy", "email roleId departmentId")
      .exec();
    if (!pr) throw new Error("PR not found");
    return pr;
  }

  /**
   * List all PRs created by a specific user
   */
  static async getByUser(userId: string): Promise<IPurchaseRequisition[]> {
    return PurchaseRequisitionModel.find({ createdBy: userId }).exec();
  }

  /**
   * List all PRs belonging to a specific department
   */
  static async getByDepartment(
    departmentId: string,
  ): Promise<IPurchaseRequisition[]> {
    return PurchaseRequisitionModel.find({ departmentId }).exec();
  }

  /**
   * Update a PR if it is still pending
   */
  static async updatePR(
    prId: string,
    updates: Partial<Pick<CreatePRData, "item" | "quantity" | "totalValue">>,
  ): Promise<IPurchaseRequisition> {
    const pr = await PurchaseRequisitionModel.findById(prId).exec();
    if (!pr) throw new Error("PR not found");
    if (pr.status !== "pending")
      throw new Error("Only pending PRs can be updated");

    // Apply updates
    if (updates.item !== undefined) pr.item = updates.item;
    if (updates.quantity !== undefined) pr.quantity = updates.quantity;
    if (updates.totalValue !== undefined) pr.totalValue = updates.totalValue;

    await pr.save();
    return pr;
  }

  /**
   * Change the status of a PR to 'approved' or 'rejected'
   */
  static async changeStatus(
    prId: string,
    status: "approved" | "rejected",
    approverId: string,
    comments?: string,
  ): Promise<IPurchaseRequisition> {
    const pr = await PurchaseRequisitionModel.findById(prId).exec();
    if (!pr) throw new Error("PR not found");
    if (pr.status !== "pending")
      throw new Error("Only pending PRs can be approved or rejected");

    pr.status = status;
    // TODO: Optionally record comments and approverId with extended schema
    await pr.save();
    return pr;
  }

  /**
   * Create a new Purchase Requisition
   */
  static async create(prData: CreatePRData): Promise<IPurchaseRequisition> {
    const toCreate = {
      ...prData,
      createdBy: new Types.ObjectId(prData.createdBy),
    };
    const pr = new PurchaseRequisitionModel(toCreate);
    await pr.save();
    return pr;
  }
}

export default PRService;
