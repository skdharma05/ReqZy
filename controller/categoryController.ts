import type { Request, Response } from "express";
import { CategoryModel } from "../models/category";

export async function getCategories(req: Request, res: Response) {
  try {
    const categories = await CategoryModel.find({});
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getCategoryById(req: Request, res: Response) {
  try {
    const category = await CategoryModel.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.json(category);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function createCategory(req: Request, res: Response) {
  try {
    const category = new CategoryModel(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateCategory(req: Request, res: Response) {
  try {
    const category = await CategoryModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.json(category);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteCategory(req: Request, res: Response) {
  try {
    const category = await CategoryModel.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
