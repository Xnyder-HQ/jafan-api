import { Router } from "express";
import { checks } from "../middleware/index";
import { MachineRules } from "../rules/machines.rules";
import { ProductionFuelLogRules } from "../rules/productionFuelLogs.rules";
import { DefaultRules } from "../rules/default.rules";
import ProductionFuelLogController from "../controllers/productionFuelLogs.controller";

class ProductionFuelLogRoutes {
	router = Router();
	controller = new ProductionFuelLogController();

	constructor() {
		this.intializeRoutes();
	}

	intializeRoutes() {

		this.router.get("/user/production/fuel/logs", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getProductionFuelLogs as any);
		this.router.get("/user/search/production/fuel/logs", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forSearching], this.controller.searchProductionFuelLogs as any);
		this.router.get("/user/filter/production/fuel/logs", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forFiltering], this.controller.filterProductionFuelLogsSpecifically as any);
		this.router.get("/user/production/fuel/logs/specifically", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getProductionFuelLogsSpecifically as any);
		this.router.get("/user/production/fuel/log", [checks.verifyToken as any, checks.isUser, checks.verifyModule, ProductionFuelLogRules.forFindingProductionFuelLog], this.controller.getProductionFuelLog as any);

		this.router.get("/production/fuel/logs", this.controller.publicGetProductionFuelLogs as any);
		this.router.get("/search/production/fuel/logs", [DefaultRules.forSearching as any], this.controller.publicSearchProductionFuelLogs as any);
		this.router.get("/production/fuel/log", [ProductionFuelLogRules.forFindingProductionFuelLog as any], this.controller.publicGetProductionFuelLog as any);
		
		this.router.post("/user/production/fuel/log/add", [checks.verifyToken as any, checks.isUser, checks.verifyModule, MachineRules.forFindingMachineAltOptional, ProductionFuelLogRules.forAddingAndUpdating], this.controller.addProductionFuelLog as any);
		
		// this.router.delete("/user/production/fuel/log", [checks.verifyToken as any, checks.isUser, checks.verifyModule, ProductionFuelLogRules.forFindingProductionFuelLog], this.controller.deleteProductionFuelLog as any);
	}
}

export default new ProductionFuelLogRoutes().router;