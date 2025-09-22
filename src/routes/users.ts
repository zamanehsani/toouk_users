import express from "express";
import {login} from "../controllers/users";

export const user_routers = express.Router();


user_routers.post("/login", login);