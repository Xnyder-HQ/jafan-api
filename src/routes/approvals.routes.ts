import { Router } from "express";
import { checks } from "../middleware/index";
import { ApprovalRules } from "../rules/approvals.rules";
import { UserRules } from "../rules/users.rules";
import { ModuleRules } from "../rules/modules.rules";
import { SubModuleRules } from "../rules/subModules.rules";
import { RoleRules } from "../rules/roles.rules";
import { DefaultRules } from "../rules/default.rules";
import ApprovalController from "../controllers/approvals.controller";

class ApprovalRoutes {
	router = Router();
	controller = new ApprovalController();

	constructor() {
		this.intializeRoutes();
	}

	intializeRoutes() {

		this.router.get("/user/all/approvals", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getApprovals as any);
		this.router.get("/user/all/filter/approvals", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forFiltering], this.controller.filterApprovalsSpecifically as any);
		this.router.get("/user/all/approvals/specifically", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getApprovalsSpecifically as any);
		this.router.get("/user/all/approval", [checks.verifyToken as any, checks.isUser, checks.verifyModule, ApprovalRules.forFindingApproval], this.controller.getApproval as any);
		
		this.router.get("/user/approvals", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getUserApprovals as any);
		this.router.get("/user/filter/approvals", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forFiltering], this.controller.filterUserApprovalsSpecifically as any);
		this.router.get("/user/approvals/specifically", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getUserApprovalsSpecifically as any);
		this.router.get("/user/approval", [checks.verifyToken as any, checks.isUser, checks.verifyModule, ApprovalRules.forFindingApproval], this.controller.getUserApproval as any);

		this.router.post("/user/approval/add", [checks.verifyToken as any, checks.isUser, checks.verifyModule, ModuleRules.forFindingModuleAlt, SubModuleRules.forFindingSubModuleAltOptional, ApprovalRules.forAddingAndUpdating, ApprovalRules.forAclExpiringOptional], this.controller.addApproval as any);

		this.router.put("/user/approval/accept", [checks.verifyToken as any, checks.isUser, checks.verifyModule, ApprovalRules.forFindingApproval, ApprovalRules.forAclExpiringOptional], this.controller.acceptApproval as any);
		this.router.put("/user/approval/deny", [checks.verifyToken as any, checks.isUser, checks.verifyModule, ApprovalRules.forFindingApproval], this.controller.denyApproval as any);

		this.router.delete("/user/approval", [checks.verifyToken as any, checks.isUser, checks.verifyModule, ApprovalRules.forFindingApproval], this.controller.deleteApproval as any);
	}
}

export default new ApprovalRoutes().router;