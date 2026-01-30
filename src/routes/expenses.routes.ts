import { Router } from "express";
import { checks } from "../middleware/index";
import { UserRules } from "../rules/users.rules";
import { FuelPurchaseRules } from "../rules/fuelPurchases.rules";
import { PurchaseOrderRules } from "../rules/purchaseOrders.rules";
import { ExpenseRules } from "../rules/expenses.rules";
import { DefaultRules } from "../rules/default.rules";
import ExpenseController from "../controllers/expenses.controller";

class ExpenseRoutes {
	router = Router();
	controller = new ExpenseController();

	constructor() {
		this.intializeRoutes();
	}

	intializeRoutes() {

		this.router.get("/user/expenses", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getExpenses as any);
		this.router.get("/user/search/expenses", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forSearching], this.controller.searchExpenses as any);
		this.router.get("/user/filter/expenses", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forFiltering], this.controller.filterExpensesSpecifically as any);
		this.router.get("/user/expenses/specifically", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getExpensesSpecifically as any);
		this.router.get("/user/expense", [checks.verifyToken as any, checks.isUser, checks.verifyModule, ExpenseRules.forFindingExpense], this.controller.getExpense as any);

		this.router.post("/user/expense/add", [checks.verifyToken as any, checks.isUser, checks.verifyModule, ExpenseRules.forAdding], this.controller.addExpense as any);

		this.router.delete("/user/expense", [checks.verifyToken as any, checks.isUser, checks.verifyModule, ExpenseRules.forFindingExpense], this.controller.deleteExpense as any);
	}
}

export default new ExpenseRoutes().router;