import { Router } from "express";
import { checks } from "../middleware/index";
import { VendorRules } from "../rules/vendors.rules";
import { UserRules } from "../rules/users.rules";
import { PurchaseOrderRules } from "../rules/purchaseOrders.rules";
import { DefaultRules } from "../rules/default.rules";
import PurchaseOrderController from "../controllers/purchaseOrders.controller";

class PurchaseOrderRoutes {
	router = Router();
	controller = new PurchaseOrderController();

	constructor() {
		this.intializeRoutes();
	}

	intializeRoutes() {

		this.router.get("/user/purchase/orders", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getPurchaseOrders as any);
		this.router.get("/user/search/purchase/orders", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forSearching], this.controller.searchPurchaseOrders as any);
		this.router.get("/user/filter/purchase/orders", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forFiltering], this.controller.filterPurchaseOrdersSpecifically as any);
		this.router.get("/user/purchase/orders/specifically", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getPurchaseOrdersSpecifically as any);
		this.router.get("/user/purchase/order", [checks.verifyToken as any, checks.isUser, checks.verifyModule, PurchaseOrderRules.forFindingPurchaseOrder], this.controller.getPurchaseOrder as any);

		this.router.get("/purchase/orders", this.controller.publicGetPurchaseOrders as any);
		this.router.get("/search/purchase/orders", [DefaultRules.forSearching as any], this.controller.publicSearchPurchaseOrders as any);
		this.router.get("/purchase/order", [PurchaseOrderRules.forFindingPurchaseOrder as any], this.controller.publicGetPurchaseOrder as any);
		
		this.router.post("/user/purchase/order/add", [checks.verifyToken as any, checks.isUser, checks.verifyModule, VendorRules.forFindingVendorAlt, PurchaseOrderRules.forAdding], this.controller.addPurchaseOrder as any);

		this.router.put("/user/purchase/order/edit/po_type", [checks.verifyToken as any, checks.isUser, checks.verifyModule, PurchaseOrderRules.forFindingPurchaseOrder, PurchaseOrderRules.forUpdatingPOType], this.controller.updatePurchaseOrderPOType as any);
		this.router.put("/user/purchase/order/edit/dates", [checks.verifyToken as any, checks.isUser, checks.verifyModule, PurchaseOrderRules.forFindingPurchaseOrder, PurchaseOrderRules.forUpdatingDates], this.controller.updatePurchaseOrderDates as any);
		this.router.put("/user/purchase/order/edit/total_amount", [checks.verifyToken as any, checks.isUser, checks.verifyModule, PurchaseOrderRules.forFindingPurchaseOrder, PurchaseOrderRules.forUpdatingTotalAmount], this.controller.updatePurchaseOrderTotalAmount as any);
		this.router.put("/user/purchase/order/edit/raw_material", [checks.verifyToken as any, checks.isUser, checks.verifyModule, PurchaseOrderRules.forFindingPurchaseOrder, PurchaseOrderRules.forUpdatingRawMaterial], this.controller.updatePurchaseOrderRawMaterial as any);
		this.router.put("/user/purchase/order/edit/notes", [checks.verifyToken as any, checks.isUser, checks.verifyModule, PurchaseOrderRules.forFindingPurchaseOrder, PurchaseOrderRules.forUpdatingNotes], this.controller.updatePurchaseOrderNotes as any);
		this.router.put("/user/purchase/order/edit/delivery_status", [checks.verifyToken as any, checks.isUser, checks.verifyModule, PurchaseOrderRules.forFindingPurchaseOrder, PurchaseOrderRules.forUpdatingDeliveryStatus], this.controller.updatePurchaseOrderDeliveryStatus as any);
		this.router.put("/user/approve/purchase/order", [checks.verifyToken as any, checks.isUser, checks.verifyModule, PurchaseOrderRules.forFindingPurchaseOrder], this.controller.approvePurchaseOrder as any);
		this.router.put("/user/complete/purchase/order", [checks.verifyToken as any, checks.isUser, checks.verifyModule, PurchaseOrderRules.forFindingPurchaseOrder], this.controller.completePurchaseOrder as any);

		this.router.delete("/user/purchase/order", [checks.verifyToken as any, checks.isUser, checks.verifyModule, PurchaseOrderRules.forFindingPurchaseOrder], this.controller.deletePurchaseOrder as any);
	}
}

export default new PurchaseOrderRoutes().router;