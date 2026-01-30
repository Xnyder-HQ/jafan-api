import { Router } from "express";
import { checks } from "../middleware/index";
import { RawMaterialRules } from "../rules/rawMaterials.rules";
import { DefaultRules } from "../rules/default.rules";
import RawMaterialController from "../controllers/rawMaterials.controller";

class RawMaterialRoutes {
	router = Router();
	controller = new RawMaterialController();

	constructor() {
		this.intializeRoutes();
	}

	intializeRoutes() {

		this.router.get("/user/raw/materials", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getRawMaterials as any);
		this.router.get("/user/search/raw/materials", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forSearching], this.controller.searchRawMaterials as any);
		this.router.get("/user/filter/raw/materials", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forFiltering], this.controller.filterRawMaterialsSpecifically as any);
		this.router.get("/user/raw/materials/specifically", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getRawMaterialsSpecifically as any);
		this.router.get("/user/raw/material", [checks.verifyToken as any, checks.isUser, checks.verifyModule, RawMaterialRules.forFindingRawMaterial], this.controller.getRawMaterial as any);

		this.router.get("/raw/materials", this.controller.publicGetRawMaterials as any);
		this.router.get("/search/raw/materials", [DefaultRules.forSearching as any], this.controller.publicSearchRawMaterials as any);
		this.router.get("/raw/material", [RawMaterialRules.forFindingRawMaterial as any], this.controller.publicGetRawMaterial as any);
		
		this.router.post("/user/raw/material/add", [checks.verifyToken as any, checks.isUser, checks.verifyModule, RawMaterialRules.forAdding], this.controller.addRawMaterial as any);

		this.router.put("/user/raw/material/edit/details", [checks.verifyToken as any, checks.isUser, checks.verifyModule, RawMaterialRules.forFindingRawMaterial, RawMaterialRules.forUpdatingName, RawMaterialRules.forUpdatingType, RawMaterialRules.forUpdatingUnitOfMeasure], this.controller.updateRawMaterialDetails as any);
		this.router.put("/user/raw/material/edit/description", [checks.verifyToken as any, checks.isUser, checks.verifyModule, RawMaterialRules.forFindingRawMaterial, RawMaterialRules.forUpdatingDescription], this.controller.updateRawMaterialDescription as any);
		// this.router.put("/user/raw/material/edit/current_quantity", [checks.verifyToken as any, checks.isUser, checks.verifyModule, RawMaterialRules.forFindingRawMaterial, RawMaterialRules.forUpdatingCurrentQuantity], this.controller.updateRawMaterialCurrentQuantity as any);
		this.router.put("/user/raw/material/edit/reorder_level", [checks.verifyToken as any, checks.isUser, checks.verifyModule, RawMaterialRules.forFindingRawMaterial, RawMaterialRules.forUpdatingReorderLevel], this.controller.updateRawMaterialReorderLevel as any);

		this.router.delete("/user/raw/material", [checks.verifyToken as any, checks.isUser, checks.verifyModule, RawMaterialRules.forFindingRawMaterial], this.controller.deleteRawMaterial as any);
	}
}

export default new RawMaterialRoutes().router;