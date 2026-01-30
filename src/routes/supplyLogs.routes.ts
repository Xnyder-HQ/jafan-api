import { Router } from "express";
import { checks } from "../middleware/index";
import { DeliveryAssignmentRules } from "../rules/deliveryAssignments.rules";
import { SalesOrderItemRules } from "../rules/salesOrderItems.rules";
import { SupplyLogRules } from "../rules/supplyLogs.rules";
import { DefaultRules } from "../rules/default.rules";
import SupplyLogController from "../controllers/supplyLogs.controller";

class SupplyLogRoutes {
	router = Router();
	controller = new SupplyLogController();

	constructor() {
		this.intializeRoutes();
	}

	intializeRoutes() {

		this.router.get("/user/supply/logs", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getSupplyLogs as any);
		this.router.get("/user/search/supply/logs", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forSearching], this.controller.searchSupplyLogs as any);
		this.router.get("/user/filter/supply/logs", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forFiltering], this.controller.filterSupplyLogsSpecifically as any);
		this.router.get("/user/supply/logs/specifically", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getSupplyLogsSpecifically as any);
		this.router.get("/user/supply/log", [checks.verifyToken as any, checks.isUser, checks.verifyModule, SupplyLogRules.forFindingSupplyLog], this.controller.getSupplyLog as any);

		this.router.get("/supply/logs", this.controller.publicGetSupplyLogs as any);
		this.router.get("/search/supply/logs", [DefaultRules.forSearching as any], this.controller.publicSearchSupplyLogs as any);
		this.router.get("/supply/log", [SupplyLogRules.forFindingSupplyLog as any], this.controller.publicGetSupplyLog as any);
		
		// this.router.post("/user/supply/log/add", [checks.verifyToken as any, checks.isUser, checks.verifyModule, SalesOrderItemRules.forFindingSalesOrderItemAlt, DeliveryAssignmentRules.forFindingDeliveryAssignmentAlt, SupplyLogRules.forAddingAndUpdating], this.controller.addSupplyLog as any);
		this.router.post("/user/supply/log/add", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DeliveryAssignmentRules.forFindingDeliveryAssignmentAlt, SalesOrderItemRules.forFindingSalesOrderItemAlt, SupplyLogRules.forAddingAndUpdating], this.controller.addSupplyLog as any);

		// this.router.delete("/user/supply/log", [checks.verifyToken as any, checks.isUser, checks.verifyModule, SupplyLogRules.forFindingSupplyLog], this.controller.deleteSupplyLog as any);
	}
}

export default new SupplyLogRoutes().router;