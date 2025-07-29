import type { Request, Response } from "express";
import { DepartmentModel } from "../models/department";

export async function getDepartments(req: Request, res: Response) {
  try {
    const departments = await DepartmentModel.find({});
    res.json(departments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getDepartmentById(req: Request, res: Response) {
  try {
    const department = await DepartmentModel.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }
    res.json(department);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function createDepartment(req: Request, res: Response) {
  try {
    const department = new DepartmentModel(req.body);
    await department.save();
    res.status(201).json(department);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateDepartment(req: Request, res: Response) {
  try {
    const department = await DepartmentModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }
    res.json(department);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteDepartment(req: Request, res: Response) {
  try {
    const department = await DepartmentModel.findByIdAndDelete(req.params.id);
    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
