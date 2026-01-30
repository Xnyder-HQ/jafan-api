import { Router } from "express";
import { checks } from "../middleware/index";
import { UserRules } from "../rules/users.rules";
import { DefaultRules } from "../rules/default.rules";
import AuthController from "../controllers/auth.controller";

class AuthRoutes {
	router = Router();
	controller = new AuthController();

	constructor() {
		this.intializeRoutes();
	}

	intializeRoutes() {
		this.router.post("/auth/signup", [UserRules.forAdding as any], this.controller.userSignUp as any);
		this.router.post("/auth/signin/via/email", [UserRules.forEmailLogin as any], this.controller.userSignInViaEmail as any);
		this.router.post("/auth/signin", [DefaultRules.forLoginId as any, DefaultRules.forPassword], this.controller.userSignIn as any);

		this.router.post("/password/recover", [DefaultRules.forLoginId as any], this.controller.passwordRecovery as any);
	}
}

export default new AuthRoutes().router;