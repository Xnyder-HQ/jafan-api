import { Router } from "express";
import { checks } from "../middleware/index";
import { VendorRules } from "../rules/vendors.rules";
import { UserRules } from "../rules/users.rules";
import { FuelPurchaseRules } from "../rules/fuelPurchases.rules";
import { DefaultRules } from "../rules/default.rules";
import FuelPurchaseController from "../controllers/fuelPurchases.controller";

class FuelPurchaseRoutes {
	router = Router();
	controller = new FuelPurchaseController();

	constructor() {
		this.intializeRoutes();
	}

	intializeRoutes() {

		this.router.get("/user/fuel/purchases", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getFuelPurchases as any);
		this.router.get("/user/search/fuel/purchases", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forSearching], this.controller.searchFuelPurchases as any);
		this.router.get("/user/filter/fuel/purchases", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forFiltering], this.controller.filterFuelPurchasesSpecifically as any);
		this.router.get("/user/fuel/purchases/specifically", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getFuelPurchasesSpecifically as any);
		this.router.get("/user/fuel/purchase", [checks.verifyToken as any, checks.isUser, checks.verifyModule, FuelPurchaseRules.forFindingFuelPurchase], this.controller.getFuelPurchase as any);

		this.router.get("/fuel/purchases", this.controller.publicGetFuelPurchases as any);
		this.router.get("/search/fuel/purchases", [DefaultRules.forSearching as any], this.controller.publicSearchFuelPurchases as any);
		this.router.get("/fuel/purchase", [FuelPurchaseRules.forFindingFuelPurchase as any], this.controller.publicGetFuelPurchase as any);
		
		this.router.post("/user/fuel/purchase/add", [checks.verifyToken as any, checks.isUser, checks.verifyModule, VendorRules.forFindingVendorAlt, FuelPurchaseRules.forAdding], this.controller.addFuelPurchase as any);

		this.router.put("/user/fuel/purchase/edit/fuel_type", [checks.verifyToken as any, checks.isUser, checks.verifyModule, FuelPurchaseRules.forFindingFuelPurchase, FuelPurchaseRules.forUpdatingFuelType], this.controller.updateFuelPurchaseFuelType as any);
		this.router.put("/user/fuel/purchase/edit/purchase_date", [checks.verifyToken as any, checks.isUser, checks.verifyModule, FuelPurchaseRules.forFindingFuelPurchase, FuelPurchaseRules.forUpdatingPurchaseDate], this.controller.updateFuelPurchaseDate as any);
		this.router.put("/user/fuel/purchase/edit/liters", [checks.verifyToken as any, checks.isUser, checks.verifyModule, FuelPurchaseRules.forFindingFuelPurchase, FuelPurchaseRules.forUpdatingLiters], this.controller.updateFuelPurchaseLiters as any);
		this.router.put("/user/fuel/purchase/edit/raw_material", [checks.verifyToken as any, checks.isUser, checks.verifyModule, FuelPurchaseRules.forFindingFuelPurchase, FuelPurchaseRules.forUpdatingRawMaterial], this.controller.updateFuelPurchaseRawMaterial as any);
		this.router.put("/user/fuel/purchase/edit/notes", [checks.verifyToken as any, checks.isUser, checks.verifyModule, FuelPurchaseRules.forFindingFuelPurchase, FuelPurchaseRules.forUpdatingNotes], this.controller.updateFuelPurchaseNotes as any);
		this.router.put("/user/fuel/purchase/edit/delivery_status", [checks.verifyToken as any, checks.isUser, checks.verifyModule, FuelPurchaseRules.forFindingFuelPurchase, FuelPurchaseRules.forUpdatingDeliveryStatus], this.controller.updateFuelPurchaseDeliveryStatus as any);
		this.router.put("/user/fuel/purchase/edit/receipt_image", [checks.verifyToken as any, checks.isUser, checks.verifyModule, FuelPurchaseRules.forFindingFuelPurchase, FuelPurchaseRules.forReceiptImageUpload], this.controller.updateFuelPurchaseReceiptImage as any);
		this.router.put("/user/pay/fuel/purchase", [checks.verifyToken as any, checks.isUser, checks.verifyModule, FuelPurchaseRules.forFindingFuelPurchase, FuelPurchaseRules.forReceiptImageUpload], this.controller.payFuelPurchase as any);

		this.router.delete("/user/fuel/purchase", [checks.verifyToken as any, checks.isUser, checks.verifyModule, FuelPurchaseRules.forFindingFuelPurchase], this.controller.deleteFuelPurchase as any);
	}
}

export default new FuelPurchaseRoutes().router;