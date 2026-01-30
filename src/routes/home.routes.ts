import { Router } from "express";
import { checks } from "../middleware/index";
import { welcome } from "../controllers/home.controller";

class HomeRoutes {
	router = Router();

	constructor() {
		this.intializeRoutes();
	}

	intializeRoutes() {
		this.router.get("/", welcome);
		this.router.post("/auth/admin/signin", [checks.verifyKey as any, checks.keyExists as any]);
	}
}

export default new HomeRoutes().router;