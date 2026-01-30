import { Router } from "express";
import { checks } from "../middleware/index";
import { MachineRules } from "../rules/machines.rules";
import { ProductionTeamRules } from "../rules/productionTeams.rules";
import { DefaultRules } from "../rules/default.rules";
import ProductionTeamController from "../controllers/productionTeams.controller";

class ProductionTeamRoutes {
	router = Router();
	controller = new ProductionTeamController();

	constructor() {
		this.intializeRoutes();
	}

	intializeRoutes() {

		this.router.get("/user/production/teams", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getProductionTeams as any);
		this.router.get("/user/search/production/teams", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forSearching], this.controller.searchProductionTeams as any);
		this.router.get("/user/filter/production/teams", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forFiltering], this.controller.filterProductionTeamsSpecifically as any);
		this.router.get("/user/production/teams/specifically", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getProductionTeamsSpecifically as any);
		this.router.get("/user/production/team", [checks.verifyToken as any, checks.isUser, checks.verifyModule, ProductionTeamRules.forFindingProductionTeam], this.controller.getProductionTeam as any);

		this.router.get("/production/teams", this.controller.publicGetProductionTeams as any);
		this.router.get("/search/production/teams", [DefaultRules.forSearching as any], this.controller.publicSearchProductionTeams as any);
		this.router.get("/production/team", [ProductionTeamRules.forFindingProductionTeam as any], this.controller.publicGetProductionTeam as any);
		
		this.router.post("/user/production/team/add", [checks.verifyToken as any, checks.isUser, checks.verifyModule, MachineRules.forFindingMachineAltOptional, ProductionTeamRules.forAddingAndUpdating], this.controller.addProductionTeam as any);

		this.router.put("/user/production/team/edit/category", [checks.verifyToken as any, checks.isUser, checks.verifyModule, ProductionTeamRules.forFindingProductionTeam, MachineRules.forFindingMachineAltOptional], this.controller.updateProductionTeamMachine as any);
		this.router.put("/user/production/team/edit/details", [checks.verifyToken as any, checks.isUser, checks.verifyModule, ProductionTeamRules.forFindingProductionTeam, ProductionTeamRules.forAddingAndUpdating], this.controller.updateProductionTeamDetails as any);
		
		this.router.delete("/user/production/team", [checks.verifyToken as any, checks.isUser, checks.verifyModule, ProductionTeamRules.forFindingProductionTeam], this.controller.deleteProductionTeam as any);
	}
}

export default new ProductionTeamRoutes().router;