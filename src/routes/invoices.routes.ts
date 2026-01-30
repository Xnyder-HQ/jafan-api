import { Router } from "express";
import { checks } from "../middleware/index";
import { CustomerRules } from "../rules/customers.rules";
import { UserRules } from "../rules/users.rules";
import { InvoiceRules } from "../rules/invoices.rules";
import { SalesOrderRules } from "../rules/salesOrders.rules";
import { DefaultRules } from "../rules/default.rules";
import InvoiceController from "../controllers/invoices.controller";

class InvoiceRoutes {
	router = Router();
	controller = new InvoiceController();

	constructor() {
		this.intializeRoutes();
	}

	intializeRoutes() {

		this.router.get("/user/invoices", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getInvoices as any);
		this.router.get("/user/search/invoices", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forSearching], this.controller.searchInvoices as any);
		this.router.get("/user/filter/invoices", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forFiltering], this.controller.filterInvoicesSpecifically as any);
		this.router.get("/user/invoices/specifically", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getInvoicesSpecifically as any);
		this.router.get("/user/invoice", [checks.verifyToken as any, checks.isUser, checks.verifyModule, InvoiceRules.forFindingInvoice], this.controller.getInvoice as any);

		this.router.get("/invoices", this.controller.publicGetInvoices as any);
		this.router.get("/search/invoices", [DefaultRules.forSearching as any], this.controller.publicSearchInvoices as any);
		this.router.get("/invoice", [InvoiceRules.forFindingInvoice as any], this.controller.publicGetInvoice as any);
		
		this.router.post("/user/invoice/add", [checks.verifyToken as any, checks.isUser, checks.verifyModule, SalesOrderRules.forFindingSalesOrderAlt, InvoiceRules.forAdding], this.controller.addInvoice as any);

		this.router.put("/user/invoice/edit/due_date", [checks.verifyToken as any, checks.isUser, checks.verifyModule, InvoiceRules.forFindingInvoice, InvoiceRules.forUpdatingDueDate], this.controller.updateInvoiceDueDate as any);
		this.router.put("/user/invoice/edit/invoice_type", [checks.verifyToken as any, checks.isUser, checks.verifyModule, InvoiceRules.forFindingInvoice, InvoiceRules.forUpdatingInvoiceType], this.controller.updateInvoiceType as any);
		this.router.put("/user/invoice/edit/notes", [checks.verifyToken as any, checks.isUser, checks.verifyModule, InvoiceRules.forFindingInvoice, InvoiceRules.forUpdatingNotes], this.controller.updateInvoiceNotes as any);
		this.router.put("/user/cancel/invoice", [checks.verifyToken as any, checks.isUser, checks.verifyModule, InvoiceRules.forFindingInvoice], this.controller.cancelInvoice as any);

		this.router.delete("/user/invoice", [checks.verifyToken as any, checks.isUser, checks.verifyModule, InvoiceRules.forFindingInvoice], this.controller.deleteInvoice as any);
	}
}

export default new InvoiceRoutes().router;