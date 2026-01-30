import { Router } from "express";
import { checks } from "../middleware/index";
import { ModuleRules } from "../rules/modules.rules";
import { DefaultRules } from "../rules/default.rules";
import ModuleController from "../controllers/modules.controller";

class ModuleRoutes {
	router = Router();
	controller = new ModuleController();

	constructor() {
		this.intializeRoutes();
	}

	intializeRoutes() {

		this.router.get("/user/modules", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getModules as any);
		this.router.get("/user/search/modules", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forSearching], this.controller.searchModules as any);
		this.router.get("/user/filter/modules", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forFiltering], this.controller.filterModules as any);
		this.router.get("/user/module/via/stripped", [checks.verifyToken as any, checks.isUser, checks.verifyModule, ModuleRules.forFindingViaStripped], this.controller.getModule as any);
		this.router.get("/user/module", [checks.verifyToken as any, checks.isUser, checks.verifyModule, ModuleRules.forFindingModule], this.controller.getModule as any);

		this.router.get("/modules", this.controller.publicGetModules as any);
		this.router.get("/search/modules", [DefaultRules.forSearching as any], this.controller.publicSearchModules as any);
		this.router.get("/module/via/stripped", [ModuleRules.forFindingViaStripped as any], this.controller.publicGetModule as any);
		this.router.get("/module", [ModuleRules.forFindingModule as any], this.controller.publicGetModule as any);
		
		this.router.post("/user/module/add", [checks.verifyToken as any, checks.isUser, checks.verifyModule, ModuleRules.forAdding], this.controller.addModule as any);

		this.router.put("/user/module/edit/details", [checks.verifyToken as any, checks.isUser, checks.verifyModule, ModuleRules.forFindingModule, ModuleRules.forUpdatingDetails], this.controller.updateModuleDetails as any);

		this.router.delete("/user/module", [checks.verifyToken as any, checks.isUser, checks.verifyModule, ModuleRules.forFindingModule], this.controller.deleteModule as any);
	}
}

export default new ModuleRoutes().router;