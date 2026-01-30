import { Router } from "express";
import { checks } from "../middleware/index";
import { VendorRules } from "../rules/vendors.rules";
import { DefaultRules } from "../rules/default.rules";
import VendorController from "../controllers/vendors.controller";

class VendorRoutes {
	router = Router();
	controller = new VendorController();

	constructor() {
		this.intializeRoutes();
	}

	intializeRoutes() {

		this.router.get("/user/vendors", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getVendors as any);
		this.router.get("/user/search/vendors", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forSearching], this.controller.searchVendors as any);
		this.router.get("/user/filter/vendors", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forFiltering], this.controller.filterVendorsSpecifically as any);
		this.router.get("/user/vendors/specifically", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getVendorsSpecifically as any);
		this.router.get("/user/vendor", [checks.verifyToken as any, checks.isUser, checks.verifyModule, VendorRules.forFindingVendor], this.controller.getVendor as any);

		this.router.get("/vendors", this.controller.publicGetVendors as any);
		this.router.get("/search/vendors", [DefaultRules.forSearching as any], this.controller.publicSearchVendors as any);
		this.router.get("/vendor", [VendorRules.forFindingVendor as any], this.controller.publicGetVendor as any);
		
		this.router.post("/user/vendor/add", [checks.verifyToken as any, checks.isUser, checks.verifyModule, VendorRules.forAdding], this.controller.addVendor as any);

		this.router.put("/user/vendor/edit/details", [checks.verifyToken as any, checks.isUser, checks.verifyModule, VendorRules.forFindingVendor, VendorRules.forUpdatingDetails], this.controller.updateVendorDetails as any);
		this.router.put("/user/vendor/edit/address", [checks.verifyToken as any, checks.isUser, checks.verifyModule, VendorRules.forFindingVendor, VendorRules.forUpdatingAddress], this.controller.updateVendorAddress as any);
		this.router.put("/user/vendor/edit/profile/image", [checks.verifyToken as any, checks.isUser, checks.verifyModule, VendorRules.forFindingVendor, VendorRules.forProfileImageUpload], this.controller.updateVendorProfileImage as any);
		this.router.put("/user/vendor/edit/total_spend", [checks.verifyToken as any, checks.isUser, checks.verifyModule, VendorRules.forFindingVendor, VendorRules.forUpdatingTotalSpend], this.controller.updateVendorTotalSpend as any);

		this.router.delete("/user/vendor", [checks.verifyToken as any, checks.isUser, checks.verifyModule, VendorRules.forFindingVendor], this.controller.deleteVendor as any);
	 }
}

export default new VendorRoutes().router;