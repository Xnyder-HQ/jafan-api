import { Router } from "express";
import { checks } from "../middleware/index";
import { MachineRules } from "../rules/machines.rules";
import { DefaultRules } from "../rules/default.rules";
import MachineController from "../controllers/machines.controller";

class MachineRoutes {
	router = Router();
	controller = new MachineController();

	constructor() {
		this.intializeRoutes();
	}

	intializeRoutes() {

		this.router.get("/user/machines", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getMachines as any);
		this.router.get("/user/search/machines", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forSearching], this.controller.searchMachines as any);
		this.router.get("/user/filter/machines", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forFiltering], this.controller.filterMachinesSpecifically as any);
		this.router.get("/user/machines/specifically", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getMachinesSpecifically as any);
		this.router.get("/user/machine", [checks.verifyToken as any, checks.isUser, checks.verifyModule, MachineRules.forFindingMachine], this.controller.getMachine as any);

		this.router.get("/machines", this.controller.publicGetMachines as any);
		this.router.get("/search/machines", [DefaultRules.forSearching as any], this.controller.publicSearchMachines as any);
		this.router.get("/machine", [MachineRules.forFindingMachine as any], this.controller.publicGetMachine as any);
		
		this.router.post("/user/machine/add", [checks.verifyToken as any, checks.isUser, checks.verifyModule, MachineRules.forAdding], this.controller.addMachine as any);

		this.router.put("/user/machine/edit/details", [checks.verifyToken as any, checks.isUser, checks.verifyModule, MachineRules.forFindingMachine, MachineRules.forUpdatingDetails], this.controller.updateMachineDetails as any);
		this.router.put("/user/machine/edit/description", [checks.verifyToken as any, checks.isUser, checks.verifyModule, MachineRules.forFindingMachine, MachineRules.forUpdatingDescription], this.controller.updateMachineDescription as any);
		this.router.put("/user/machine/edit/other/details", [checks.verifyToken as any, checks.isUser, checks.verifyModule, MachineRules.forFindingMachine, MachineRules.forUpdatingOtherDetails], this.controller.updateMachineOtherDetails as any);
		this.router.put("/user/machine/edit/supported_block_types", [checks.verifyToken as any, checks.isUser, checks.verifyModule, MachineRules.forFindingMachine, MachineRules.forUpdatingSupportedBlockTypes], this.controller.updateMachineSupportedBlockTypes as any);
		this.router.put("/user/machine/toggles", [checks.verifyToken as any, checks.isUser, checks.verifyModule, MachineRules.forFindingMachine, MachineRules.forUpdatingToggles], this.controller.updateMachineToggles as any);

		this.router.delete("/user/machine", [checks.verifyToken as any, checks.isUser, checks.verifyModule, MachineRules.forFindingMachine], this.controller.deleteMachine as any);
	}
}

export default new MachineRoutes().router;