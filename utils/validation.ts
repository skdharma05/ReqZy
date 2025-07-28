import type { Request, Response, NextFunction } from "express";
import { checkDepartmentExists, checkCategoryExists } from "./refs";

/**
 * Middleware to validate PR creation payload
 */
export async function validateCreatePR(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { item, quantity, totalValue, departmentId, categoryId } = req.body;
    if (!item || typeof item !== "string")
      throw new Error("Invalid or missing item");
    if (!quantity || typeof quantity !== "number")
      throw new Error("Invalid or missing quantity");
    if (!totalValue || typeof totalValue !== "number")
      throw new Error("Invalid or missing totalValue");

    // Check department exists
    await checkDepartmentExists(departmentId);

    // Check category exists if provided
    if (categoryId) {
      await checkCategoryExists(categoryId);
    }

    next();
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}
