import { Router } from "express";
import { checks } from "../middleware/index";
import { VehicleRules } from "../rules/vehicles.rules";
import { UserRules } from "../rules/users.rules";
import { DeliveryAssignmentRules } from "../rules/deliveryAssignments.rules";
import { SalesOrderRules } from "../rules/salesOrders.rules";
import { DefaultRules } from "../rules/default.rules";
import DeliveryAssignmentController from "../controllers/deliveryAssignments.controller";

class DeliveryAssignmentRoutes {
	router = Router();
	controller = new DeliveryAssignmentController();

	constructor() {
		this.intializeRoutes();
	}

	intializeRoutes() {

		this.router.get("/user/delivery/assignments", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getDeliveryAssignments as any);
		this.router.get("/user/search/delivery/assignments", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forSearching], this.controller.searchDeliveryAssignments as any);
		this.router.get("/user/filter/delivery/assignments", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forFiltering], this.controller.filterDeliveryAssignmentsSpecifically as any);
		this.router.get("/user/delivery/assignments/specifically", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getDeliveryAssignmentsSpecifically as any);
		this.router.get("/user/delivery/assignment", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DeliveryAssignmentRules.forFindingDeliveryAssignment], this.controller.getDeliveryAssignment as any);

		this.router.get("/delivery/assignments", this.controller.publicGetDeliveryAssignments as any);
		this.router.get("/search/delivery/assignments", [DefaultRules.forSearching as any], this.controller.publicSearchDeliveryAssignments as any);
		this.router.get("/delivery/assignment", [DeliveryAssignmentRules.forFindingDeliveryAssignment as any], this.controller.publicGetDeliveryAssignment as any);
		
		this.router.put("/user/delivery/assignment/edit/scheduled_date", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DeliveryAssignmentRules.forFindingDeliveryAssignment, DeliveryAssignmentRules.forUpdatingScheduledDate], this.controller.updateDeliveryAssignmentScheduledDate as any);
		this.router.put("/user/delivery/assignment/edit/reassignment", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DeliveryAssignmentRules.forFindingDeliveryAssignment, VehicleRules.forFindingVehicleAlt], this.controller.reassignDeliveryAssignment as any);
		this.router.put("/user/delivery/assignment/edit/notes", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DeliveryAssignmentRules.forFindingDeliveryAssignment, DeliveryAssignmentRules.forUpdatingNotes], this.controller.updateDeliveryAssignmentNotes as any);
		this.router.put("/user/cancel/delivery/assignment", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DeliveryAssignmentRules.forFindingDeliveryAssignment], this.controller.cancelDeliveryAssignment as any);
		this.router.put("/user/start/delivery/assignment", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DeliveryAssignmentRules.forFindingDeliveryAssignment], this.controller.startDeliveryAssignment as any);
		this.router.put("/user/complete/delivery/assignment", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DeliveryAssignmentRules.forFindingDeliveryAssignment], this.controller.completeDeliveryAssignment as any);

		this.router.delete("/user/delivery/assignment", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DeliveryAssignmentRules.forFindingDeliveryAssignment], this.controller.deleteDeliveryAssignment as any);
	}
}

export default new DeliveryAssignmentRoutes().router;