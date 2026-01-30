import { Router } from "express";
import { checks } from "../middleware/index";
import { RoleRules } from "../rules/roles.rules";
import { DefaultRules } from "../rules/default.rules";
import RoleController from "../controllers/roles.controller";

class RoleRoutes {
	router = Router();
	controller = new RoleController();

	constructor() {
		this.intializeRoutes();
	}

	intializeRoutes() {

		this.router.get("/user/roles", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getRoles as any);
		this.router.get("/user/search/roles", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forSearching], this.controller.searchRoles as any);
		this.router.get("/user/filter/roles", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forFiltering], this.controller.filterRolesSpecifically as any);
		this.router.get("/user/role/via/stripped", [checks.verifyToken as any, checks.isUser, checks.verifyModule, RoleRules.forFindingViaStripped], this.controller.getRole as any);
		this.router.get("/user/role", [checks.verifyToken as any, checks.isUser, checks.verifyModule, RoleRules.forFindingRole], this.controller.getRole as any);

		this.router.get("/roles", this.controller.publicGetRoles as any);
		this.router.get("/search/roles", [DefaultRules.forSearching as any], this.controller.publicSearchRoles as any);
		this.router.get("/role/via/stripped", [RoleRules.forFindingViaStripped as any], this.controller.publicGetRole as any);
		this.router.get("/role", [RoleRules.forFindingRole as any], this.controller.publicGetRole as any);
		
		this.router.post("/user/role/add", [checks.verifyToken as any, checks.isUser, checks.verifyModule, RoleRules.forAdding], this.controller.addRole as any);

		this.router.put("/user/role/edit/details", [checks.verifyToken as any, checks.isUser, checks.verifyModule, RoleRules.forFindingRole, RoleRules.forUpdatingDetails, RoleRules.forUpdatingDescription], this.controller.updateRoleDetails as any);

		this.router.delete("/user/role", [checks.verifyToken as any, checks.isUser, checks.verifyModule, RoleRules.forFindingRole], this.controller.deleteRole as any);
	}
}

export default new RoleRoutes().router;