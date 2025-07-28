import type { Request, Response } from "express";
import ApprovalService from "../services/approvalService";

/**
 * Create a new approval workflow for a department
 */
export async function createWorkflow(req: Request, res: Response) {
  try {
    const { departmentId, name } = req.body;
    const workflow = await ApprovalService.createWorkflow(departmentId, name);
    res.status(201).json(workflow);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

/**
 * Add a rule to an existing workflow
 */
export async function addRule(req: Request, res: Response) {
  try {
    const { workflowId } = req.params;
    const { condition, action } = req.body;
    const rule = await ApprovalService.addRule(workflowId, condition, action);
    res.status(201).json(rule);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

/**
 * Initialize approvals for a PR (when PR is created)
 */
export async function initApprovals(req: Request, res: Response) {
  try {
    const { prId, workflowId } = req.params;
    const approvals = await ApprovalService.initApprovals(prId, workflowId);
    res.status(201).json(approvals);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

/**
 * Record an approver's decision on a PR
 */
export async function recordApproval(req: Request, res: Response) {
  try {
    const { prId } = req.params;
    const approverId = (req as any).user.id;
    const { status, comments } = req.body;
    const updated = await ApprovalService.recordApproval(
      prId,
      approverId,
      status,
      comments,
    );
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

/**
 * Get all approval records for a PR
 */
export async function getApprovals(req: Request, res: Response) {
  try {
    const { prId } = req.params;
    const list = await ApprovalService.getApprovals(prId);
    res.json(list);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}
