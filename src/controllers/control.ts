import express from "express";

export const login = (req: express.Request, res: express.Response) => {
  const { email, password } = req.body;
    console.log("Login attempt", { email, password });
  // Perform login logic here (e.g., validate credentials, generate token)
  res.json({ message: "Login successful", user: { email } });
}