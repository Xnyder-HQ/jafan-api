import { Router } from "express";
import { checks } from "../middleware/index";
import { CustomerRules } from "../rules/customers.rules";
import { DefaultRules } from "../rules/default.rules";
import CustomerController from "../controllers/customers.controller";

class CustomerRoutes {
	router = Router();
	controller = new CustomerController();

	constructor() {
		this.intializeRoutes();
	}

	intializeRoutes() {

		this.router.get("/user/customers", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getCustomers as any);
		this.router.get("/user/search/customers", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forSearching], this.controller.searchCustomers as any);
		this.router.get("/user/filter/customers", [checks.verifyToken as any, checks.isUser, checks.verifyModule, DefaultRules.forFiltering], this.controller.filterCustomersSpecifically as any);
		this.router.get("/user/customers/specifically", [checks.verifyToken as any, checks.isUser, checks.verifyModule], this.controller.getCustomersSpecifically as any);
		this.router.get("/user/customer", [checks.verifyToken as any, checks.isUser, checks.verifyModule, CustomerRules.forFindingCustomer], this.controller.getCustomer as any);

		this.router.get("/customers", this.controller.publicGetCustomers as any);
		this.router.get("/search/customers", [DefaultRules.forSearching as any], this.controller.publicSearchCustomers as any);
		this.router.get("/customer", [CustomerRules.forFindingCustomer as any], this.controller.publicGetCustomer as any);
		
		this.router.post("/user/customer/add", [checks.verifyToken as any, checks.isUser, checks.verifyModule, CustomerRules.forAdding], this.controller.addCustomer as any);

		this.router.put("/user/customer/edit/details", [checks.verifyToken as any, checks.isUser, checks.verifyModule, CustomerRules.forFindingCustomer, CustomerRules.forUpdatingDetails], this.controller.updateCustomerDetails as any);
		this.router.put("/user/customer/edit/address", [checks.verifyToken as any, checks.isUser, checks.verifyModule, CustomerRules.forFindingCustomer, CustomerRules.forUpdatingAddress], this.controller.updateCustomerAddress as any);
		this.router.put("/user/customer/edit/profile/image", [checks.verifyToken as any, checks.isUser, checks.verifyModule, CustomerRules.forFindingCustomer, CustomerRules.forProfileImageUpload], this.controller.updateCustomerProfileImage as any);
		this.router.put("/user/customer/edit/balance", [checks.verifyToken as any, checks.isUser, checks.verifyModule, CustomerRules.forFindingCustomer, CustomerRules.forUpdatingBalance], this.controller.updateCustomerBalance as any);

		this.router.delete("/user/customer", [checks.verifyToken as any, checks.isUser, checks.verifyModule, CustomerRules.forFindingCustomer], this.controller.deleteCustomer as any);
	}
}

export default new CustomerRoutes().router;