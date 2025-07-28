import type { Request, Response } from "express";
import PRService from "../services/prService";

export async function createPR(req: Request, res: Response) {
  try {
    const pr = await PRService.create(req.body);
    res.status(201).json(pr);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getPRById(req: Request, res: Response) {
  try {
    const pr = await PRService.getById(req.params.id);
    res.json(pr);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getPRsByUser(req: Request, res: Response) {
  try {
    const prs = await PRService.getByUser(req.params.userId);
    res.json(prs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getPRsByDepartment(req: Request, res: Response) {
  try {
    const prs = await PRService.getByDepartment(req.params.departmentId);
    res.json(prs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getPRByUser(req: Request, res: Response) {
  try {
    const prs = await PRService.getByUser(req.params.userId);
    res.json(prs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getPRByDepartment(req: Request, res: Response) {
  try {
    const prs = await PRService.getByDepartment(req.params.departmentId);
    res.json(prs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updatePR(req: Request, res: Response) {
  try {
    const updated = await PRService.updatePR(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function changeStatus(req: Request, res: Response) {
  try {
    const { status, approverId, comments } = req.body;
    const updated = await PRService.changeStatus(
      req.params.id,
      status,
      approverId,
      comments,
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
