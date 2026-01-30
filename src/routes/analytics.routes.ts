import { Router } from "express";
import { checks } from "../middleware/index";
import { UserRules } from "../rules/users.rules";
import { DefaultRules } from "../rules/default.rules";
import AnalyticsController from "../controllers/analytics.controller";

class Analytics {
	router = Router();
	controller = new AnalyticsController();

	constructor() {
		this.intializeRoutes();
	}

	intializeRoutes() {

		this.router.get("/user/general/stats", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getGeneralStats as any);
		
		this.router.get("/user/administration/stats", [checks.verifyToken as any, checks.isUser], this.controller.getAdministrationStats as any);
		this.router.get("/user/approval/stats", [checks.verifyToken as any, checks.isUser], this.controller.getApprovalStats as any);
		this.router.get("/user/log/stats", [checks.verifyToken as any, checks.isUser], this.controller.getLogStats as any);
		this.router.get("/user/acl/stats", [checks.verifyToken as any, checks.isUser], this.controller.getAclStats as any);
		this.router.get("/user/role/stats", [checks.verifyToken as any, checks.isUser], this.controller.getRoleStats as any);
		this.router.get("/user/sales_and_customer_management/stats", [checks.verifyToken as any, checks.isUser], this.controller.getSalesAndCustomerManagementStats as any);
		this.router.get("/user/procurement_and_vendor_management/stats", [checks.verifyToken as any, checks.isUser], this.controller.getProcurementAndVendorManagementStats as any);
		this.router.get("/user/inventory_and_stock_management/stats", [checks.verifyToken as any, checks.isUser], this.controller.getInventoryAndStockManagementStats as any);
		this.router.get("/user/production_and_quality_control/stats", [checks.verifyToken as any, checks.isUser], this.controller.getProductionAndQualityControlStats as any);
		this.router.get("/user/logistics_and_supply_chain/stats", [checks.verifyToken as any, checks.isUser], this.controller.getLogisticsAndSupplyChainStats as any);
		
	}
}

export default new Analytics().router;