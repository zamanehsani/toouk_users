import express from "express";
import { PrismaClient } from "@prisma/client";
import { s3Service } from "../utils/s3Service";
import crypto from "crypto";
import { publishEvent } from "../utils/rabbitmq.js";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}


/**
 * GET /users - List all users with optional filtering
 * Query params: email, role, firstName, lastName, isActive, page, limit
 */
export const listUsers = async (req: express.Request, res: express.Response) => {
  try {
    const {
      email,
      role,
      firstName,
      lastName,
      isActive,
      page = "1",
      limit = "10"
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    
    if (email) where.email = { contains: email as string, mode: 'insensitive' };
    if (role) where.role = role as string;
    if (firstName) where.firstName = { contains: firstName as string, mode: 'insensitive' };
    if (lastName) where.lastName = { contains: lastName as string, mode: 'insensitive' };
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [users, total] = await Promise.all([
      prisma.users.findMany({
        where,
        skip,
        take: limitNum,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          middleName: true,
          nickName: true,
          avatar: true,
          bio: true,
          location: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          // Exclude password from response
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.users.count({ where })
    ]);

    // publish event to RabbitMQ (if needed)
    await publishEvent('users.listed', { timestamp: Date.now(), filter: req.query, users:users });

    res.json({
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error("Error listing users:", error);
    res.status(500).json({ error: "Failed to list users" });
  }
};

/**
 * GET /users/:id - Get single user by ID
 */
export const getUserById = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        middleName: true,
        nickName: true,
        avatar: true,
        bio: true,
        location: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // publish event to RabbitMQ (if needed)
    await publishEvent('user.viewed', { timestamp: Date.now(), user });

    res.json({ user });
  } catch (error) {
    console.error("Error getting user:", error);
    res.status(500).json({ error: "Failed to get user" });
  }
};

/**
 * POST /users - Create new user
 */
export const createUser = async (req: express.Request, res: express.Response) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      middleName,
      nickName,
      bio,
      location,
      role = "USER"
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: "User with this email already exists" });
    }

    const hashedPassword = hashPassword(password);

    const user = await prisma.users.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        middleName,
        nickName,
        bio,
        location,
        role,
        isActive: true
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        middleName: true,
        nickName: true,
        avatar: true,
        bio: true,
        location: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // publish event to RabbitMQ (if needed)
    await publishEvent('user.created', { timestamp: Date.now(), ...user, hashedPassword });

    res.status(201).json({ user, message: "User created successfully" });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
};

/**
 * PUT /users/:id - Update user
 */
export const updateUser = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const {
      firstName,
      lastName,
      middleName,
      nickName,
      bio,
      location,
      role,
      isActive,
      password
    } = req.body;

    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (middleName !== undefined) updateData.middleName = middleName;
    if (nickName !== undefined) updateData.nickName = nickName;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password) updateData.password = hashPassword(password);

    const user = await prisma.users.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        middleName: true,
        nickName: true,
        avatar: true,
        bio: true,
        location: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    });


    // publish event to RabbitMQ (if needed)
    await publishEvent('user.updated', { timestamp: Date.now(), user });


    res.json({ user, message: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
};

/**
 * DELETE /users/:id - Delete user (soft delete by setting isActive to false)
 */
export const deleteUser = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10);
    const { hard = false } = req.query;

    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const existingUser = await prisma.users.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (hard === 'true') {
      // Hard delete - actually remove from database
      if (existingUser.avatar) {
        await s3Service.deleteAvatar(existingUser.avatar);
      }
      
      await prisma.users.delete({
        where: { id: userId }
      });
      
      res.json({ message: "User permanently deleted" });
    } else {
      // Soft delete - set isActive to false
      const user = await prisma.users.update({
        where: { id: userId },
        data: { isActive: false },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          updatedAt: true,
        }
      });
      


      // publish event to RabbitMQ (if needed)
      await publishEvent('user.deactivated', { timestamp: Date.now(), user });
      
      res.json({ user, message: "User deactivated successfully" });
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

/**
 * PUT /users/:id/avatar - Update user avatar
 */
export const updateAvatar = async (req: any, res: express.Response) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10);
    const file = req.file;

    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed" });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ error: "File too large. Maximum size is 5MB" });
    }

    const existingUser = await prisma.users.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Delete old avatar if exists
    if (existingUser.avatar) {
      await s3Service.deleteAvatar(existingUser.avatar);
    }

    // Upload new avatar
    const avatarUrl = await s3Service.uploadAvatar(file, userId.toString());

    // Update user record
    const user = await prisma.users.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        updatedAt: true,
      }
    });

    // publish event to RabbitMQ (if needed)
    await publishEvent('user.avatarUpdated', { timestamp: Date.now(), user });
    
    res.json({ user, message: "Avatar updated successfully" });
  } catch (error) {
    console.error("Error updating avatar:", error);
    res.status(500).json({ error: "Failed to update avatar" });
  }
};