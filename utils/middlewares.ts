import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";
import { RoleModel } from "../models/role";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer "))
    return res.status(401).json({ error: "Unauthorized" });

  const token = auth.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    (req as any).user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// Usage: authorize("create_pr")
export const authorize =
  (...requiredPermissions: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !user.roleId) {
      return res.status(403).json({ error: "No role assigned to user" });
    }

    try {
      const role = await RoleModel.findOne({ id: user.roleId });
      if (!role) return res.status(403).json({ error: "Role not found" });

      const hasPermission = requiredPermissions.every((perm) =>
        role.permissions.includes(perm),
      );

      if (!hasPermission) {
        return res
          .status(403)
          .json({ error: "Forbidden: insufficient permissions" });
      }

      next();
    } catch (err) {
      return res.status(500).json({ error: "Authorization check failed" });
    }
  };
