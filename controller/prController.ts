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

export async function getAllPRs(req: Request, res: Response) {
  try {
    // Extract query parameters for filtering
    const filters = {
      status: req.query.status as string,
      departmentId: req.query.departmentId as string,
      categoryId: req.query.categoryId as string,
      createdBy: req.query.createdBy as string,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
    };

    // Remove undefined values
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== undefined)
    );

    const prs = await PRService.getAll(cleanFilters);
    res.json(prs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

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
