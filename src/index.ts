import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import multer from "multer";
import { user_routers } from "./routes/route";

dotenv.config({ path: '.env.dev' });
const app = express();

// use cors
app.use(cors());

// configure body parser and url parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint for Docker
app.get("/health", (req: express.Request, res: express.Response) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "users-service"
  });
});

// Use user routes
app.use("/users", user_routers);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Error:", err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
    return res.status(400).json({ error: err.message });
  }
  
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT: number = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Available endpoints:`);
  console.log(`- GET    /users - List all users with filtering`);
  console.log(`- GET    /users/:id - Get single user`);
  console.log(`- POST   /users - Create new user`);
  console.log(`- PUT    /users/:id - Update user`);
  console.log(`- DELETE /users/:id - Delete user`);
  console.log(`- PUT    /users/:id/avatar - Update avatar`);
  console.log(`- GET    /users/login - Login endpoint`);
  console.log(`- GET    /health - Health check`);
});

