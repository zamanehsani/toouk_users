import express from "express";
import multer from "multer";
import {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateAvatar
} from "../controllers/control";

const user_routers = express.Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed'));
    }
  }
});

// Authentication endpoint (existing)

// User CRUD endpoints
user_routers.get("/", listUsers);              // GET /users - List all users with filtering
user_routers.get("/:id", getUserById);         // GET /users/:id - Get single user
user_routers.post("/", createUser);            // POST /users - Create new user
user_routers.put("/:id", updateUser);          // PUT /users/:id - Update user
user_routers.delete("/:id", deleteUser);       // DELETE /users/:id - Delete user

// Avatar upload endpoint
user_routers.put("/:id/avatar", upload.single('avatar'), updateAvatar); // PUT /users/:id/avatar - Update avatar

export { user_routers };