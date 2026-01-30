import { Router } from "express";
import { checks } from "../middleware/index";
import { FinishedGoodRules } from "../rules/finishedGoods.rules";
import { FinishedGoodStockLogRules } from "../rules/finishedGoodStockLogs.rules";
import { DefaultRules } from "../rules/default.rules";
import FinishedGoodStockLogController from "../controllers/finishedGoodStockLogs.controller";

class FinishedGoodStockLogRoutes {
	router = Router();
	controller = new FinishedGoodStockLogController();

	constructor() {
		this.intializeRoutes();
	}

	intializeRoutes() {

		this.router.get("/user/finished/good/stock/logs", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getFinishedGoodStockLogs as any);
		this.router.get("/user/search/finished/good/stock/logs", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forSearching], this.controller.searchFinishedGoodStockLogs as any);
		this.router.get("/user/filter/finished/good/stock/logs", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forFiltering], this.controller.filterFinishedGoodStockLogsSpecifically as any);
		this.router.get("/user/finished/good/stock/logs/specifically", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getFinishedGoodStockLogsSpecifically as any);
		this.router.get("/user/finished/good/stock/log", [checks.verifyToken as any, checks.isUser, checks.verifyModule, FinishedGoodStockLogRules.forFindingFinishedGoodStockLog], this.controller.getFinishedGoodStockLog as any);

		this.router.get("/finished/good/stock/logs", this.controller.publicGetFinishedGoodStockLogs as any);
		this.router.get("/search/finished/good/stock/logs", [DefaultRules.forSearching as any], this.controller.publicSearchFinishedGoodStockLogs as any);
		this.router.get("/finished/good/stock/log", [FinishedGoodStockLogRules.forFindingFinishedGoodStockLog as any], this.controller.publicGetFinishedGoodStockLog as any);
		
		// this.router.delete("/user/finished/good/stock/log", [checks.verifyToken as any, checks.isUser, checks.verifyModule, FinishedGoodStockLogRules.forFindingFinishedGoodStockLog], this.controller.deleteFinishedGoodStockLog as any);
	}
}

export default new FinishedGoodStockLogRoutes().router;