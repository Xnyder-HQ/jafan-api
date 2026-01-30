import { Router } from "express";
import { checks } from "../middleware/index";
import { RawMaterialRules } from "../rules/rawMaterials.rules";
import { RawMaterialStockLogRules } from "../rules/rawMaterialStockLogs.rules";
import { DefaultRules } from "../rules/default.rules";
import RawMaterialStockLogController from "../controllers/rawMaterialStockLogs.controller";

class RawMaterialStockLogRoutes {
	router = Router();
	controller = new RawMaterialStockLogController();

	constructor() {
		this.intializeRoutes();
	}

	intializeRoutes() {

		this.router.get("/user/raw/material/stock/logs", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getRawMaterialStockLogs as any);
		this.router.get("/user/search/raw/material/stock/logs", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forSearching], this.controller.searchRawMaterialStockLogs as any);
		this.router.get("/user/filter/raw/material/stock/logs", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forFiltering], this.controller.filterRawMaterialStockLogsSpecifically as any);
		this.router.get("/user/raw/material/stock/logs/specifically", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getRawMaterialStockLogsSpecifically as any);
		this.router.get("/user/raw/material/stock/log", [checks.verifyToken as any, checks.isUser, checks.verifyModule, RawMaterialStockLogRules.forFindingRawMaterialStockLog], this.controller.getRawMaterialStockLog as any);

		this.router.get("/raw/material/stock/logs", this.controller.publicGetRawMaterialStockLogs as any);
		this.router.get("/search/raw/material/stock/logs", [DefaultRules.forSearching as any], this.controller.publicSearchRawMaterialStockLogs as any);
		this.router.get("/raw/material/stock/log", [RawMaterialStockLogRules.forFindingRawMaterialStockLog as any], this.controller.publicGetRawMaterialStockLog as any);
		
		// this.router.delete("/user/raw/material/stock/log", [checks.verifyToken as any, checks.isUser, checks.verifyModule, RawMaterialStockLogRules.forFindingRawMaterialStockLog], this.controller.deleteRawMaterialStockLog as any);
	}
}

export default new RawMaterialStockLogRoutes().router;