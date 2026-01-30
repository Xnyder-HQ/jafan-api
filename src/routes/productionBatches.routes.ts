import { Router } from "express";
import { checks } from "../middleware/index";
import { MachineRules } from "../rules/machines.rules";
import { ProductionTeamRules } from "../rules/productionTeams.rules";
import { FinishedGoodRules } from "../rules/finishedGoods.rules";
import { ProductionBatchRules } from "../rules/productionBatches.rules";
import { DefaultRules } from "../rules/default.rules";
import ProductionBatchController from "../controllers/productionBatches.controller";

class ProductionBatchRoutes {
	router = Router();
	controller = new ProductionBatchController();

	constructor() {
		this.intializeRoutes();
	}

	intializeRoutes() {

		this.router.get("/user/production/batches", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getProductionBatches as any);
		this.router.get("/user/search/production/batches", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forSearching], this.controller.searchProductionBatches as any);
		this.router.get("/user/filter/production/batches", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forFiltering], this.controller.filterProductionBatchesSpecifically as any);
		this.router.get("/user/production/batches/specifically", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getProductionBatchesSpecifically as any);
		this.router.get("/user/production/batch", [checks.verifyToken as any, checks.isUser, checks.verifyModule, ProductionBatchRules.forFindingProductionBatch], this.controller.getProductionBatch as any);

		this.router.get("/production/batches", this.controller.publicGetProductionBatches as any);
		this.router.get("/search/production/batches", [DefaultRules.forSearching as any], this.controller.publicSearchProductionBatches as any);
		this.router.get("/production/batch", [ProductionBatchRules.forFindingProductionBatch as any], this.controller.publicGetProductionBatch as any);
		
		this.router.post("/user/production/batch/add", [checks.verifyToken as any, checks.isUser, checks.verifyModule, MachineRules.forFindingMachineAlt, ProductionTeamRules.forFindingProductionTeamAlt, FinishedGoodRules.forFindingFinishedGoodAlt, ProductionBatchRules.forAddingAndUpdating], this.controller.addProductionBatch as any);

		// this.router.delete("/user/production/batch", [checks.verifyToken as any, checks.isUser, checks.verifyModule, ProductionBatchRules.forFindingProductionBatch], this.controller.deleteProductionBatch as any);
	}
}

export default new ProductionBatchRoutes().router;