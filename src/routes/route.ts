import express from "express";
import {login} from "../controllers/control";

const user_routers = express.Router();

user_routers.get("/login", login);

export { user_routers };