import type { Request, Response } from "express";
import { ApprovalService } from "../services/approvalService";

/**
 * Create a new approval workflow
 */
export const createWorkflow = async (req: Request, res: Response) => {
  try {
    const { departmentId, name } = req.body;
    const workflow = await ApprovalService.createWorkflow(departmentId, name);
    res.status(201).json(workflow);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

/**
 * Add a rule to a workflow
 */
export const addRule = async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params;
    const { condition, action } = req.body;
    
    if (!workflowId) {
      return res.status(400).json({ error: "Workflow ID is required" });
    }
    
    const rule = await ApprovalService.addRule(workflowId, condition, action);
    res.status(201).json(rule);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

/**
 * Initialize approvals for a PR
 */
export const initApprovals = async (req: Request, res: Response) => {
  try {
    const { prId } = req.params;
    const { workflowId } = req.body;
    
    if (!prId) {
      return res.status(400).json({ error: "PR ID is required" });
    }
    
    const approvals = await ApprovalService.initApprovals(prId, workflowId);
    res.status(201).json(approvals);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

/**
 * Record an approval action
 */
export const recordApproval = async (req: Request, res: Response) => {
  try {
    const { prId } = req.params;
    const { status, comments } = req.body;
    const approverId = (req as any).user?.id;
    
    if (!approverId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    if (!prId) {
      return res.status(400).json({ error: "PR ID is required" });
    }

    const approval = await ApprovalService.recordApproval(
      prId,
      approverId,
      status,
      comments,
    );
    res.json(approval);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

/**
 * Get approvals for a PR
 */
export const getApprovals = async (req: Request, res: Response) => {
  try {
    const { prId } = req.params;
    
    if (!prId) {
      return res.status(400).json({ error: "PR ID is required" });
    }
    
    const approvals = await ApprovalService.getApprovals(prId);
    res.json(approvals);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

/**
 * Get all pending approvals for the current user
 */
export const getPendingApprovals = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const approvals = await ApprovalService.getPendingApprovals(userId);
    res.json(approvals);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

/**
 * Approve a specific PR
 */
export const approveRequest = async (req: Request, res: Response) => {
  try {
    const { prId } = req.params;
    const { comments } = req.body;
    const approverId = (req as any).user?.id;
    
    if (!approverId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    if (!prId) {
      return res.status(400).json({ error: "PR ID is required" });
    }

    const approval = await ApprovalService.recordApproval(
      prId,
      approverId,
      "approved",
      comments,
    );
    res.json(approval);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

/**
 * Reject a specific PR
 */
export const rejectRequest = async (req: Request, res: Response) => {
  try {
    const { prId } = req.params;
    const { comments } = req.body;
    const approverId = (req as any).user?.id;
    
    if (!approverId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    if (!prId) {
      return res.status(400).json({ error: "PR ID is required" });
    }

    const approval = await ApprovalService.recordApproval(
      prId,
      approverId,
      "rejected",
      comments,
    );
    res.json(approval);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

/**
 * Batch approve multiple PRs
 */
export const batchApprove = async (req: Request, res: Response) => {
  try {
    const { prIds, comments } = req.body;
    const approverId = (req as any).user?.id;
    
    if (!approverId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const results = await ApprovalService.batchApprove(prIds, approverId, comments);
    res.json(results);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

/**
 * Get approval history for the current user
 */
export const getApprovalHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const history = await ApprovalService.getApprovalHistory(userId);
    res.json(history);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};
