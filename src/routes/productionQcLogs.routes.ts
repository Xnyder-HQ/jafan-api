import { Router } from "express";
import { checks } from "../middleware/index";
import { MachineRules } from "../rules/machines.rules";
import { ProductionBatchRules } from "../rules/productionBatches.rules";
import { ProductionTeamRules } from "../rules/productionTeams.rules";
import { FinishedGoodRules } from "../rules/finishedGoods.rules";
import { ProductionQcLogRules } from "../rules/productionQcLogs.rules";
import { DefaultRules } from "../rules/default.rules";
import ProductionQcLogController from "../controllers/productionQcLogs.controller";

class ProductionQcLogRoutes {
	router = Router();
	controller = new ProductionQcLogController();

	constructor() {
		this.intializeRoutes();
	}

	intializeRoutes() {

		this.router.get("/user/production/qc/logs", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getProductionQcLogs as any);
		this.router.get("/user/search/production/qc/logs", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forSearching], this.controller.searchProductionQcLogs as any);
		this.router.get("/user/filter/production/qc/logs", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forFiltering], this.controller.filterProductionQcLogsSpecifically as any);
		this.router.get("/user/production/qc/logs/specifically", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getProductionQcLogsSpecifically as any);
		this.router.get("/user/production/qc/log", [checks.verifyToken as any, checks.isUser, checks.verifyModule, ProductionQcLogRules.forFindingProductionQcLog], this.controller.getProductionQcLog as any);

		this.router.get("/production/qc/logs", this.controller.publicGetProductionQcLogs as any);
		this.router.get("/search/production/qc/logs", [DefaultRules.forSearching as any], this.controller.publicSearchProductionQcLogs as any);
		this.router.get("/production/qc/log", [ProductionQcLogRules.forFindingProductionQcLog as any], this.controller.publicGetProductionQcLog as any);
		
		this.router.post("/user/production/qc/log/add", [checks.verifyToken as any, checks.isUser, checks.verifyModule, ProductionBatchRules.forFindingProductionBatchAlt, ProductionQcLogRules.forAddingAndUpdating], this.controller.addProductionQcLog as any);

		// this.router.delete("/user/production/qc/log", [checks.verifyToken as any, checks.isUser, checks.verifyModule, ProductionQcLogRules.forFindingProductionQcLog], this.controller.deleteProductionQcLog as any);
	}
}

export default new ProductionQcLogRoutes().router;