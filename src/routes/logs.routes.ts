import { Router } from "express";
import { checks } from "../middleware/index";
import { LogRules } from "../rules/logs.rules";
import { DefaultRules } from "../rules/default.rules";
import LogController from "../controllers/logs.controller";

class LogRoutes {
	router = Router();
	controller = new LogController();

	constructor() {
		this.intializeRoutes();
	}

	intializeRoutes() {

		this.router.get("/logs", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getLogs as any);
		this.router.get("/search/logs", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forSearching], this.controller.searchLogs as any);
		this.router.get("/filter/logs", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forFiltering], this.controller.filterLogsSpecifically as any);
		this.router.get("/log/specifically", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getLogsSpecifically as any);
		this.router.get("/log", [checks.verifyToken as any, checks.isUser, checks.verifyModule, LogRules.forFindingLog], this.controller.getLog as any);

		this.router.delete("/log", [checks.verifyToken as any, checks.isUser, checks.verifyModule, LogRules.forFindingLog], this.controller.deleteLog as any);
	}
}

export default new LogRoutes().router;