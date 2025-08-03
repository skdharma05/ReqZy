import type { Request, Response } from "express";
import PRService from "../services/prService";

export async function createPR(req: Request, res: Response) {
  try {
    const pr = await PRService.create(req.body);
    res.status(201).json(pr);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export const getAllPRs = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const prs = await PRService.getAuthorizedPRs(userId, req.query);
    res.json(prs);
  } catch (error) {
    console.error("Error fetching PRs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAuthorizedPRs = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const prs = await PRService.getAuthorizedPRs(userId, req.query);
    res.json(prs);
  } catch (error) {
    console.error("Error fetching authorized PRs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export async function getPRById(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: "PR ID is required" });
    }
    const pr = await PRService.getById(id);
    res.json(pr);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getPRsByUser(req: Request, res: Response) {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    const prs = await PRService.getByUser(userId);
    res.json(prs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getPRsByDepartment(req: Request, res: Response) {
  try {
    const departmentId = req.params.departmentId;
    if (!departmentId) {
      return res.status(400).json({ error: "Department ID is required" });
    }
    const prs = await PRService.getByDepartment(departmentId);
    res.json(prs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function updatePR(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: "PR ID is required" });
    }
    const updated = await PRService.updatePR(id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function changeStatus(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: "PR ID is required" });
    }
    const { status, approverId, comments } = req.body;
    const updated = await PRService.changeStatus(id, status, approverId, comments);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
