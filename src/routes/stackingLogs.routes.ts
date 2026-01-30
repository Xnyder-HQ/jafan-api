import { Router } from "express";
import { checks } from "../middleware/index";
// import { EmployeeRules } from "../rules/employees.rules"; // Uncomment when you implement employee module
import { FinishedGoodRules } from "../rules/finishedGoods.rules";
import { StackingLogRules } from "../rules/stackingLogs.rules";
import { DefaultRules } from "../rules/default.rules";
import StackingLogController from "../controllers/stackingLogs.controller";

class StackingLogRoutes {
	router = Router();
	controller = new StackingLogController();

	constructor() {
		this.intializeRoutes();
	}

	intializeRoutes() {

		this.router.get("/user/stacking/logs", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getStackingLogs as any);
		this.router.get("/user/search/stacking/logs", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forSearching], this.controller.searchStackingLogs as any);
		this.router.get("/user/filter/stacking/logs", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forFiltering], this.controller.filterStackingLogsSpecifically as any);
		this.router.get("/user/stacking/logs/specifically", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getStackingLogsSpecifically as any);
		this.router.get("/user/stacking/log", [checks.verifyToken as any, checks.isUser, checks.verifyModule, StackingLogRules.forFindingStackingLog], this.controller.getStackingLog as any);

		this.router.get("/stacking/logs", this.controller.publicGetStackingLogs as any);
		this.router.get("/search/stacking/logs", [DefaultRules.forSearching as any], this.controller.publicSearchStackingLogs as any);
		this.router.get("/stacking/log", [StackingLogRules.forFindingStackingLog as any], this.controller.publicGetStackingLog as any);
		
		this.router.post("/user/stacking/log/add", [checks.verifyToken as any, checks.isUser, checks.verifyModule, FinishedGoodRules.forFindingFinishedGoodAlt, StackingLogRules.forAddingAndUpdating], this.controller.addStackingLog as any);

		// this.router.delete("/user/stacking/log", [checks.verifyToken as any, checks.isUser, checks.verifyModule, StackingLogRules.forFindingStackingLog], this.controller.deleteStackingLog as any);
	}
}

export default new StackingLogRoutes().router;