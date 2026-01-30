import { Router } from "express";
import { checks } from "../middleware/index";
import { CustomerRules } from "../rules/customers.rules";
import { UserRules } from "../rules/users.rules";
import { InvoicePaymentRules } from "../rules/invoicePayments.rules";
import { InvoiceRules } from "../rules/invoices.rules";
import { DefaultRules } from "../rules/default.rules";
import InvoicePaymentController from "../controllers/invoicePayments.controller";

class InvoicePaymentRoutes {
	router = Router();
	controller = new InvoicePaymentController();

	constructor() {
		this.intializeRoutes();
	}

	intializeRoutes() {

		this.router.get("/user/invoice/payments", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getInvoicePayments as any);
		this.router.get("/user/search/invoice/payments", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forSearching], this.controller.searchInvoicePayments as any);
		this.router.get("/user/filter/invoice/payments", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forFiltering], this.controller.filterInvoicePaymentsSpecifically as any);
		this.router.get("/user/invoice/payments/specifically", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getInvoicePaymentsSpecifically as any);
		this.router.get("/user/invoice/payment", [checks.verifyToken as any, checks.isUser, checks.verifyModule, InvoicePaymentRules.forFindingInvoicePayment], this.controller.getInvoicePayment as any);

		this.router.get("/invoice/payments", this.controller.publicGetInvoicePayments as any);
		this.router.get("/search/invoice/payments", [DefaultRules.forSearching as any], this.controller.publicSearchInvoicePayments as any);
		this.router.get("/invoice/payment", [InvoicePaymentRules.forFindingInvoicePayment as any], this.controller.publicGetInvoicePayment as any);
		
		this.router.post("/user/invoice/payment/add", [checks.verifyToken as any, checks.isUser, checks.verifyModule, InvoiceRules.forFindingInvoiceAlt, InvoicePaymentRules.forAdding], this.controller.addInvoicePayment as any);

		this.router.put("/user/invoice/payment/edit/receipt_reference", [checks.verifyToken as any, checks.isUser, checks.verifyModule, InvoicePaymentRules.forFindingInvoicePayment, InvoicePaymentRules.forUpdatingReceiptReference], this.controller.updateInvoicePaymentReceiptReference as any);
		this.router.put("/user/invoice/payment/edit/receipt_image", [checks.verifyToken as any, checks.isUser, checks.verifyModule, InvoicePaymentRules.forFindingInvoicePayment, InvoicePaymentRules.forReceiptImageUpload], this.controller.updateInvoicePaymentReceiptImage as any);
		this.router.put("/user/invoice/payment/edit/notes", [checks.verifyToken as any, checks.isUser, checks.verifyModule, InvoicePaymentRules.forFindingInvoicePayment, InvoicePaymentRules.forUpdatingNotes], this.controller.updateInvoicePaymentNotes as any);

		this.router.delete("/user/invoice/payment", [checks.verifyToken as any, checks.isUser, checks.verifyModule, InvoicePaymentRules.forFindingInvoicePayment], this.controller.deleteInvoicePayment as any);
	}
}

export default new InvoicePaymentRoutes().router;