import { Router } from "express";
import { checks } from "../middleware/index";
import { CategoryRules } from "../rules/categories.rules";
import { ProductRules } from "../rules/products.rules";
import { DefaultRules } from "../rules/default.rules";
import ProductController from "../controllers/products.controller";

class ProductRoutes {
	router = Router();
	controller = new ProductController();

	constructor() {
		this.intializeRoutes();
	}

	intializeRoutes() {

		this.router.get("/user/products", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getProducts as any);
		this.router.get("/user/search/products", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forSearching], this.controller.searchProducts as any);
		this.router.get("/user/filter/products", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forFiltering], this.controller.filterProductsSpecifically as any);
		this.router.get("/user/products/specifically", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getProductsSpecifically as any);
		this.router.get("/user/product", [checks.verifyToken as any, checks.isUser, checks.verifyModule, ProductRules.forFindingProduct], this.controller.getProduct as any);

		this.router.get("/products", this.controller.publicGetProducts as any);
		this.router.get("/search/products", [DefaultRules.forSearching as any], this.controller.publicSearchProducts as any);
		this.router.get("/product", [ProductRules.forFindingProduct as any], this.controller.publicGetProduct as any);
		
		this.router.post("/user/product/add", [checks.verifyToken as any, checks.isUser, checks.verifyModule, CategoryRules.forFindingCategoryAltOptional, ProductRules.forAdding], this.controller.addProduct as any);

		this.router.put("/user/product/edit/category", [checks.verifyToken as any, checks.isUser, checks.verifyModule, ProductRules.forFindingProduct, CategoryRules.forFindingCategoryAltOptional], this.controller.updateProductCategory as any);
		this.router.put("/user/product/edit/details", [checks.verifyToken as any, checks.isUser, checks.verifyModule, ProductRules.forFindingProduct, ProductRules.forUpdatingName, ProductRules.forUpdatingType, ProductRules.forUpdatingUnitOfMeasure], this.controller.updateProductDetails as any);
		this.router.put("/user/product/edit/description", [checks.verifyToken as any, checks.isUser, checks.verifyModule, ProductRules.forFindingProduct, ProductRules.forUpdatingDescription], this.controller.updateProductDescription as any);
		this.router.put("/user/product/edit/price", [checks.verifyToken as any, checks.isUser, checks.verifyModule, ProductRules.forFindingProduct, ProductRules.forUpdatingPrice], this.controller.updateProductPrice as any);
		this.router.put("/user/product/edit/quantity", [checks.verifyToken as any, checks.isUser, checks.verifyModule, ProductRules.forFindingProduct, ProductRules.forUpdatingQuantity], this.controller.updateProductQuantity as any);
		this.router.put("/user/product/toggles", [checks.verifyToken as any, checks.isUser, checks.verifyModule, ProductRules.forFindingProduct, ProductRules.forUpdatingToggles], this.controller.updateProductToggles as any);

		this.router.delete("/user/product", [checks.verifyToken as any, checks.isUser, checks.verifyModule, ProductRules.forFindingProduct], this.controller.deleteProduct as any);
	}
}

export default new ProductRoutes().router;