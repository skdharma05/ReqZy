import type { Request, Response } from "express";
import { UserModel } from "../models/user";
import bcrypt from "bcryptjs";

// Create a new super user
export async function createSuperUser(req: Request, res: Response) {
  const { email, password, roleId, departmentId } = req.body;

  const existing = await UserModel.findOne({ email });
  if (existing) return res.status(409).json({ error: "User already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new UserModel({
    email,
    password: hashedPassword,
    roleId,
    departmentId,
    isSuperUser: true,
  });

  await user.save();
  return res.status(201).json({ message: "Super user created", user });
}

// Delete a super user
export async function deleteSuperUser(req: Request, res: Response) {
  const { email } = req.params;

  const deleted = await UserModel.findOneAndDelete({
    email,
    isSuperUser: true,
  });

  if (!deleted) return res.status(404).json({ error: "Super user not found" });

  return res.json({ message: "Super user deleted" });
}
