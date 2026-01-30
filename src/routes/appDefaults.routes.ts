import { Router } from "express";
import { checks } from "../middleware/index";
import { AppDefaultRules } from "../rules/appDefaults.rules";
import { DefaultRules } from "../rules/default.rules";
import AppDefaultController from "../controllers/appDefaults.controller";

class AppDefaultRoutes {
	router = Router();
	controller = new AppDefaultController();

	constructor() {
		this.intializeRoutes();
	}

	intializeRoutes() {

		this.router.get("/root/app/defaults", [checks.verifyKey as any, checks.isRootKey], this.controller.getAppDefaults as any);
		this.router.get("/root/search/app/defaults", [checks.verifyKey as any, checks.isRootKey, DefaultRules.forSearching], this.controller.searchAppDefaults as any);
		this.router.get("/root/app/default", [checks.verifyKey as any, checks.isRootKey, AppDefaultRules.forFindingAppDefault], this.controller.getAppDefault as any);

		this.router.get("/search/app/defaults", [DefaultRules.forSearching as any], this.controller.publicSearchAppDefaults as any);
		this.router.get("/app/default", [AppDefaultRules.forFindingAppDefault as any], this.controller.publicGetAppDefault as any);

		this.router.post("/root/app/default/add", [checks.verifyKey as any, checks.isRootKey, AppDefaultRules.forAddingAndUpdating], this.controller.addAppDefault as any);

		this.router.put("/root/app/default/edit", [checks.verifyKey as any, checks.isRootKey, AppDefaultRules.forFindingAppDefault, AppDefaultRules.forAddingAndUpdating], this.controller.updateAppDefaultDetails as any);

		this.router.delete("/root/app/default", [checks.verifyKey as any, checks.isRootKey, AppDefaultRules.forFindingAppDefault], this.controller.deleteAppDefault as any);
	}
}

export default new AppDefaultRoutes().router;