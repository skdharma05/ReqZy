import type { Request, Response } from "express";
import { UserModel } from "../models/user";
import { RoleModel } from "../models/role";
import { hashPassword, comparePassword, generateToken } from "../utils/auth";

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, roleId, departmentId } = req.body;

    const existing = await UserModel.findOne({ email });
    if (existing) return res.status(400).json({ error: "User already exists" });

    const hashed = await hashPassword(password);

    const user = new UserModel({
      email,
      password: hashed,
      roleId,
      departmentId,
    });

    await user.save();
    res.json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: "Internal error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await comparePassword(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = generateToken({
      id: user._id,
      email: user.email,
      roleId: user.roleId,
      departmentId: user.departmentId,
    });

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: "Internal error" });
  }
};
