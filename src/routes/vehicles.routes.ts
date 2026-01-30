import { Router } from "express";
import { checks } from "../middleware/index";
import { VehicleRules } from "../rules/vehicles.rules";
import { DefaultRules } from "../rules/default.rules";
import VehicleController from "../controllers/vehicles.controller";

class VehicleRoutes {
	router = Router();
	controller = new VehicleController();

	constructor() {
		this.intializeRoutes();
	}

	intializeRoutes() {

		this.router.get("/user/vehicles", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getVehicles as any);
		this.router.get("/user/search/vehicles", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forSearching], this.controller.searchVehicles as any);
		this.router.get("/user/filter/vehicles", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forFiltering], this.controller.filterVehiclesSpecifically as any);
		this.router.get("/user/vehicles/specifically", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getVehiclesSpecifically as any);
		this.router.get("/user/vehicle", [checks.verifyToken as any, checks.isUser, checks.verifyModule, VehicleRules.forFindingVehicle], this.controller.getVehicle as any);

		this.router.get("/vehicles", this.controller.publicGetVehicles as any);
		this.router.get("/search/vehicles", [DefaultRules.forSearching as any], this.controller.publicSearchVehicles as any);
		this.router.get("/vehicle", [VehicleRules.forFindingVehicle as any], this.controller.publicGetVehicle as any);
		
		this.router.post("/user/vehicle/add", [checks.verifyToken as any, checks.isUser, checks.verifyModule, VehicleRules.forAdding], this.controller.addVehicle as any);

		this.router.put("/user/vehicle/edit/details", [checks.verifyToken as any, checks.isUser, checks.verifyModule, VehicleRules.forFindingVehicle, VehicleRules.forUpdatingDetails], this.controller.updateVehicleDetails as any);
		this.router.put("/user/vehicle/edit/other/details", [checks.verifyToken as any, checks.isUser, checks.verifyModule, VehicleRules.forFindingVehicle, VehicleRules.forUpdatingOtherDetails], this.controller.updateVehicleOtherDetails as any);
		this.router.put("/user/vehicle/edit/availability_status", [checks.verifyToken as any, checks.isUser, checks.verifyModule, VehicleRules.forFindingVehicle, VehicleRules.forUpdatingAvailabilityStatus], this.controller.updateVehicleAvailabilityStatus as any);
		this.router.put("/user/vehicle/edit/notes", [checks.verifyToken as any, checks.isUser, checks.verifyModule, VehicleRules.forFindingVehicle, VehicleRules.forUpdatingNotes], this.controller.updateVehicleNotes as any);
		this.router.put("/user/vehicle/toggles", [checks.verifyToken as any, checks.isUser, checks.verifyModule, VehicleRules.forFindingVehicle, VehicleRules.forUpdatingToggles], this.controller.updateVehicleToggles as any);

		this.router.delete("/user/vehicle", [checks.verifyToken as any, checks.isUser, checks.verifyModule, VehicleRules.forFindingVehicle], this.controller.deleteVehicle as any);
	}
}

export default new VehicleRoutes().router;