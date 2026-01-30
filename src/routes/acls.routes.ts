import { Router } from "express";
import { checks } from "../middleware/index";
import { AclRules } from "../rules/acls.rules";
import { UserRules } from "../rules/users.rules";
import { ModuleRules } from "../rules/modules.rules";
import { SubModuleRules } from "../rules/subModules.rules";
import { RoleRules } from "../rules/roles.rules";
import { DefaultRules } from "../rules/default.rules";
import AclController from "../controllers/acls.controller";

class AclRoutes {
	router = Router();
	controller = new AclController();

	constructor() {
		this.intializeRoutes();
	}

	intializeRoutes() {

		this.router.get("/user/acls", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getAcls as any);
		this.router.get("/user/filter/acls", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forFiltering], this.controller.filterAclsSpecifically as any);
		this.router.get("/user/acls/specifically", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getAclsSpecifically as any);
		this.router.get("/user/acl", [checks.verifyToken as any, checks.isUser, checks.verifyModule, AclRules.forFindingAcl], this.controller.getAcl as any);

		this.router.post("/user/acl/add", [checks.verifyToken as any, checks.isUser, checks.verifyModule, UserRules.forFindingUserAlt, ModuleRules.forFindingModuleAlt, SubModuleRules.forFindingSubModuleAltOptional, AclRules.forAddingAndUpdating, AclRules.forAclExpiringOptional], this.controller.addAcl as any);
		this.router.post("/user/acl/add/multiple", [checks.verifyToken as any, checks.isUser, checks.verifyModule, UserRules.forFindingUserAlt, ModuleRules.forFindingModuleAlt, SubModuleRules.forFindingSubModuleAltOptional, AclRules.forMultipleAdding], this.controller.addMultipleAcls as any);

		this.router.put("/user/acl/edit/details", [checks.verifyToken as any, checks.isUser, checks.verifyModule, AclRules.forFindingAcl, AclRules.forAddingAndUpdating, AclRules.forAclExpiringOptional], this.controller.updateAclDetails as any);

		this.router.delete("/user/acl", [checks.verifyToken as any, checks.isUser, checks.verifyModule, AclRules.forFindingAcl], this.controller.deleteAcl as any);
	}
}

export default new AclRoutes().router;