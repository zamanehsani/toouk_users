import express from "express";
import dotenv from "dotenv";
import cors from "cors";
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
app.use("/user", user_routers);


const PORT: number = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

