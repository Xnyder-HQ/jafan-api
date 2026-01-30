import { Router } from "express";
import { checks } from "../middleware/index";
import { BusinessRuleRules } from "../rules/businessRules.rules";
import { DefaultRules } from "../rules/default.rules";
import BusinessRuleController from "../controllers/businessRules.controller";

class BusinessRuleRoutes {
	router = Router();
	controller = new BusinessRuleController();

	constructor() {
		this.intializeRoutes();
	}

	intializeRoutes() {

		this.router.get("/user/business/rules", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getBusinessRules as any);
		this.router.get("/user/search/business/rules", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forSearching], this.controller.searchBusinessRules as any);
		this.router.get("/user/filter/business/rules", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forFiltering], this.controller.filterBusinessRulesSpecifically as any);
		this.router.get("/user/business/rules/specifically", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getBusinessRulesSpecifically as any);
		this.router.get("/user/business/rule", [checks.verifyToken as any, checks.isUser, checks.verifyModule, BusinessRuleRules.forFindingBusinessRule], this.controller.getBusinessRule as any);

		this.router.get("/business/rules", this.controller.publicGetBusinessRules as any);
		this.router.get("/search/business/rules", [DefaultRules.forSearching as any], this.controller.publicSearchBusinessRules as any);
		this.router.get("/business/rule", [BusinessRuleRules.forFindingBusinessRule as any], this.controller.publicGetBusinessRule as any);
		
		this.router.post("/user/business/rule/add", [checks.verifyToken as any, checks.isUser, checks.verifyModule, BusinessRuleRules.forAdding], this.controller.addBusinessRule as any);

		this.router.put("/user/business/rule/edit/details", [checks.verifyToken as any, checks.isUser, checks.verifyModule, BusinessRuleRules.forFindingBusinessRule, BusinessRuleRules.forUpdatingDetails], this.controller.updateBusinessRuleDetails as any)
		this.router.put("/user/business/rule/edit/notes", [checks.verifyToken as any, checks.isUser, checks.verifyModule, BusinessRuleRules.forFindingBusinessRule, BusinessRuleRules.forUpdatingNotes], this.controller.updateBusinessRuleNotes as any);
		this.router.put("/user/business/rule/toggles", [checks.verifyToken as any, checks.isUser, checks.verifyModule, BusinessRuleRules.forFindingBusinessRule, BusinessRuleRules.forUpdatingToggles], this.controller.updateBusinessRuleToggles as any);

		this.router.delete("/user/business/rule", [checks.verifyToken as any, checks.isUser, checks.verifyModule, BusinessRuleRules.forFindingBusinessRule], this.controller.deleteBusinessRule as any);
	}
}

export default new BusinessRuleRoutes().router;