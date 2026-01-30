import { Router } from "express";
import { checks } from "../middleware/index";
import { UserRules } from "../rules/users.rules";
import { SalesOrderItemRules } from "../rules/salesOrderItems.rules";
import { SalesOrderRules } from "../rules/salesOrders.rules";
import { DefaultRules } from "../rules/default.rules";
import SalesOrderItemController from "../controllers/salesOrderItems.controller";

class SalesOrderItemRoutes {
	router = Router();
	controller = new SalesOrderItemController();

	constructor() {
		this.intializeRoutes();
	}

	intializeRoutes() {

		this.router.get("/user/sales/order/items", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getSalesOrderItems as any);
		this.router.get("/user/search/sales/order/items", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forSearching], this.controller.searchSalesOrderItems as any);
		this.router.get("/user/filter/sales/order/items", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forFiltering], this.controller.filterSalesOrderItemsSpecifically as any);
		this.router.get("/user/sales/order/items/specifically", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getSalesOrderItemsSpecifically as any);
		this.router.get("/user/sales/order/item", [checks.verifyToken as any, checks.isUser, checks.verifyModule, SalesOrderItemRules.forFindingSalesOrderItem], this.controller.getSalesOrderItem as any);

		this.router.get("/sales/order/items", this.controller.publicGetSalesOrderItems as any);
		this.router.get("/search/sales/order/items", [DefaultRules.forSearching as any], this.controller.publicSearchSalesOrderItems as any);
		this.router.get("/sales/order/item", [SalesOrderItemRules.forFindingSalesOrderItem as any], this.controller.publicGetSalesOrderItem as any);
		
		// this.router.put("/user/sales/order/item/edit/quantity_supplied", [checks.verifyToken as any, checks.isUser, checks.verifyModule, SalesOrderItemRules.forFindingSalesOrderItem, SalesOrderItemRules.forUpdatingQuantitySupplied], this.controller.updateSalesOrderItemQuantitySupplied as any);
		
		this.router.delete("/user/sales/order/item", [checks.verifyToken as any, checks.isUser, checks.verifyModule, SalesOrderItemRules.forFindingSalesOrderItem], this.controller.deleteSalesOrderItem as any);
	}
}

export default new SalesOrderItemRoutes().router;