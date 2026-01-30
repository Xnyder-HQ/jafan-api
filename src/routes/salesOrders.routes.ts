import { Router } from "express";
import { checks } from "../middleware/index";
import { CustomerRules } from "../rules/customers.rules";
import { UserRules } from "../rules/users.rules";
import { SalesOrderRules } from "../rules/salesOrders.rules";
import { SalesOrderItemRules } from "../rules/salesOrderItems.rules";
import { DefaultRules } from "../rules/default.rules";
import SalesOrderController from "../controllers/salesOrders.controller";

class SalesOrderRoutes {
	router = Router();
	controller = new SalesOrderController();

	constructor() {
		this.intializeRoutes();
	}

	intializeRoutes() {

		this.router.get("/user/sales/orders", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getSalesOrders as any);
		this.router.get("/user/search/sales/orders", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forSearching], this.controller.searchSalesOrders as any);
		this.router.get("/user/filter/sales/orders", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forFiltering], this.controller.filterSalesOrdersSpecifically as any);
		this.router.get("/user/sales/orders/specifically", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getSalesOrdersSpecifically as any);
		this.router.get("/user/sales/order", [checks.verifyToken as any, checks.isUser, checks.verifyModule, SalesOrderRules.forFindingSalesOrder], this.controller.getSalesOrder as any);

		this.router.get("/sales/orders", this.controller.publicGetSalesOrders as any);
		this.router.get("/search/sales/orders", [DefaultRules.forSearching as any], this.controller.publicSearchSalesOrders as any);
		this.router.get("/sales/order", [SalesOrderRules.forFindingSalesOrder as any], this.controller.publicGetSalesOrder as any);
		
		this.router.post("/user/sales/order/add", [checks.verifyToken as any, checks.isUser, checks.verifyModule, CustomerRules.forFindingCustomerAlt, SalesOrderRules.forUpdatingOutsideTownDetails, SalesOrderRules.forUpdatingEstimatedTripLiters, SalesOrderRules.forUpdatingNotes, SalesOrderItemRules.forAddingMultiple], this.controller.addSalesOrder as any);

		this.router.put("/user/sales/order/edit/estimated_trip_liters", [checks.verifyToken as any, checks.isUser, checks.verifyModule, SalesOrderRules.forFindingSalesOrder, SalesOrderRules.forUpdatingEstimatedTripLiters], this.controller.updateSalesOrderEstimatedTripLiters as any);
		this.router.put("/user/sales/order/edit/outside_town_details", [checks.verifyToken as any, checks.isUser, checks.verifyModule, SalesOrderRules.forFindingSalesOrder, SalesOrderRules.forUpdatingOutsideTownDetails], this.controller.updateSalesOrderOutsideTownDetails as any);
		this.router.put("/user/sales/order/edit/notes", [checks.verifyToken as any, checks.isUser, checks.verifyModule, SalesOrderRules.forFindingSalesOrder, SalesOrderRules.forUpdatingNotes], this.controller.updateSalesOrderNotes as any);
		// this.router.put("/user/sales/order/edit/total_items_dropped", [checks.verifyToken as any, checks.isUser, checks.verifyModule, SalesOrderRules.forFindingSalesOrder, SalesOrderRules.forUpdatingTotalItemsDropped], this.controller.updateSalesOrderTotalItemsDropped as any);
		this.router.put("/user/approve/sales/order", [checks.verifyToken as any, checks.isUser, checks.verifyModule, SalesOrderRules.forFindingSalesOrder], this.controller.approveSalesOrder as any);
		this.router.put("/user/complete/sales/order", [checks.verifyToken as any, checks.isUser, checks.verifyModule, SalesOrderRules.forFindingSalesOrder], this.controller.completeSalesOrder as any);

		this.router.delete("/user/sales/order", [checks.verifyToken as any, checks.isUser, checks.verifyModule, SalesOrderRules.forFindingSalesOrder], this.controller.deleteSalesOrder as any);
	}
}

export default new SalesOrderRoutes().router;