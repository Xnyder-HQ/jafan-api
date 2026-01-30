import { Router } from "express";
import { checks } from "../middleware/index";
import { MachineRules } from "../rules/machines.rules";
import { VendorRules } from "../rules/vendors.rules";
import { MachineMaintenanceLogRules } from "../rules/machineMaintenanceLogs.rules";
import { DefaultRules } from "../rules/default.rules";
import MachineMaintenanceLogController from "../controllers/machineMaintenanceLogs.controller";

class MachineMaintenanceLogRoutes {
	router = Router();
	controller = new MachineMaintenanceLogController();

	constructor() {
		this.intializeRoutes();
	}

	intializeRoutes() {

		this.router.get("/user/machine/maintenance/logs", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getMachineMaintenanceLogs as any);
		this.router.get("/user/search/machine/maintenance/logs", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forSearching], this.controller.searchMachineMaintenanceLogs as any);
		this.router.get("/user/filter/machine/maintenance/logs", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forFiltering], this.controller.filterMachineMaintenanceLogsSpecifically as any);
		this.router.get("/user/machine/maintenance/logs/specifically", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getMachineMaintenanceLogsSpecifically as any);
		this.router.get("/user/machine/maintenance/log", [checks.verifyToken as any, checks.isUser, checks.verifyModule, MachineMaintenanceLogRules.forFindingMachineMaintenanceLog], this.controller.getMachineMaintenanceLog as any);

		this.router.get("/machine/maintenance/logs", this.controller.publicGetMachineMaintenanceLogs as any);
		this.router.get("/search/machine/maintenance/logs", [DefaultRules.forSearching as any], this.controller.publicSearchMachineMaintenanceLogs as any);
		this.router.get("/machine/maintenance/log", [MachineMaintenanceLogRules.forFindingMachineMaintenanceLog as any], this.controller.publicGetMachineMaintenanceLog as any);
		
		this.router.post("/user/machine/maintenance/log/add", [checks.verifyToken as any, checks.isUser, checks.verifyModule, MachineRules.forFindingMachineAlt, VendorRules.forFindingVendorAltOptional, MachineMaintenanceLogRules.forAddingAndUpdating], this.controller.addMachineMaintenanceLog as any);

		// this.router.delete("/user/machine/maintenance/log", [checks.verifyToken as any, checks.isUser, checks.verifyModule, MachineMaintenanceLogRules.forFindingMachineMaintenanceLog], this.controller.deleteMachineMaintenanceLog as any);
	}
}

export default new MachineMaintenanceLogRoutes().router;