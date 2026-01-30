import { Router } from "express";
import { checks } from "../middleware/index";
import { RoleAclRules } from "../rules/roleAcls.rules";
import { RoleRules } from "../rules/roles.rules";
import { ModuleRules } from "../rules/modules.rules";
import { SubModuleRules } from "../rules/subModules.rules";
import { DefaultRules } from "../rules/default.rules";
import RoleAclController from "../controllers/roleAcls.controller";

class RoleAclRoutes {
	router = Router();
	controller = new RoleAclController();

	constructor() {
		this.intializeRoutes();
	}

	intializeRoutes() {

		this.router.get("/user/role/acls", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getRoleAcls as any);
		this.router.get("/user/filter/role/acls", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forFiltering], this.controller.filterRoleAclsSpecifically as any);
		this.router.get("/user/role/acls/specifically", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getRoleAclsSpecifically as any);
		this.router.get("/user/role/acl", [checks.verifyToken as any, checks.isUser, checks.verifyModule, RoleAclRules.forFindingRoleAcl], this.controller.getRoleAcl as any);

		this.router.post("/user/role/acl/add", [checks.verifyToken as any, checks.isUser, checks.verifyModule, RoleRules.forFindingRoleAlt, ModuleRules.forFindingModuleAlt, SubModuleRules.forFindingSubModuleAltOptional, RoleAclRules.forAddingAndUpdating], this.controller.addRoleAcl as any);
		this.router.post("/user/role/acl/add/multiple", [checks.verifyToken as any, checks.isUser, checks.verifyModule, RoleRules.forFindingRoleAlt, RoleAclRules.forMultipleAdding], this.controller.addMultipleRoleAcls as any);

		this.router.put("/user/role/acl/edit/details", [checks.verifyToken as any, checks.isUser, checks.verifyModule, RoleAclRules.forFindingRoleAcl, RoleAclRules.forAddingAndUpdating], this.controller.updateRoleAclDetails as any);

		this.router.delete("/user/role/acl", [checks.verifyToken as any, checks.isUser, checks.verifyModule, RoleAclRules.forFindingRoleAcl], this.controller.deleteRoleAcl as any);
	}
}

export default new RoleAclRoutes().router;