import { Router } from "express";
import { checks } from "../middleware/index";
import { SubModuleRules } from "../rules/subModules.rules";
import { ModuleRules } from "../rules/modules.rules";
import { DefaultRules } from "../rules/default.rules";
import SubModuleController from "../controllers/subModules.controller";

class SubModuleRoutes {
	router = Router();
	controller = new SubModuleController();

	constructor() {
		this.intializeRoutes();
	}

	intializeRoutes() {

		this.router.get("/user/sub/modules", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getSubModules as any);
		this.router.get("/user/search/sub/modules", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forSearching], this.controller.searchSubModules as any);
		this.router.get("/user/filter/sub/modules/specifically", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forFiltering], this.controller.filterSubModulesSpecifically as any);
		this.router.get("/user/sub/modules/specifically", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getSubModulesSpecifically as any);
		this.router.get("/user/sub/module/via/stripped", [checks.verifyToken as any, checks.isUser, checks.verifyModule, SubModuleRules.forFindingViaStripped], this.controller.getSubModule as any);
		this.router.get("/user/sub/module", [checks.verifyToken as any, checks.isUser, checks.verifyModule, SubModuleRules.forFindingSubModule], this.controller.getSubModule as any);

		this.router.get("/sub/modules", this.controller.publicGetSubModules as any);
		this.router.get("/search/sub/modules", [DefaultRules.forSearching as any], this.controller.publicSearchSubModules as any);
		this.router.get("/filter/sub/modules", [DefaultRules.forFiltering as any], this.controller.publicFilterSubModulesSpecifically as any);
		this.router.get("/sub/modules/specifically", this.controller.publicGetSubModulesSpecifically as any);
		this.router.get("/sub/module/via/stripped", [SubModuleRules.forFindingViaStripped as any], this.controller.publicGetSubModule as any);
		this.router.get("/sub/module", [SubModuleRules.forFindingSubModule as any], this.controller.publicGetSubModule as any);
		
		this.router.post("/user/sub/module/add", [checks.verifyToken as any, checks.isUser, checks.verifyModule, ModuleRules.forFindingModuleAltOptional, SubModuleRules.forAdding], this.controller.addSubModule as any);

		this.router.put("/user/sub/module/edit/details", [checks.verifyToken as any, checks.isUser, checks.verifyModule, SubModuleRules.forFindingSubModule, ModuleRules.forFindingModuleAltOptional, SubModuleRules.forUpdatingDetails], this.controller.updateSubModuleDetails as any);

		this.router.delete("/user/sub/module", [checks.verifyToken as any, checks.isUser, checks.verifyModule, SubModuleRules.forFindingSubModule], this.controller.deleteSubModule as any);
	}
}

export default new SubModuleRoutes().router;