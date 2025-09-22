import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config({ path: '.env' });
const app = express();


import { user_routers } from "./routes/users";



// use cors
app.use(cors());

// configure body parser and url parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Root endpoint
app.get("/", (req: express.Request, res: express.Response) => {
  console.log("Request received", req.body);
  res.send("Hello, World!");
});


// Health check endpoint for Docker
app.get("/health", (req: express.Request, res: express.Response) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "users-service"
  });
});


// use users routes
app.use("/users", user_routers);


const PORT: number = parseInt(process.env.PORT || '3000', 10);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

