import { Router } from "express";
import { checks } from "../middleware/index";
import { InvoiceRules } from "../rules/invoices.rules";
import { UserRules } from "../rules/users.rules";
import { DiscountRules } from "../rules/discounts.rules";
import { SalesOrderRules } from "../rules/salesOrders.rules";
import { DefaultRules } from "../rules/default.rules";
import DiscountController from "../controllers/discounts.controller";

class DiscountRoutes {
	router = Router();
	controller = new DiscountController();

	constructor() {
		this.intializeRoutes();
	}

	intializeRoutes() {

		this.router.get("/user/discounts", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getDiscounts as any);
		this.router.get("/user/search/discounts", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forSearching], this.controller.searchDiscounts as any);
		this.router.get("/user/filter/discounts", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forFiltering], this.controller.filterDiscountsSpecifically as any);
		this.router.get("/user/discounts/specifically", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getDiscountsSpecifically as any);
		this.router.get("/user/discount", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DiscountRules.forFindingDiscount], this.controller.getDiscount as any);

		this.router.get("/discounts", this.controller.publicGetDiscounts as any);
		this.router.get("/search/discounts", [DefaultRules.forSearching as any], this.controller.publicSearchDiscounts as any);
		this.router.get("/discount", [DiscountRules.forFindingDiscount as any], this.controller.publicGetDiscount as any);
		
		this.router.post("/user/discount/add", [checks.verifyToken as any, checks.isUser, checks.verifyModule, SalesOrderRules.forFindingSalesOrderAlt, DiscountRules.forAddingAndUpdating], this.controller.addDiscount as any);

		this.router.put("/user/discount/edit/details", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DiscountRules.forFindingDiscount, DiscountRules.forAddingAndUpdating], this.controller.updateDiscount as any);
		this.router.put("/user/approve/discount", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DiscountRules.forFindingDiscount], this.controller.approveDiscount as any);

		this.router.delete("/user/discount", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DiscountRules.forFindingDiscount], this.controller.deleteDiscount as any);
	}
}

export default new DiscountRoutes().router;