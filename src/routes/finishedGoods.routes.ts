import { Router } from "express";
import { checks } from "../middleware/index";
import { ProductRules } from "../rules/products.rules";
import { FinishedGoodRules } from "../rules/finishedGoods.rules";
import { DefaultRules } from "../rules/default.rules";
import FinishedGoodController from "../controllers/finishedGoods.controller";

class FinishedGoodRoutes {
	router = Router();
	controller = new FinishedGoodController();

	constructor() {
		this.intializeRoutes();
	}

	intializeRoutes() {

		this.router.get("/user/finished/goods", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getFinishedGoods as any);
		this.router.get("/user/search/finished/goods", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forSearching], this.controller.searchFinishedGoods as any);
		this.router.get("/user/filter/finished/goods", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forFiltering], this.controller.filterFinishedGoodsSpecifically as any);
		this.router.get("/user/finished/goods/specifically", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getFinishedGoodsSpecifically as any);
		this.router.get("/user/finished/good", [checks.verifyToken as any, checks.isUser, checks.verifyModule, FinishedGoodRules.forFindingFinishedGood], this.controller.getFinishedGood as any);

		this.router.get("/finished/goods", this.controller.publicGetFinishedGoods as any);
		this.router.get("/search/finished/goods", [DefaultRules.forSearching as any], this.controller.publicSearchFinishedGoods as any);
		this.router.get("/finished/good", [FinishedGoodRules.forFindingFinishedGood as any], this.controller.publicGetFinishedGood as any);
		
		this.router.post("/user/finished/good/add", [checks.verifyToken as any, checks.isUser, checks.verifyModule, FinishedGoodRules.forAdding, ProductRules.forFindingProductAltOptional], this.controller.addFinishedGood as any);

		this.router.put("/user/finished/good/edit/details", [checks.verifyToken as any, checks.isUser, checks.verifyModule, FinishedGoodRules.forFindingFinishedGood, FinishedGoodRules.forUpdatingName, FinishedGoodRules.forUpdatingType, FinishedGoodRules.forUpdatingUnitOfMeasure], this.controller.updateFinishedGoodDetails as any);
		this.router.put("/user/finished/good/edit/product", [checks.verifyToken as any, checks.isUser, checks.verifyModule, FinishedGoodRules.forFindingFinishedGood, ProductRules.forFindingProductAltOptional], this.controller.updateFinishedGoodProduct as any);
		this.router.put("/user/finished/good/edit/description", [checks.verifyToken as any, checks.isUser, checks.verifyModule, FinishedGoodRules.forFindingFinishedGood, FinishedGoodRules.forUpdatingDescription], this.controller.updateFinishedGoodDescription as any);
		// this.router.put("/user/finished/good/edit/current_quantity", [checks.verifyToken as any, checks.isUser, checks.verifyModule, FinishedGoodRules.forFindingFinishedGood, FinishedGoodRules.forUpdatingCurrentQuantity], this.controller.updateFinishedGoodCurrentQuantity as any);
		this.router.put("/user/finished/good/edit/cost", [checks.verifyToken as any, checks.isUser, checks.verifyModule, FinishedGoodRules.forFindingFinishedGood, FinishedGoodRules.forUpdatingCost], this.controller.updateFinishedGoodCost as any);

		this.router.delete("/user/finished/good", [checks.verifyToken as any, checks.isUser, checks.verifyModule, FinishedGoodRules.forFindingFinishedGood], this.controller.deleteFinishedGood as any);
	}
}

export default new FinishedGoodRoutes().router;