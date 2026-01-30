import { Router } from "express";
import { checks } from "../middleware/index";
import { VehicleRules } from "../rules/vehicles.rules";
import { LogisticsFuelLogRules } from "../rules/logisticsFuelLogs.rules";
import { DefaultRules } from "../rules/default.rules";
import LogisticsFuelLogController from "../controllers/logisticsFuelLogs.controller";

class LogisticsFuelLogRoutes {
	router = Router();
	controller = new LogisticsFuelLogController();

	constructor() {
		this.intializeRoutes();
	}

	intializeRoutes() {

		this.router.get("/user/logistics/fuel/logs", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getLogisticsFuelLogs as any);
		this.router.get("/user/search/logistics/fuel/logs", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forSearching], this.controller.searchLogisticsFuelLogs as any);
		this.router.get("/user/filter/logistics/fuel/logs", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forFiltering], this.controller.filterLogisticsFuelLogsSpecifically as any);
		this.router.get("/user/logistics/fuel/logs/specifically", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getLogisticsFuelLogsSpecifically as any);
		this.router.get("/user/logistics/fuel/log", [checks.verifyToken as any, checks.isUser, checks.verifyModule, LogisticsFuelLogRules.forFindingLogisticsFuelLog], this.controller.getLogisticsFuelLog as any);

		this.router.get("/logistics/fuel/logs", this.controller.publicGetLogisticsFuelLogs as any);
		this.router.get("/search/logistics/fuel/logs", [DefaultRules.forSearching as any], this.controller.publicSearchLogisticsFuelLogs as any);
		this.router.get("/logistics/fuel/log", [LogisticsFuelLogRules.forFindingLogisticsFuelLog as any], this.controller.publicGetLogisticsFuelLog as any);
		
		this.router.post("/user/logistics/fuel/log/add", [checks.verifyToken as any, checks.isUser, checks.verifyModule, VehicleRules.forFindingVehicleAlt, LogisticsFuelLogRules.forAddingAndUpdating], this.controller.addLogisticsFuelLog as any);

		// this.router.delete("/user/logistics/fuel/log", [checks.verifyToken as any, checks.isUser, checks.verifyModule, LogisticsFuelLogRules.forFindingLogisticsFuelLog], this.controller.deleteLogisticsFuelLog as any);
	}
}

export default new LogisticsFuelLogRoutes().router;