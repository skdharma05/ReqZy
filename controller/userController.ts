import type { Request, Response } from "express";
import mongoose from "mongoose";
import { UserModel } from "../models/user";
import { RoleModel } from "../models/role";
import { DepartmentModel } from "../models/department";
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

// Get all users (admin only)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const roleId = req.query.roleId as string;
    const departmentId = req.query.departmentId as string;

    const filter: any = {};
    
    if (search) {
      filter.email = { $regex: search, $options: 'i' };
    }
    
    if (roleId) {
      filter.roleId = roleId;
    }
    
    if (departmentId) {
      filter.departmentId = departmentId;
    }

    const skip = (page - 1) * limit;

    // Get users without populate first, then manually add role and department info
    const users = await UserModel.find(filter)
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Manually fetch roles and departments
    const enrichedUsers = await Promise.all(users.map(async (user) => {
      const role = await RoleModel.findOne({ id: user.roleId });
      
      // Handle department lookup - some users might have string IDs that aren't ObjectIds
      let department = null;
      try {
        if (mongoose.Types.ObjectId.isValid(user.departmentId)) {
          department = await DepartmentModel.findById(user.departmentId);
        }
      } catch (error) {
        // If department lookup fails, set department to null
        console.warn(`Failed to lookup department for user ${user.email}:`, error.message);
      }
      
      return {
        ...user.toObject(),
        role: role ? { id: role.id, name: role.name, permissions: role.permissions } : null,
        department: department ? { id: department._id, name: department.name } : { id: user.departmentId, name: user.departmentId }
      };
    }));

    const total = await UserModel.countDocuments(filter);

    res.json({
      users: enrichedUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error in getAllUsers:', err);
    res.status(500).json({ error: "Internal error" });
  }
};

// Get user by ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await UserModel.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Manually fetch role and department
    const role = await RoleModel.findOne({ id: user.roleId });
    
    let department = null;
    try {
      if (mongoose.Types.ObjectId.isValid(user.departmentId)) {
        department = await DepartmentModel.findById(user.departmentId);
      }
    } catch (error) {
      console.warn(`Failed to lookup department for user ${user.email}:`, error.message);
    }

    const enrichedUser = {
      ...user.toObject(),
      role: role ? { id: role.id, name: role.name, permissions: role.permissions } : null,
      department: department ? { id: department._id, name: department.name } : { id: user.departmentId, name: user.departmentId }
    };

    res.json(enrichedUser);
  } catch (err) {
    console.error('Error in getUserById:', err);
    res.status(500).json({ error: "Internal error" });
  }
};

// Create new user (admin only)
export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, password, roleId, departmentId, isSuperUser } = req.body;

    // Validate required fields
    if (!email || !password || !roleId || !departmentId) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if user already exists
    const existing = await UserModel.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Validate role exists
    const role = await RoleModel.findOne({ id: roleId });
    if (!role) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // Validate department exists
    const department = await DepartmentModel.findById(departmentId);
    if (!department) {
      return res.status(400).json({ error: "Invalid department" });
    }

    const hashedPassword = await hashPassword(password);

    const user = new UserModel({
      email,
      password: hashedPassword,
      roleId,
      departmentId,
      isSuperUser: isSuperUser || false,
    });

    await user.save();

    // Return user without password and with enriched data
    const savedUser = await UserModel.findById(user._id).select('-password');
    const enrichedUser = {
      ...savedUser.toObject(),
      role: { id: role.id, name: role.name, permissions: role.permissions },
      department: { id: department._id, name: department.name }
    };

    res.status(201).json({ message: "User created successfully", user: enrichedUser });
  } catch (err) {
    res.status(500).json({ error: "Internal error" });
  }
};

// Update user (admin only)
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email, roleId, departmentId, isSuperUser } = req.body;

    // Check if user exists
    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // If email is being changed, check if new email already exists
    if (email && email !== user.email) {
      const existing = await UserModel.findOne({ email });
      if (existing) {
        return res.status(400).json({ error: "Email already exists" });
      }
    }

    // Validate role if provided
    if (roleId) {
      const role = await RoleModel.findOne({ id: roleId });
      if (!role) {
        return res.status(400).json({ error: "Invalid role" });
      }
    }

    // Validate department if provided
    if (departmentId) {
      const department = await DepartmentModel.findById(departmentId);
      if (!department) {
        return res.status(400).json({ error: "Invalid department" });
      }
    }

    const updateData: any = {};
    if (email) updateData.email = email;
    if (roleId) updateData.roleId = roleId;
    if (departmentId) updateData.departmentId = departmentId;
    if (typeof isSuperUser === 'boolean') updateData.isSuperUser = isSuperUser;

    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).select('-password');

    // Manually fetch role and department for the response
    const role = await RoleModel.findOne({ id: updatedUser.roleId });
    const department = await DepartmentModel.findById(updatedUser.departmentId);

    const enrichedUser = {
      ...updatedUser.toObject(),
      role: role ? { id: role.id, name: role.name, permissions: role.permissions } : null,
      department: department ? { id: department._id, name: department.name } : null
    };

    res.json({ message: "User updated successfully", user: enrichedUser });
  } catch (err) {
    res.status(500).json({ error: "Internal error" });
  }
};

// Delete user (admin only)
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await UserModel.findByIdAndDelete(id);

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Internal error" });
  }
};

// Reset user password (admin only)
export const resetUserPassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const hashedPassword = await hashPassword(newPassword);

    await UserModel.findByIdAndUpdate(id, { password: hashedPassword });

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    res.status(500).json({ error: "Internal error" });
  }
};
