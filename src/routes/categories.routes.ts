import { Router } from "express";
import { checks } from "../middleware/index";
import { CategoryRules } from "../rules/categories.rules";
import { DefaultRules } from "../rules/default.rules";
import CategoryController from "../controllers/categories.controller";

class CategoryRoutes {
	router = Router();
	controller = new CategoryController();

	constructor() {
		this.intializeRoutes();
	}

	intializeRoutes() {

		this.router.get("/user/categories", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getCategories as any);
		this.router.get("/user/search/categories", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forSearching], this.controller.searchCategories as any);
		this.router.get("/user/filter/categories", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forFiltering], this.controller.filterCategoriesSpecifically as any);
		this.router.get("/user/category/via/stripped", [checks.verifyToken as any, checks.isUser, checks.verifyModule, CategoryRules.forFindingViaStripped], this.controller.getCategory as any);
		this.router.get("/user/category", [checks.verifyToken as any, checks.isUser, checks.verifyModule, CategoryRules.forFindingCategory], this.controller.getCategory as any);

		this.router.get("/categories", this.controller.publicGetCategories as any);
		this.router.get("/search/categories", [DefaultRules.forSearching as any], this.controller.publicSearchCategories as any);
		this.router.get("/category/via/stripped", [CategoryRules.forFindingViaStripped as any], this.controller.publicGetCategory as any);
		this.router.get("/category", [CategoryRules.forFindingCategory as any], this.controller.publicGetCategory as any);
		
		this.router.post("/user/category/add", [checks.verifyToken as any, checks.isUser, checks.verifyModule, CategoryRules.forAdding], this.controller.addCategory as any);

		this.router.put("/user/category/edit/details", [checks.verifyToken as any, checks.isUser, checks.verifyModule, CategoryRules.forFindingCategory, CategoryRules.forUpdatingDetails], this.controller.updateCategoryDetails as any);

		this.router.delete("/user/category", [checks.verifyToken as any, checks.isUser, checks.verifyModule, CategoryRules.forFindingCategory], this.controller.deleteCategory as any);
	}
}

export default new CategoryRoutes().router;