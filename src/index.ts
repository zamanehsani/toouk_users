import express from "express";

const app = express();

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

const PORT: number | string = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

