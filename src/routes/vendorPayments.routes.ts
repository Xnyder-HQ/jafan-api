import { Router } from "express";
import { checks } from "../middleware/index";
import { VendorRules } from "../rules/vendors.rules";
import { UserRules } from "../rules/users.rules";
import { VendorPaymentRules } from "../rules/vendorPayments.rules";
import { PurchaseOrderRules } from "../rules/purchaseOrders.rules";
import { DefaultRules } from "../rules/default.rules";
import VendorPaymentController from "../controllers/vendorPayments.controller";

class VendorPaymentRoutes {
	router = Router();
	controller = new VendorPaymentController();

	constructor() {
		this.intializeRoutes();
	}

	intializeRoutes() {

		this.router.get("/user/vendor/payments", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getVendorPayments as any);
		this.router.get("/user/search/vendor/payments", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forSearching], this.controller.searchVendorPayments as any);
		this.router.get("/user/filter/vendor/payments", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forFiltering], this.controller.filterVendorPaymentsSpecifically as any);
		this.router.get("/user/vendor/payments/specifically", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getVendorPaymentsSpecifically as any);
		this.router.get("/user/vendor/payment", [checks.verifyToken as any, checks.isUser, checks.verifyModule, VendorPaymentRules.forFindingVendorPayment], this.controller.getVendorPayment as any);

		this.router.get("/vendor/payments", this.controller.publicGetVendorPayments as any);
		this.router.get("/search/vendor/payments", [DefaultRules.forSearching as any], this.controller.publicSearchVendorPayments as any);
		this.router.get("/vendor/payment", [VendorPaymentRules.forFindingVendorPayment as any], this.controller.publicGetVendorPayment as any);
		
		this.router.post("/user/vendor/payment/add", [checks.verifyToken as any, checks.isUser, checks.verifyModule, VendorRules.forFindingVendorAlt, PurchaseOrderRules.forFindingPurchaseOrderAltOptional, VendorPaymentRules.forAdding], this.controller.addVendorPayment as any);

		this.router.put("/user/vendor/payment/edit/receipt_reference", [checks.verifyToken as any, checks.isUser, checks.verifyModule, VendorPaymentRules.forFindingVendorPayment, VendorPaymentRules.forUpdatingReceiptReference], this.controller.updateVendorPaymentReceiptReference as any);
		this.router.put("/user/vendor/payment/edit/receipt_image", [checks.verifyToken as any, checks.isUser, checks.verifyModule, VendorPaymentRules.forFindingVendorPayment, VendorPaymentRules.forReceiptImageUpload], this.controller.updateVendorPaymentReceiptImage as any);
		this.router.put("/user/vendor/payment/edit/notes", [checks.verifyToken as any, checks.isUser, checks.verifyModule, VendorPaymentRules.forFindingVendorPayment, VendorPaymentRules.forUpdatingNotes], this.controller.updateVendorPaymentNotes as any);

		this.router.delete("/user/vendor/payment", [checks.verifyToken as any, checks.isUser, checks.verifyModule, VendorPaymentRules.forFindingVendorPayment], this.controller.deleteVendorPayment as any);
	}
}

export default new VendorPaymentRoutes().router;