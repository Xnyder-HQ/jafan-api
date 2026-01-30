import { Request, Response } from "express";
import { Op } from "sequelize";
import { validationResult, matchedData } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import ACL, { IACL } from "../models/acls.model";
import APPROVAL, { IApproval } from "../models/approvals.model";
import BUSINESS_RULE, { IBusinessRule } from "../models/businessRules.model";
import CATEGORY, { ICategory } from "../models/categories.model";
import CUSTOMER, { ICustomer } from "../models/customers.model";
import DELIVERY_ASSIGNMENT, { IDeliveryAssignment } from "../models/deliveryAssignments.model";
import DISCOUNT, { IDiscount } from "../models/discounts.model";
// import EMPLOYEE, { IEmployee } from "../models/employees.model"; // Uncomment when you implement employee module
import EXPENSE, { IExpense } from "../models/expenses.model";
import FINISHED_GOOD, { IFinishedGood } from "../models/finishedGoods.model";
import FINISHED_GOOD_STOCK_LOG, { IFinishedGoodStockLog } from "../models/finishedGoodStockLogs.model";
import FUEL_PURCHASE, { IFuelPurchase } from "../models/fuelPurchases.model";
import INVOICE_PAYMENT, { IInvoicePayment } from "../models/invoicePayments.model";
import INVOICE, { IInvoice } from "../models/invoices.model";
import LOGISTICS_FUEL_LOG, { ILogisticsFuelLog } from "../models/logisticsFuelLogs.model";
import LOG, { ILog } from "../models/logs.model";
import MACHINE_MAINTENANCE_LOG, { IMachineMaintenanceLog } from "../models/machineMaintenanceLogs.model";
import MACHINE, { IMachine } from "../models/machines.model";
import PRODUCTION_BATCH, { IProductionBatch } from "../models/productionBatches.model";
import PRODUCTION_FUEL_LOG, { IProductionFuelLog } from "../models/productionFuelLogs.model";
import PRODUCTION_QC_LOG, { IProductionQcLog } from "../models/productionQcLogs.model";
import PRODUCTION_TEAM, { IProductionTeam } from "../models/productionTeams.model";
import PRODUCT, { IProduct } from "../models/products.model";
import PURCHASE_ORDER, { IPurchaseOrder } from "../models/purchaseOrders.model";
import RAW_MATERIAL, { IRawMaterial } from "../models/rawMaterials.model";
import RAW_MATERIAL_STOCK_LOG, { IRawMaterialStockLog } from "../models/rawMaterialStockLogs.model";
import ROLE_ACL, { IRoleAcl } from "../models/roleAcls.model";
import ROLE, { IRole } from "../models/roles.model";
import SALES_ORDER_ITEM, { ISalesOrderItem } from "../models/salesOrderItems.model";
import SALES_ORDER, { ISalesOrder } from "../models/salesOrders.model";
import STACKING_LOG, { IStackingLog } from "../models/stackingLogs.model";
import SUPPLY_LOG, { ISupplyLog } from "../models/supplyLogs.model";
import USER, { IUser } from "../models/users.model";
import VEHICLE, { IVehicle } from "../models/vehicles.model";
import VENDOR_PAYMENT, { IVendorPayment } from "../models/vendorPayments.model";
import VENDOR, { IVendor } from "../models/vendors.model";
import MODULE, { IModule } from "../models/modules.model";
import SUB_MODULE, { ISubModule } from "../models/subModules.model";
import { addLog } from "./logs.controller";
import { IGetAuthTypesRequest } from "../middleware/checks";
import { ServerError, SuccessResponse, ValidationError, OtherSuccessResponse, NotFoundError, BadRequestError, logger, UnauthorizedError } from '../common/index';
import {
	IPagination, ISearch, default_status, paginate, return_all_letters_uppercase, anonymous, true_status, false_status, strip_text, timestamp_str_alt, dynamicWhere,
	invoice_status,
} from '../config/config';

export default class AnalyticsController {
	async getAdministrationStats(req: IGetAuthTypesRequest, res: Response) {
		const user_unique_id: string = req.USER_UNIQUE_ID;

		const queryParams: IPagination = req.query;

		const acl_details = await ACL.findOne({
			attributes: { exclude: ['id'] },
			where: {
				user_unique_id: user_unique_id,
				[Op.and]: [
					{ module_unique_id: queryParams.module_unique_id },
					{
						...(queryParams.sub_module_unique_id ? {
							sub_module_unique_id: queryParams.sub_module_unique_id
						} : {})
					}
				],
				acl_expiring: { 
					[Op.or]: [
						{ [Op.gte]: timestamp_str_alt(new Date().setHours(0, 0, 0, 0)) },
						{ [Op.eq]: null }
					]
				},
				status: default_status
			}
		});

		if (!acl_details) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized access to record" }, null);
		} 
		
		if (!acl_details.view) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized access to view record content" }, null);
		}

		try {
			const total_vehicles = await VEHICLE.count();
			const total_machines = await MACHINE.count();
			const total_users = await USER.count();

			const total_machine_via_fuel_type = await MACHINE.findAll({
				attributes: ["fuel_type", [MACHINE.sequelize!.fn('count', MACHINE.sequelize!.col('id')), 'total_count']],
				group: "fuel_type"
			});

			const total_machine_via_type = await MACHINE.findAll({
				attributes: ["type", [MACHINE.sequelize!.fn('count', MACHINE.sequelize!.col('id')), 'total_count']],
				group: "type"
			});

			const total_machine_via_is_active = await MACHINE.findAll({
				attributes: ["is_active", [MACHINE.sequelize!.fn('count', MACHINE.sequelize!.col('id')), 'total_count']],
				group: "is_active"
			});

			const total_vehicle_via_fuel_type = await VEHICLE.findAll({
				attributes: ["fuel_type", [VEHICLE.sequelize!.fn('count', VEHICLE.sequelize!.col('id')), 'total_count']],
				group: "fuel_type"
			});

			const total_vehicle_via_type = await VEHICLE.findAll({
				attributes: ["type", [VEHICLE.sequelize!.fn('count', VEHICLE.sequelize!.col('id')), 'total_count']],
				group: "type"
			});

			const total_vehicle_via_is_active = await VEHICLE.findAll({
				attributes: ["is_active", [VEHICLE.sequelize!.fn('count', VEHICLE.sequelize!.col('id')), 'total_count']],
				group: "is_active"
			});

			const total_vehicle_via_availability_status = await VEHICLE.findAll({
				attributes: ["availability_status", [VEHICLE.sequelize!.fn('count', VEHICLE.sequelize!.col('id')), 'total_count']],
				group: "availability_status"
			});

			const total_users_via_role = await USER.findAll({
				attributes: ["Role.name", "Role.stripped", [USER.sequelize!.fn('count', USER.sequelize!.col('role_unique_id')), 'total_count']],
				include: [
					{
						model: ROLE,
						as: "Role",
						attributes: ['name', 'stripped']
					},
				],
				subQuery: false,
				group: ["role_unique_id"]
			});

			return SuccessResponse(res, { unique_id: user_unique_id, text: "Administration Stats Loaded" }, {
				total_vehicles, total_machines, total_users, total_machine_via_fuel_type, total_machine_via_type, total_machine_via_is_active, total_users_via_role, 
				total_vehicle_via_fuel_type, total_vehicle_via_type, total_vehicle_via_is_active, total_vehicle_via_availability_status
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getApprovalStats(req: IGetAuthTypesRequest, res: Response) {
		const user_unique_id: string = req.USER_UNIQUE_ID;

		const queryParams: IPagination = req.query;

		const acl_details = await ACL.findOne({
			attributes: { exclude: ['id'] },
			where: {
				user_unique_id: user_unique_id,
				[Op.and]: [
					{ module_unique_id: queryParams.module_unique_id },
					{
						...(queryParams.sub_module_unique_id ? {
							sub_module_unique_id: queryParams.sub_module_unique_id
						} : {})
					}
				],
				acl_expiring: { 
					[Op.or]: [
						{ [Op.gte]: timestamp_str_alt(new Date().setHours(0, 0, 0, 0)) },
						{ [Op.eq]: null }
					]
				},
				status: default_status
			}
		});

		if (!acl_details) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized access to record" }, null);
		} 
		
		if (!acl_details.view) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized access to view record content" }, null);
		}

		if (!acl_details.elevated_role) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized elevated access to view record content" }, null);
		}

		try {
			const total_approvals = await APPROVAL.count();

			const total_approval_via_approval_status = await APPROVAL.findAll({
				attributes: ["approval_status", [APPROVAL.sequelize!.fn('count', APPROVAL.sequelize!.col('id')), 'total_count']],
				group: "approval_status"
			});

			const total_approvals_via_module = await APPROVAL.findAll({
				attributes: ["Module.name", "Module.stripped", [APPROVAL.sequelize!.fn('count', APPROVAL.sequelize!.col('module_unique_id')), 'total_count']],
				include: [
					{
						model: MODULE,
						as: "Module",
						attributes: ['name', 'stripped']
					},
				],
				subQuery: false,
				group: ["module_unique_id"]
			});

			const total_approvals_via_sub_module = await APPROVAL.findAll({
				attributes: ["SubModule.name", "SubModule.stripped", [APPROVAL.sequelize!.fn('count', APPROVAL.sequelize!.col('sub_module_unique_id')), 'total_count']],
				include: [
					{
						model: SUB_MODULE,
						as: "SubModule",
						attributes: ['name', 'stripped']
					},
				],
				subQuery: false,
				group: ["sub_module_unique_id"]
			});

			return SuccessResponse(res, { unique_id: user_unique_id, text: "Approval Stats Loaded" }, {
				total_approvals, total_approval_via_approval_status, total_approvals_via_module, total_approvals_via_sub_module
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getLogStats(req: IGetAuthTypesRequest, res: Response) {
		const user_unique_id: string = req.USER_UNIQUE_ID;

		const queryParams: IPagination = req.query;

		const acl_details = await ACL.findOne({
			attributes: { exclude: ['id'] },
			where: {
				user_unique_id: user_unique_id,
				[Op.and]: [
					{ module_unique_id: queryParams.module_unique_id },
					{
						...(queryParams.sub_module_unique_id ? {
							sub_module_unique_id: queryParams.sub_module_unique_id
						} : {})
					}
				],
				acl_expiring: { 
					[Op.or]: [
						{ [Op.gte]: timestamp_str_alt(new Date().setHours(0, 0, 0, 0)) },
						{ [Op.eq]: null }
					]
				},
				status: default_status
			}
		});

		if (!acl_details) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized access to record" }, null);
		} 
		
		if (!acl_details.view) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized access to view record content" }, null);
		}

		if (!acl_details.elevated_role) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized elevated access to view record content" }, null);
		}

		try {
			const total_logs = await LOG.count();

			const total_log_via_type = await LOG.findAll({
				attributes: ["type", [LOG.sequelize!.fn('count', LOG.sequelize!.col('id')), 'total_count']],
				group: "type"
			});

			return SuccessResponse(res, { unique_id: user_unique_id, text: "Log Stats Loaded" }, {
				total_logs, total_log_via_type
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getAclStats(req: IGetAuthTypesRequest, res: Response) {
		const user_unique_id: string = req.USER_UNIQUE_ID;

		const queryParams: IPagination = req.query;

		const acl_details = await ACL.findOne({
			attributes: { exclude: ['id'] },
			where: {
				user_unique_id: user_unique_id,
				[Op.and]: [
					{ module_unique_id: queryParams.module_unique_id },
					{
						...(queryParams.sub_module_unique_id ? {
							sub_module_unique_id: queryParams.sub_module_unique_id
						} : {})
					}
				],
				acl_expiring: { 
					[Op.or]: [
						{ [Op.gte]: timestamp_str_alt(new Date().setHours(0, 0, 0, 0)) },
						{ [Op.eq]: null }
					]
				},
				status: default_status
			}
		});

		if (!acl_details) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized access to record" }, null);
		} 
		
		if (!acl_details.view) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized access to view record content" }, null);
		}

		if (!acl_details.elevated_role) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized elevated access to view record content" }, null);
		}

		try {
			const total_acls = await ACL.count();

			const total_acls_via_role = await ACL.findAll({
				attributes: ["Role.name", "Role.stripped", [ACL.sequelize!.fn('count', ACL.sequelize!.col('role_unique_id')), 'total_count']],
				include: [
					{
						model: ROLE,
						as: "Role",
						attributes: ['name', 'stripped']
					},
				],
				subQuery: false,
				group: ["role_unique_id"]
			});

			const total_acls_via_module = await ACL.findAll({
				attributes: ["Module.name", "Module.stripped", [ACL.sequelize!.fn('count', ACL.sequelize!.col('module_unique_id')), 'total_count']],
				include: [
					{
						model: MODULE,
						as: "Module",
						attributes: ['name', 'stripped']
					},
				],
				subQuery: false,
				group: ["module_unique_id"]
			});

			const total_acls_via_sub_module = await ACL.findAll({
				attributes: ["SubModule.name", "SubModule.stripped", [ACL.sequelize!.fn('count', ACL.sequelize!.col('sub_module_unique_id')), 'total_count']],
				include: [
					{
						model: SUB_MODULE,
						as: "SubModule",
						attributes: ['name', 'stripped']
					},
				],
				subQuery: false,
				group: ["sub_module_unique_id"]
			});

			return SuccessResponse(res, { unique_id: user_unique_id, text: "ACL Stats Loaded" }, {
				total_acls, total_acls_via_role, total_acls_via_module, total_acls_via_sub_module
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getRoleStats(req: IGetAuthTypesRequest, res: Response) {
		const user_unique_id: string = req.USER_UNIQUE_ID;

		const queryParams: IPagination = req.query;

		const acl_details = await ACL.findOne({
			attributes: { exclude: ['id'] },
			where: {
				user_unique_id: user_unique_id,
				[Op.and]: [
					{ module_unique_id: queryParams.module_unique_id },
					{
						...(queryParams.sub_module_unique_id ? {
							sub_module_unique_id: queryParams.sub_module_unique_id
						} : {})
					}
				],
				acl_expiring: { 
					[Op.or]: [
						{ [Op.gte]: timestamp_str_alt(new Date().setHours(0, 0, 0, 0)) },
						{ [Op.eq]: null }
					]
				},
				status: default_status
			}
		});

		if (!acl_details) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized access to record" }, null);
		} 
		
		if (!acl_details.view) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized access to view record content" }, null);
		}

		try {
			const total_roles = await ROLE.count();
			const total_role_acls = await ROLE_ACL.count();

			const total_role_acls_via_role = await ROLE_ACL.findAll({
				attributes: ["Role.name", "Role.stripped", [ROLE_ACL.sequelize!.fn('count', ROLE_ACL.sequelize!.col('role_unique_id')), 'total_count']],
				include: [
					{
						model: ROLE,
						as: "Role",
						attributes: ['name', 'stripped']
					},
				],
				subQuery: false,
				group: ["role_unique_id"]
			});

			const total_role_acls_via_module = await ROLE_ACL.findAll({
				attributes: ["Module.name", "Module.stripped", [ROLE_ACL.sequelize!.fn('count', ROLE_ACL.sequelize!.col('module_unique_id')), 'total_count']],
				include: [
					{
						model: MODULE,
						as: "Module",
						attributes: ['name', 'stripped']
					},
				],
				subQuery: false,
				group: ["module_unique_id"]
			});

			const total_role_acls_via_sub_module = await ROLE_ACL.findAll({
				attributes: ["SubModule.name", "SubModule.stripped", [ROLE_ACL.sequelize!.fn('count', ROLE_ACL.sequelize!.col('sub_module_unique_id')), 'total_count']],
				include: [
					{
						model: SUB_MODULE,
						as: "SubModule",
						attributes: ['name', 'stripped']
					},
				],
				subQuery: false,
				group: ["sub_module_unique_id"]
			});

			return SuccessResponse(res, { unique_id: user_unique_id, text: "Role Stats Loaded" }, {
				total_roles, total_role_acls, total_role_acls_via_role, total_role_acls_via_module, total_role_acls_via_sub_module
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getSalesAndCustomerManagementStats(req: IGetAuthTypesRequest, res: Response) {
		const user_unique_id: string = req.USER_UNIQUE_ID;

		const queryParams: IPagination = req.query;

		const acl_details = await ACL.findOne({
			attributes: { exclude: ['id'] },
			where: {
				user_unique_id: user_unique_id,
				[Op.and]: [
					{ module_unique_id: queryParams.module_unique_id },
					{
						...(queryParams.sub_module_unique_id ? {
							sub_module_unique_id: queryParams.sub_module_unique_id
						} : {})
					}
				],
				acl_expiring: { 
					[Op.or]: [
						{ [Op.gte]: timestamp_str_alt(new Date().setHours(0, 0, 0, 0)) },
						{ [Op.eq]: null }
					]
				},
				status: default_status
			}
		});

		if (!acl_details) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized access to record" }, null);
		} 
		
		if (!acl_details.view) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized access to view record content" }, null);
		}

		try {
			const total_customers = await CUSTOMER.count();
			const total_products = await PRODUCT.count();
			const total_sales_orders = await SALES_ORDER.count();
			const total_sales_order_items = await SALES_ORDER_ITEM.count();
			const total_invoices = await INVOICE.count();
			const total_invoice_payments = await INVOICE_PAYMENT.count();
			const total_discounts = await DISCOUNT.count();

			const customer_balance_sum = await CUSTOMER.sum("balance");
			const sales_order_discount_sum = await SALES_ORDER.sum("discount_amount");
			const discount_sum = await DISCOUNT.sum("discount_amount");

			const total_products_via_is_inventory_tracked = await PRODUCT.findAll({
				attributes: ["is_inventory_tracked", [PRODUCT.sequelize!.fn('count', PRODUCT.sequelize!.col('id')), 'total_count']],
				group: "is_inventory_tracked"
			});

			const total_sales_orders_via_order_status = await SALES_ORDER.findAll({
				attributes: ["order_status", [SALES_ORDER.sequelize!.fn('count', SALES_ORDER.sequelize!.col('id')), 'total_count']],
				group: "order_status"
			});

			const total_invoices_via_invoice_type = await INVOICE.findAll({
				attributes: ["invoice_type", [INVOICE.sequelize!.fn('count', INVOICE.sequelize!.col('id')), 'total_count']],
				group: "invoice_type"
			});

			const total_invoices_via_invoice_status = await INVOICE.findAll({
				attributes: ["invoice_status", [INVOICE.sequelize!.fn('count', INVOICE.sequelize!.col('id')), 'total_count']],
				group: "invoice_status"
			});

			const total_invoice_payments_via_payment_method = await INVOICE_PAYMENT.findAll({
				attributes: ["payment_method", [INVOICE_PAYMENT.sequelize!.fn('count', INVOICE_PAYMENT.sequelize!.col('id')), 'total_count']],
				group: "payment_method"
			});

			const total_sales_orders_via_customer = await SALES_ORDER.findAll({
				attributes: ["Customer.name", "Customer.reference", [SALES_ORDER.sequelize!.fn('count', SALES_ORDER.sequelize!.col('customer_unique_id')), 'total_count'], [SALES_ORDER.sequelize!.fn('sum', SALES_ORDER.sequelize!.col('total_amount')), 'total_amount'], [SALES_ORDER.sequelize!.fn('sum', SALES_ORDER.sequelize!.col('total_amount')), 'total_amount'], [SALES_ORDER.sequelize!.fn('sum', SALES_ORDER.sequelize!.col('discount_amount')), 'discount_amount'], [SALES_ORDER.sequelize!.fn('sum', SALES_ORDER.sequelize!.col('amount_payable')), 'amount_payable']],
				include: [
					{
						model: CUSTOMER,
						as: "Customer",
						attributes: ['name', 'reference']
					},
				],
				subQuery: false,
				group: ["customer_unique_id"]
			});

			const total_sales_orders_via_user = await SALES_ORDER.findAll({
				attributes: ["Creator.firstname", "Creator.lastname", "Creator.unique_id", [SALES_ORDER.sequelize!.fn('count', SALES_ORDER.sequelize!.col('created_by')), 'total_count'], [SALES_ORDER.sequelize!.fn('sum', SALES_ORDER.sequelize!.col('total_amount')), 'total_amount'], [SALES_ORDER.sequelize!.fn('sum', SALES_ORDER.sequelize!.col('discount_amount')), 'discount_amount'], [SALES_ORDER.sequelize!.fn('sum', SALES_ORDER.sequelize!.col('amount_payable')), 'amount_payable']],
				include: [
					{
						model: USER,
						as: "Creator",
						attributes: ['firstname', 'lastname', 'unique_id']
					},
				],
				subQuery: false,
				group: ["created_by", "Creator.firstname", "Creator.lastname", "Creator.unique_id"]
			});

			const total_sales_orders_via_approver = await SALES_ORDER.findAll({
				attributes: ["Approver.firstname", "Approver.lastname", "Approver.unique_id", [SALES_ORDER.sequelize!.fn('count', SALES_ORDER.sequelize!.col('created_by')), 'total_count'], [SALES_ORDER.sequelize!.fn('sum', SALES_ORDER.sequelize!.col('total_amount')), 'total_amount'], [SALES_ORDER.sequelize!.fn('sum', SALES_ORDER.sequelize!.col('discount_amount')), 'discount_amount'], [SALES_ORDER.sequelize!.fn('sum', SALES_ORDER.sequelize!.col('amount_payable')), 'amount_payable']],
				include: [
					{
						model: USER,
						as: "Approver",
						attributes: ['firstname', 'lastname', 'unique_id']
					},
				],
				subQuery: false,
				group: ["created_by", "Approver.firstname", "Approver.lastname", "Approver.unique_id"]
			});

			const total_sales_order_items_via_product = await SALES_ORDER_ITEM.findAll({
				attributes: ["Product.name", "Product.reference", [SALES_ORDER_ITEM.sequelize!.fn('count', SALES_ORDER_ITEM.sequelize!.col('product_unique_id')), 'total_count'], [SALES_ORDER_ITEM.sequelize!.fn('sum', SALES_ORDER_ITEM.sequelize!.col('total_price')), 'total_price'], [SALES_ORDER_ITEM.sequelize!.fn('sum', SALES_ORDER_ITEM.sequelize!.col('quantity_ordered')), 'quantity_ordered'], [SALES_ORDER_ITEM.sequelize!.fn('sum', SALES_ORDER_ITEM.sequelize!.col('quantity_supplied')), 'quantity_supplied']],
				include: [
					{
						model: PRODUCT,
						as: "Product",
						attributes: ['name', 'reference']
					},
				],
				subQuery: false,
				group: ["product_unique_id"]
			});

			const total_discount_via_user = await DISCOUNT.findAll({
				attributes: ["Creator.firstname", "Creator.lastname", "Creator.unique_id", [DISCOUNT.sequelize!.fn('count', DISCOUNT.sequelize!.col('created_by')), 'total_count'], [DISCOUNT.sequelize!.fn('sum', DISCOUNT.sequelize!.col('discount_amount')), 'discount_amount']],
				include: [
					{
						model: USER,
						as: "Creator",
						attributes: ['firstname', 'lastname', 'unique_id']
					},
				],
				subQuery: false,
				group: ["created_by", "Creator.firstname", "Creator.lastname", "Creator.unique_id"]
			});

			const total_discount_via_approver = await DISCOUNT.findAll({
				attributes: ["Approver.firstname", "Approver.lastname", "Approver.unique_id", [DISCOUNT.sequelize!.fn('count', DISCOUNT.sequelize!.col('approved_by')), 'total_count'], [DISCOUNT.sequelize!.fn('sum', DISCOUNT.sequelize!.col('discount_amount')), 'discount_amount']],
				include: [
					{
						model: USER,
						as: "Approver",
						attributes: ['firstname', 'lastname', 'unique_id']
					},
				],
				subQuery: false,
				group: ["approved_by", "Approver.firstname", "Approver.lastname", "Approver.unique_id"]
			});

			const total_invoices_via_customer = await INVOICE.findAll({
				attributes: ["Customer.name", "Customer.reference", [INVOICE.sequelize!.fn('count', INVOICE.sequelize!.col('customer_unique_id')), 'total_count'], [INVOICE.sequelize!.fn('sum', INVOICE.sequelize!.col('discount_amount')), 'discount_amount'], [INVOICE.sequelize!.fn('sum', INVOICE.sequelize!.col('subtotal_amount')), 'subtotal_amount'], [INVOICE.sequelize!.fn('sum', INVOICE.sequelize!.col('total_amount')), 'total_amount'], [INVOICE.sequelize!.fn('sum', INVOICE.sequelize!.col('amount_paid')), 'amount_paid'], [INVOICE.sequelize!.fn('sum', INVOICE.sequelize!.col('balance_due')), 'balance_due']],
				include: [
					{
						model: CUSTOMER,
						as: "Customer",
						attributes: ['name', 'reference']
					},
				],
				subQuery: false,
				group: ["customer_unique_id"]
			});

			const salesOrderAnalysisDaily = await SALES_ORDER.findAll({
				attributes: [
					[SALES_ORDER.sequelize!.fn('date', SALES_ORDER.sequelize!.col('createdAt')), 'date'],
					[SALES_ORDER.sequelize!.fn('count', SALES_ORDER.sequelize!.col('id')), 'total_count'],
					[SALES_ORDER.sequelize!.fn('sum', SALES_ORDER.sequelize!.col('total_amount')), 'sales_total_amount'],
				],
				group: ['date'],
				order: [['date', 'ASC']],
			});

			const salesOrderAnalysisWeekly = await SALES_ORDER.findAll({
				attributes: [
					[SALES_ORDER.sequelize!.fn('DATE_FORMAT', SALES_ORDER.sequelize!.col('createdAt'), '%Y-%u'), 'week'],
					[SALES_ORDER.sequelize!.fn('count', SALES_ORDER.sequelize!.col('id')), 'total_count'],
					[SALES_ORDER.sequelize!.fn('sum', SALES_ORDER.sequelize!.col('total_amount')), 'sales_total_amount'],
				],
				group: ['week'],
				order: [['week', 'ASC']],
			});

			const salesOrderAnalysisMonthly = await SALES_ORDER.findAll({
				attributes: [
					[SALES_ORDER.sequelize!.fn('DATE_FORMAT', SALES_ORDER.sequelize!.col('createdAt'), '%Y-%m'), 'month'],
					[SALES_ORDER.sequelize!.fn('count', SALES_ORDER.sequelize!.col('id')), 'total_count'],
					[SALES_ORDER.sequelize!.fn('sum', SALES_ORDER.sequelize!.col('total_amount')), 'sales_total_amount'],
				],
				group: ['month'],
				order: [['month', 'ASC']],
			});

			const salesOrderAnalysisYearly = await SALES_ORDER.findAll({
				attributes: [
					[SALES_ORDER.sequelize!.fn('DATE_FORMAT', SALES_ORDER.sequelize!.col('createdAt'), '%Y'), 'year'],
					[SALES_ORDER.sequelize!.fn('count', SALES_ORDER.sequelize!.col('id')), 'total_count'],
					[SALES_ORDER.sequelize!.fn('sum', SALES_ORDER.sequelize!.col('total_amount')), 'sales_total_amount'],
				],
				group: ['year'],
				order: [['year', 'ASC']],
			});

			const invoiceDateAnalysisDaily = await INVOICE.findAll({
				attributes: [
					[INVOICE.sequelize!.fn('date', INVOICE.sequelize!.col('invoice_date')), 'date'],
					[INVOICE.sequelize!.fn('count', INVOICE.sequelize!.col('id')), 'total_count'],
				],
				group: ['date'],
				order: [['date', 'ASC']],
			});

			const invoiceDateAnalysisWeekly = await INVOICE.findAll({
				attributes: [
					[INVOICE.sequelize!.fn('DATE_FORMAT', INVOICE.sequelize!.col('invoice_date'), '%Y-%u'), 'week'],
					[INVOICE.sequelize!.fn('count', INVOICE.sequelize!.col('id')), 'total_count'],
				],
				group: ['week'],
				order: [['week', 'ASC']],
			});

			const invoiceDateAnalysisMonthly = await INVOICE.findAll({
				attributes: [
					[INVOICE.sequelize!.fn('DATE_FORMAT', INVOICE.sequelize!.col('invoice_date'), '%Y-%m'), 'month'],
					[INVOICE.sequelize!.fn('count', INVOICE.sequelize!.col('id')), 'total_count'],
				],
				group: ['month'],
				order: [['month', 'ASC']],
			});

			const invoiceDateAnalysisYearly = await INVOICE.findAll({
				attributes: [
					[INVOICE.sequelize!.fn('DATE_FORMAT', INVOICE.sequelize!.col('invoice_date'), '%Y'), 'year'],
					[INVOICE.sequelize!.fn('count', INVOICE.sequelize!.col('id')), 'total_count'],
				],
				group: ['year'],
				order: [['year', 'ASC']],
			});

			const invoiceDueDateAnalysisDaily = await INVOICE.findAll({
				attributes: [
					[INVOICE.sequelize!.fn('date', INVOICE.sequelize!.col('due_date')), 'date'],
					[INVOICE.sequelize!.fn('count', INVOICE.sequelize!.col('id')), 'total_count'],
				],
				group: ['date'],
				order: [['date', 'ASC']],
			});

			const invoiceDueDateAnalysisWeekly = await INVOICE.findAll({
				attributes: [
					[INVOICE.sequelize!.fn('DATE_FORMAT', INVOICE.sequelize!.col('due_date'), '%Y-%u'), 'week'],
					[INVOICE.sequelize!.fn('count', INVOICE.sequelize!.col('id')), 'total_count'],
				],
				group: ['week'],
				order: [['week', 'ASC']],
			});

			const invoiceDueDateAnalysisMonthly = await INVOICE.findAll({
				attributes: [
					[INVOICE.sequelize!.fn('DATE_FORMAT', INVOICE.sequelize!.col('due_date'), '%Y-%m'), 'month'],
					[INVOICE.sequelize!.fn('count', INVOICE.sequelize!.col('id')), 'total_count'],
				],
				group: ['month'],
				order: [['month', 'ASC']],
			});

			const invoiceDueDateAnalysisYearly = await INVOICE.findAll({
				attributes: [
					[INVOICE.sequelize!.fn('DATE_FORMAT', INVOICE.sequelize!.col('due_date'), '%Y'), 'year'],
					[INVOICE.sequelize!.fn('count', INVOICE.sequelize!.col('id')), 'total_count'],
				],
				group: ['year'],
				order: [['year', 'ASC']],
			});

			const invoicePaymentDateAnalysisDaily = await INVOICE_PAYMENT.findAll({
				attributes: [
					[INVOICE_PAYMENT.sequelize!.fn('date', INVOICE_PAYMENT.sequelize!.col('payment_date')), 'date'],
					[INVOICE_PAYMENT.sequelize!.fn('count', INVOICE_PAYMENT.sequelize!.col('id')), 'total_count'],
				],
				group: ['date'],
				order: [['date', 'ASC']],
			});

			const invoicePaymentDateAnalysisWeekly = await INVOICE_PAYMENT.findAll({
				attributes: [
					[INVOICE_PAYMENT.sequelize!.fn('DATE_FORMAT', INVOICE_PAYMENT.sequelize!.col('payment_date'), '%Y-%u'), 'week'],
					[INVOICE_PAYMENT.sequelize!.fn('count', INVOICE_PAYMENT.sequelize!.col('id')), 'total_count'],
				],
				group: ['week'],
				order: [['week', 'ASC']],
			});

			const invoicePaymentDateAnalysisMonthly = await INVOICE_PAYMENT.findAll({
				attributes: [
					[INVOICE_PAYMENT.sequelize!.fn('DATE_FORMAT', INVOICE_PAYMENT.sequelize!.col('payment_date'), '%Y-%m'), 'month'],
					[INVOICE_PAYMENT.sequelize!.fn('count', INVOICE_PAYMENT.sequelize!.col('id')), 'total_count'],
				],
				group: ['month'],
				order: [['month', 'ASC']],
			});

			const invoicePaymentDateAnalysisYearly = await INVOICE_PAYMENT.findAll({
				attributes: [
					[INVOICE_PAYMENT.sequelize!.fn('DATE_FORMAT', INVOICE_PAYMENT.sequelize!.col('payment_date'), '%Y'), 'year'],
					[INVOICE_PAYMENT.sequelize!.fn('count', INVOICE_PAYMENT.sequelize!.col('id')), 'total_count'],
				],
				group: ['year'],
				order: [['year', 'ASC']],
			});

			const invoiceOverdueAlerts = await INVOICE.findAll({
				attributes: [
					"unique_id", "due_date", "customer_unique_id", "invoice_type", 
					[INVOICE.sequelize!.fn('datediff', INVOICE.sequelize!.col('due_date'), new Date()), 'days_overdue'],
				],
				where: {
					due_date: {
						[Op.lte]: new Date(new Date().setDate(new Date().getDate() - 7)),
					},
					invoice_status: {
						[Op.ne]: invoice_status.paid,
					},
				},
				having: {
					days_overdue: {
						[Op.in]: [7, 8, 9, 10, 11, 12, 13, 14],
					},
				},
				include: [
					{
						model: CUSTOMER,
						attributes: ['unique_id', 'reference', 'type', 'name', 'email', 'phone_number', 'alt_phone_number', 'balance', 'profile_image']
					}
				]
			});

			const customerBalanceAlerts = await CUSTOMER.findAll({
				attributes: [
					"unique_id", "name", "balance",
				],
				where: {
					balance: {
						[Op.lt]: 0,
					},
				},
			});

			const excessiveDiscountAlerts = await SALES_ORDER.findAll({
				attributes: [
					"approved_by", "discount_amount", "total_amount",
					[SALES_ORDER.sequelize!.fn('round', SALES_ORDER.sequelize!.literal('(discount_amount / total_amount) * 100'), 2), 'discount_percentage'],
				],
				where: {
					discount_amount: {
						[Op.gt]: SALES_ORDER.sequelize!.literal('total_amount * 0.2'), // More than 20% discount
					},
				},
				include: [
					{
						model: USER,
						as: "Approver", // Specify the correct alias for the association
						attributes: ['unique_id', 'firstname', 'middlename', 'lastname', 'username', 'email'], 
					}
				]
			});

			return SuccessResponse(res, { unique_id: user_unique_id, text: "Sales & Customer Management Stats Loaded" }, {
				total_customers, total_products, total_sales_orders, total_sales_order_items, total_invoices, total_invoice_payments, total_discounts, total_products_via_is_inventory_tracked, 
				total_sales_orders_via_order_status, total_discount_via_user, total_discount_via_approver, total_invoices_via_invoice_type, total_invoices_via_invoice_status, 
				total_invoice_payments_via_payment_method, total_sales_orders_via_customer, total_sales_order_items_via_product, total_invoices_via_customer, salesOrderAnalysisDaily, 
				salesOrderAnalysisWeekly, salesOrderAnalysisMonthly, salesOrderAnalysisYearly, invoiceDateAnalysisDaily, invoiceDateAnalysisWeekly, invoiceDateAnalysisMonthly, 
				invoiceDateAnalysisYearly, invoiceDueDateAnalysisDaily, invoiceDueDateAnalysisWeekly, invoiceDueDateAnalysisMonthly, invoiceDueDateAnalysisYearly, invoicePaymentDateAnalysisDaily, 
				invoicePaymentDateAnalysisWeekly, invoicePaymentDateAnalysisMonthly, invoicePaymentDateAnalysisYearly, total_sales_orders_via_user, total_sales_orders_via_approver, customer_balance_sum, 
				sales_order_discount_sum, discount_sum, invoiceOverdueAlerts, customerBalanceAlerts, excessiveDiscountAlerts, 
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getProcurementAndVendorManagementStats(req: IGetAuthTypesRequest, res: Response) {
		const user_unique_id: string = req.USER_UNIQUE_ID;

		const queryParams: IPagination = req.query;

		const acl_details = await ACL.findOne({
			attributes: { exclude: ['id'] },
			where: {
				user_unique_id: user_unique_id,
				[Op.and]: [
					{ module_unique_id: queryParams.module_unique_id },
					{
						...(queryParams.sub_module_unique_id ? {
							sub_module_unique_id: queryParams.sub_module_unique_id
						} : {})
					}
				],
				acl_expiring: { 
					[Op.or]: [
						{ [Op.gte]: timestamp_str_alt(new Date().setHours(0, 0, 0, 0)) },
						{ [Op.eq]: null }
					]
				},
				status: default_status
			}
		});

		if (!acl_details) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized access to record" }, null);
		} 
		
		if (!acl_details.view) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized access to view record content" }, null);
		}

		try {
			const total_vendors = await VENDOR.count();
			const total_purchase_orders = await PURCHASE_ORDER.count();
			const total_vendor_payments = await VENDOR_PAYMENT.count();
			const total_fuel_purchases = await FUEL_PURCHASE.count();
			const total_expenses = await EXPENSE.count();

			const total_vendor_spend = await VENDOR.sum("total_spend");
			const total_purchase_order_amount_paid = await PURCHASE_ORDER.sum("amount_paid");
			const total_purchase_order_balance_due = await PURCHASE_ORDER.sum("balance_due");
			const total_vendor_payment_amount_paid = await VENDOR_PAYMENT.sum("amount_paid");
			const total_fuel_purchase_liters_purchased = await FUEL_PURCHASE.sum("liters_purchased");
			const total_fuel_purchase_total_cost = await FUEL_PURCHASE.sum("total_cost");
			const total_expense_amount = await EXPENSE.sum("amount");

			const total_purchase_order_via_po_type = await PURCHASE_ORDER.findAll({
				attributes: ["po_type", [PURCHASE_ORDER.sequelize!.fn('count', PURCHASE_ORDER.sequelize!.col('id')), 'total_count']],
				group: "po_type"
			});

			const total_purchase_order_via_payment_status = await PURCHASE_ORDER.findAll({
				attributes: ["payment_status", [PURCHASE_ORDER.sequelize!.fn('count', PURCHASE_ORDER.sequelize!.col('id')), 'total_count']],
				group: "payment_status"
			});

			const total_purchase_order_via_delivery_status = await PURCHASE_ORDER.findAll({
				attributes: ["delivery_status", [PURCHASE_ORDER.sequelize!.fn('count', PURCHASE_ORDER.sequelize!.col('id')), 'total_count']],
				group: "delivery_status"
			});

			const total_purchase_order_via_order_status = await PURCHASE_ORDER.findAll({
				attributes: ["order_status", [PURCHASE_ORDER.sequelize!.fn('count', PURCHASE_ORDER.sequelize!.col('id')), 'total_count']],
				group: "order_status"
			});

			const total_vendor_payment_via_payment_method = await VENDOR_PAYMENT.findAll({
				attributes: ["payment_method", [VENDOR_PAYMENT.sequelize!.fn('count', VENDOR_PAYMENT.sequelize!.col('id')), 'total_count']],
				group: "payment_method"
			});

			const total_fuel_purchase_via_fuel_type = await FUEL_PURCHASE.findAll({
				attributes: ["fuel_type", [FUEL_PURCHASE.sequelize!.fn('count', FUEL_PURCHASE.sequelize!.col('id')), 'total_count']],
				group: "fuel_type"
			});

			const total_fuel_purchase_via_payment_status = await FUEL_PURCHASE.findAll({
				attributes: ["payment_status", [FUEL_PURCHASE.sequelize!.fn('count', FUEL_PURCHASE.sequelize!.col('id')), 'total_count']],
				group: "payment_status"
			});

			const total_fuel_purchase_via_delivery_status = await FUEL_PURCHASE.findAll({
				attributes: ["delivery_status", [FUEL_PURCHASE.sequelize!.fn('count', FUEL_PURCHASE.sequelize!.col('id')), 'total_count']],
				group: "delivery_status"
			});

			const total_expense_via_category = await EXPENSE.findAll({
				attributes: ["category", [EXPENSE.sequelize!.fn('count', EXPENSE.sequelize!.col('id')), 'total_count'], [EXPENSE.sequelize!.fn('sum', EXPENSE.sequelize!.col('amount')), 'total_amount']],
				group: "category"
			});

			const total_purchase_orders_via_user = await PURCHASE_ORDER.findAll({
				attributes: ["Creator.firstname", "Creator.lastname", "Creator.unique_id", [PURCHASE_ORDER.sequelize!.fn('count', PURCHASE_ORDER.sequelize!.col('created_by')), 'total_count'], [PURCHASE_ORDER.sequelize!.fn('sum', PURCHASE_ORDER.sequelize!.col('total_amount')), 'total_amount']],
				include: [
					{
						model: USER,
						as: "Creator",
						attributes: ['firstname', 'lastname', 'unique_id']
					},
				],
				subQuery: false,
				group: ["created_by", "Creator.firstname", "Creator.lastname", "Creator.unique_id"]
			});

			const total_purchase_orders_via_user_approval = await PURCHASE_ORDER.findAll({
				attributes: ["Approver.firstname", "Approver.lastname", "Approver.unique_id", [PURCHASE_ORDER.sequelize!.fn('count', PURCHASE_ORDER.sequelize!.col('approved_by')), 'total_count'], [PURCHASE_ORDER.sequelize!.fn('sum', PURCHASE_ORDER.sequelize!.col('total_amount')), 'total_amount']],
				include: [
					{
						model: USER,
						as: "Approver",
						attributes: ['firstname', 'lastname', 'unique_id']
					},
				],
				subQuery: false,
				group: ["approved_by", "Approver.firstname", "Approver.lastname", "Approver.unique_id"]
			});

			const total_vendor_payment_via_user = await VENDOR_PAYMENT.findAll({
				attributes: ["Creator.firstname", "Creator.lastname", "Creator.unique_id", [VENDOR_PAYMENT.sequelize!.fn('count', VENDOR_PAYMENT.sequelize!.col('created_by')), 'total_count'], [VENDOR_PAYMENT.sequelize!.fn('sum', VENDOR_PAYMENT.sequelize!.col('amount_paid')), 'amount_paid']],
				include: [
					{
						model: USER,
						as: "Creator",
						attributes: ['firstname', 'lastname', 'unique_id']
					},
				],
				subQuery: false,
				group: ["created_by", "Creator.firstname", "Creator.lastname", "Creator.unique_id"]
			});

			const total_vendor_payment_via_facilitator = await VENDOR_PAYMENT.findAll({
				attributes: ["Facilitator.firstname", "Facilitator.lastname", "Facilitator.unique_id", [VENDOR_PAYMENT.sequelize!.fn('count', VENDOR_PAYMENT.sequelize!.col('facilitated_by')), 'total_count'], [VENDOR_PAYMENT.sequelize!.fn('sum', VENDOR_PAYMENT.sequelize!.col('amount_paid')), 'amount_paid']],
				include: [
					{
						model: USER,
						as: "Facilitator",
						attributes: ['firstname', 'lastname', 'unique_id']
					},
				],
				subQuery: false,
				group: ["facilitated_by", "Facilitator.firstname", "Facilitator.lastname", "Facilitator.unique_id"]
			});

			const total_fuel_purchase_via_user = await FUEL_PURCHASE.findAll({
				attributes: ["User.firstname", "User.lastname", "User.unique_id", [FUEL_PURCHASE.sequelize!.fn('count', FUEL_PURCHASE.sequelize!.col('created_by')), 'total_count'], [FUEL_PURCHASE.sequelize!.fn('sum', FUEL_PURCHASE.sequelize!.col('total_cost')), 'total_cost']],
				include: [
					{
						model: USER,
						as: "User",
						attributes: ['firstname', 'lastname', 'unique_id']
					},
				],
				subQuery: false,
				group: ["created_by", "User.firstname", "User.lastname", "User.unique_id"]
			});

			const total_expense_via_user = await EXPENSE.findAll({
				attributes: ["User.firstname", "User.lastname", "User.unique_id", [EXPENSE.sequelize!.fn('count', EXPENSE.sequelize!.col('created_by')), 'total_count'], [EXPENSE.sequelize!.fn('sum', EXPENSE.sequelize!.col('amount')), 'total_amount']],
				include: [
					{
						model: USER,
						as: "User",
						attributes: ['firstname', 'lastname', 'unique_id']
					},
				],
				subQuery: false,
				group: ["created_by", "User.firstname", "User.lastname", "User.unique_id"]
			});

			const purchaseOrderDateAnalysisDaily = await PURCHASE_ORDER.findAll({
				attributes: [
					[PURCHASE_ORDER.sequelize!.fn('date', PURCHASE_ORDER.sequelize!.col('order_date')), 'date'],
					[PURCHASE_ORDER.sequelize!.fn('count', PURCHASE_ORDER.sequelize!.col('id')), 'total_count'],
				],
				group: ['date'],
				order: [['date', 'ASC']],
			});

			const purchaseOrderDateAnalysisWeekly = await PURCHASE_ORDER.findAll({
				attributes: [
					[PURCHASE_ORDER.sequelize!.fn('DATE_FORMAT', PURCHASE_ORDER.sequelize!.col('order_date'), '%Y-%u'), 'week'],
					[PURCHASE_ORDER.sequelize!.fn('count', PURCHASE_ORDER.sequelize!.col('id')), 'total_count'],
				],
				group: ['week'],
				order: [['week', 'ASC']],
			});

			const purchaseOrderDateAnalysisMonthly = await PURCHASE_ORDER.findAll({
				attributes: [
					[PURCHASE_ORDER.sequelize!.fn('DATE_FORMAT', PURCHASE_ORDER.sequelize!.col('order_date'), '%Y-%m'), 'month'],
					[PURCHASE_ORDER.sequelize!.fn('count', PURCHASE_ORDER.sequelize!.col('id')), 'total_count'],
				],
				group: ['month'],
				order: [['month', 'ASC']],
			});

			const purchaseOrderDateAnalysisYearly = await PURCHASE_ORDER.findAll({
				attributes: [
					[PURCHASE_ORDER.sequelize!.fn('DATE_FORMAT', PURCHASE_ORDER.sequelize!.col('order_date'), '%Y'), 'year'],
					[PURCHASE_ORDER.sequelize!.fn('count', PURCHASE_ORDER.sequelize!.col('id')), 'total_count'],
				],
				group: ['year'],
				order: [['year', 'ASC']],
			});

			const purchaseOrderExpectedDeliveryDateAnalysisDaily = await PURCHASE_ORDER.findAll({
				attributes: [
					[PURCHASE_ORDER.sequelize!.fn('date', PURCHASE_ORDER.sequelize!.col('expected_delivery_date')), 'date'],
					[PURCHASE_ORDER.sequelize!.fn('count', PURCHASE_ORDER.sequelize!.col('id')), 'total_count'],
				],
				group: ['date'],
				order: [['date', 'ASC']],
			});

			const purchaseOrderExpectedDeliveryDateAnalysisWeekly = await PURCHASE_ORDER.findAll({
				attributes: [
					[PURCHASE_ORDER.sequelize!.fn('DATE_FORMAT', PURCHASE_ORDER.sequelize!.col('expected_delivery_date'), '%Y-%u'), 'week'],
					[PURCHASE_ORDER.sequelize!.fn('count', PURCHASE_ORDER.sequelize!.col('id')), 'total_count'],
				],
				group: ['week'],
				order: [['week', 'ASC']],
			});

			const purchaseOrderExpectedDeliveryDateAnalysisMonthly = await PURCHASE_ORDER.findAll({
				attributes: [
					[PURCHASE_ORDER.sequelize!.fn('DATE_FORMAT', PURCHASE_ORDER.sequelize!.col('expected_delivery_date'), '%Y-%m'), 'month'],
					[PURCHASE_ORDER.sequelize!.fn('count', PURCHASE_ORDER.sequelize!.col('id')), 'total_count'],
				],
				group: ['month'],
				order: [['month', 'ASC']],
			});

			const purchaseOrderExpectedDeliveryDateAnalysisYearly = await PURCHASE_ORDER.findAll({
				attributes: [
					[PURCHASE_ORDER.sequelize!.fn('DATE_FORMAT', PURCHASE_ORDER.sequelize!.col('expected_delivery_date'), '%Y'), 'year'],
					[PURCHASE_ORDER.sequelize!.fn('count', PURCHASE_ORDER.sequelize!.col('id')), 'total_count'],
				],
				group: ['year'],
				order: [['year', 'ASC']],
			});

			const purchaseOrderTotalAmountAnalysisDaily = await PURCHASE_ORDER.findAll({
				attributes: [
					[PURCHASE_ORDER.sequelize!.fn('date', PURCHASE_ORDER.sequelize!.col('createdAt')), 'date'],
					[PURCHASE_ORDER.sequelize!.fn('count', PURCHASE_ORDER.sequelize!.col('id')), 'total_count'],
					[PURCHASE_ORDER.sequelize!.fn('sum', PURCHASE_ORDER.sequelize!.col('total_amount')), 'total_amount']
				],
				group: ['date'],
				order: [['date', 'ASC']],
			});

			const purchaseOrderTotalAmountAnalysisWeekly = await PURCHASE_ORDER.findAll({
				attributes: [
					[PURCHASE_ORDER.sequelize!.fn('DATE_FORMAT', PURCHASE_ORDER.sequelize!.col('createdAt'), '%Y-%u'), 'week'],
					[PURCHASE_ORDER.sequelize!.fn('count', PURCHASE_ORDER.sequelize!.col('id')), 'total_count'],
					[PURCHASE_ORDER.sequelize!.fn('sum', PURCHASE_ORDER.sequelize!.col('total_amount')), 'total_amount']
				],
				group: ['week'],
				order: [['week', 'ASC']],
			});

			const purchaseOrderTotalAmountAnalysisMonthly = await PURCHASE_ORDER.findAll({
				attributes: [
					[PURCHASE_ORDER.sequelize!.fn('DATE_FORMAT', PURCHASE_ORDER.sequelize!.col('createdAt'), '%Y-%m'), 'month'],
					[PURCHASE_ORDER.sequelize!.fn('count', PURCHASE_ORDER.sequelize!.col('id')), 'total_count'],
					[PURCHASE_ORDER.sequelize!.fn('sum', PURCHASE_ORDER.sequelize!.col('total_amount')), 'total_amount']
				],
				group: ['month'],
				order: [['month', 'ASC']],
			});

			const purchaseOrderTotalAmountAnalysisYearly = await PURCHASE_ORDER.findAll({
				attributes: [
					[PURCHASE_ORDER.sequelize!.fn('DATE_FORMAT', PURCHASE_ORDER.sequelize!.col('createdAt'), '%Y'), 'year'],
					[PURCHASE_ORDER.sequelize!.fn('count', PURCHASE_ORDER.sequelize!.col('id')), 'total_count'],
					[PURCHASE_ORDER.sequelize!.fn('sum', PURCHASE_ORDER.sequelize!.col('total_amount')), 'total_amount']
				],
				group: ['year'],
				order: [['year', 'ASC']],
			});

			const purchaseOrderAmountPaidAnalysisDaily = await PURCHASE_ORDER.findAll({
				attributes: [
					[PURCHASE_ORDER.sequelize!.fn('date', PURCHASE_ORDER.sequelize!.col('createdAt')), 'date'],
					[PURCHASE_ORDER.sequelize!.fn('count', PURCHASE_ORDER.sequelize!.col('id')), 'total_count'],
					[PURCHASE_ORDER.sequelize!.fn('sum', PURCHASE_ORDER.sequelize!.col('amount_paid')), 'amount_paid']
				],
				group: ['date'],
				order: [['date', 'ASC']],
			});

			const purchaseOrderAmountPaidAnalysisWeekly = await PURCHASE_ORDER.findAll({
				attributes: [
					[PURCHASE_ORDER.sequelize!.fn('DATE_FORMAT', PURCHASE_ORDER.sequelize!.col('createdAt'), '%Y-%u'), 'week'],
					[PURCHASE_ORDER.sequelize!.fn('count', PURCHASE_ORDER.sequelize!.col('id')), 'total_count'],
					[PURCHASE_ORDER.sequelize!.fn('sum', PURCHASE_ORDER.sequelize!.col('amount_paid')), 'amount_paid']
				],
				group: ['week'],
				order: [['week', 'ASC']],
			});

			const purchaseOrderAmountPaidAnalysisMonthly = await PURCHASE_ORDER.findAll({
				attributes: [
					[PURCHASE_ORDER.sequelize!.fn('DATE_FORMAT', PURCHASE_ORDER.sequelize!.col('createdAt'), '%Y-%m'), 'month'],
					[PURCHASE_ORDER.sequelize!.fn('count', PURCHASE_ORDER.sequelize!.col('id')), 'total_count'],
					[PURCHASE_ORDER.sequelize!.fn('sum', PURCHASE_ORDER.sequelize!.col('amount_paid')), 'amount_paid']
				],
				group: ['month'],
				order: [['month', 'ASC']],
			});

			const purchaseOrderAmountPaidAnalysisYearly = await PURCHASE_ORDER.findAll({
				attributes: [
					[PURCHASE_ORDER.sequelize!.fn('DATE_FORMAT', PURCHASE_ORDER.sequelize!.col('createdAt'), '%Y'), 'year'],
					[PURCHASE_ORDER.sequelize!.fn('count', PURCHASE_ORDER.sequelize!.col('id')), 'total_count'],
					[PURCHASE_ORDER.sequelize!.fn('sum', PURCHASE_ORDER.sequelize!.col('amount_paid')), 'amount_paid']
				],
				group: ['year'],
				order: [['year', 'ASC']],
			});

			const purchaseOrderBalanceDueAnalysisDaily = await PURCHASE_ORDER.findAll({
				attributes: [
					[PURCHASE_ORDER.sequelize!.fn('date', PURCHASE_ORDER.sequelize!.col('createdAt')), 'date'],
					[PURCHASE_ORDER.sequelize!.fn('count', PURCHASE_ORDER.sequelize!.col('id')), 'total_count'],
					[PURCHASE_ORDER.sequelize!.fn('sum', PURCHASE_ORDER.sequelize!.col('balance_due')), 'balance_due']
				],
				group: ['date'],
				order: [['date', 'ASC']],
			});

			const purchaseOrderBalanceDueAnalysisWeekly = await PURCHASE_ORDER.findAll({
				attributes: [
					[PURCHASE_ORDER.sequelize!.fn('DATE_FORMAT', PURCHASE_ORDER.sequelize!.col('createdAt'), '%Y-%u'), 'week'],
					[PURCHASE_ORDER.sequelize!.fn('count', PURCHASE_ORDER.sequelize!.col('id')), 'total_count'],
					[PURCHASE_ORDER.sequelize!.fn('sum', PURCHASE_ORDER.sequelize!.col('balance_due')), 'balance_due']
				],
				group: ['week'],
				order: [['week', 'ASC']],
			});

			const purchaseOrderBalanceDueAnalysisMonthly = await PURCHASE_ORDER.findAll({
				attributes: [
					[PURCHASE_ORDER.sequelize!.fn('DATE_FORMAT', PURCHASE_ORDER.sequelize!.col('createdAt'), '%Y-%m'), 'month'],
					[PURCHASE_ORDER.sequelize!.fn('count', PURCHASE_ORDER.sequelize!.col('id')), 'total_count'],
					[PURCHASE_ORDER.sequelize!.fn('sum', PURCHASE_ORDER.sequelize!.col('balance_due')), 'balance_due']
				],
				group: ['month'],
				order: [['month', 'ASC']],
			});

			const purchaseOrderBalanceDueAnalysisYearly = await PURCHASE_ORDER.findAll({
				attributes: [
					[PURCHASE_ORDER.sequelize!.fn('DATE_FORMAT', PURCHASE_ORDER.sequelize!.col('createdAt'), '%Y'), 'year'],
					[PURCHASE_ORDER.sequelize!.fn('count', PURCHASE_ORDER.sequelize!.col('id')), 'total_count'],
					[PURCHASE_ORDER.sequelize!.fn('sum', PURCHASE_ORDER.sequelize!.col('balance_due')), 'balance_due']
				],
				group: ['year'],
				order: [['year', 'ASC']],
			});

			const vendorPaymentDateAnalysisDaily = await VENDOR_PAYMENT.findAll({
				attributes: [
					[VENDOR_PAYMENT.sequelize!.fn('date', VENDOR_PAYMENT.sequelize!.col('payment_date')), 'date'],
					[VENDOR_PAYMENT.sequelize!.fn('count', VENDOR_PAYMENT.sequelize!.col('id')), 'total_count'],
				],
				group: ['date'],
				order: [['date', 'ASC']],
			});

			const vendorPaymentDateAnalysisWeekly = await VENDOR_PAYMENT.findAll({
				attributes: [
					[VENDOR_PAYMENT.sequelize!.fn('DATE_FORMAT', VENDOR_PAYMENT.sequelize!.col('payment_date'), '%Y-%u'), 'week'],
					[VENDOR_PAYMENT.sequelize!.fn('count', VENDOR_PAYMENT.sequelize!.col('id')), 'total_count'],
				],
				group: ['week'],
				order: [['week', 'ASC']],
			});

			const vendorPaymentDateAnalysisMonthly = await VENDOR_PAYMENT.findAll({
				attributes: [
					[VENDOR_PAYMENT.sequelize!.fn('DATE_FORMAT', VENDOR_PAYMENT.sequelize!.col('payment_date'), '%Y-%m'), 'month'],
					[VENDOR_PAYMENT.sequelize!.fn('count', VENDOR_PAYMENT.sequelize!.col('id')), 'total_count'],
				],
				group: ['month'],
				order: [['month', 'ASC']],
			});

			const vendorPaymentDateAnalysisYearly = await VENDOR_PAYMENT.findAll({
				attributes: [
					[VENDOR_PAYMENT.sequelize!.fn('DATE_FORMAT', VENDOR_PAYMENT.sequelize!.col('payment_date'), '%Y'), 'year'],
					[VENDOR_PAYMENT.sequelize!.fn('count', VENDOR_PAYMENT.sequelize!.col('id')), 'total_count'],
				],
				group: ['year'],
				order: [['year', 'ASC']],
			});

			const fuelPurchaseDateAnalysisDaily = await FUEL_PURCHASE.findAll({
				attributes: [
					[FUEL_PURCHASE.sequelize!.fn('date', FUEL_PURCHASE.sequelize!.col('purchase_date')), 'date'],
					[FUEL_PURCHASE.sequelize!.fn('count', FUEL_PURCHASE.sequelize!.col('id')), 'total_count'],
				],
				group: ['date'],
				order: [['date', 'ASC']],
			});

			const fuelPurchaseDateAnalysisWeekly = await FUEL_PURCHASE.findAll({
				attributes: [
					[FUEL_PURCHASE.sequelize!.fn('DATE_FORMAT', FUEL_PURCHASE.sequelize!.col('purchase_date'), '%Y-%u'), 'week'],
					[FUEL_PURCHASE.sequelize!.fn('count', FUEL_PURCHASE.sequelize!.col('id')), 'total_count'],
				],
				group: ['week'],
				order: [['week', 'ASC']],
			});

			const fuelPurchaseDateAnalysisMonthly = await FUEL_PURCHASE.findAll({
				attributes: [
					[FUEL_PURCHASE.sequelize!.fn('DATE_FORMAT', FUEL_PURCHASE.sequelize!.col('purchase_date'), '%Y-%m'), 'month'],
					[FUEL_PURCHASE.sequelize!.fn('count', FUEL_PURCHASE.sequelize!.col('id')), 'total_count'],
				],
				group: ['month'],
				order: [['month', 'ASC']],
			});

			const fuelPurchaseDateAnalysisYearly = await FUEL_PURCHASE.findAll({
				attributes: [
					[FUEL_PURCHASE.sequelize!.fn('DATE_FORMAT', FUEL_PURCHASE.sequelize!.col('purchase_date'), '%Y'), 'year'],
					[FUEL_PURCHASE.sequelize!.fn('count', FUEL_PURCHASE.sequelize!.col('id')), 'total_count'],
				],
				group: ['year'],
				order: [['year', 'ASC']],
			});

			const expenseDateAnalysisDaily = await EXPENSE.findAll({
				attributes: [
					[EXPENSE.sequelize!.fn('date', EXPENSE.sequelize!.col('expense_date')), 'date'],
					[EXPENSE.sequelize!.fn('count', EXPENSE.sequelize!.col('id')), 'total_count'],
				],
				group: ['date'],
				order: [['date', 'ASC']],
			});

			const expenseDateAnalysisWeekly = await EXPENSE.findAll({
				attributes: [
					[EXPENSE.sequelize!.fn('DATE_FORMAT', EXPENSE.sequelize!.col('expense_date'), '%Y-%u'), 'week'],
					[EXPENSE.sequelize!.fn('count', EXPENSE.sequelize!.col('id')), 'total_count'],
				],
				group: ['week'],
				order: [['week', 'ASC']],
			});

			const expenseDateAnalysisMonthly = await EXPENSE.findAll({
				attributes: [
					[EXPENSE.sequelize!.fn('DATE_FORMAT', EXPENSE.sequelize!.col('expense_date'), '%Y-%m'), 'month'],
					[EXPENSE.sequelize!.fn('count', EXPENSE.sequelize!.col('id')), 'total_count'],
				],
				group: ['month'],
				order: [['month', 'ASC']],
			});

			const expenseDateAnalysisYearly = await EXPENSE.findAll({
				attributes: [
					[EXPENSE.sequelize!.fn('DATE_FORMAT', EXPENSE.sequelize!.col('expense_date'), '%Y'), 'year'],
					[EXPENSE.sequelize!.fn('count', EXPENSE.sequelize!.col('id')), 'total_count'],
				],
				group: ['year'],
				order: [['year', 'ASC']],
			});

			return SuccessResponse(res, { unique_id: user_unique_id, text: "Procurement & Vendor Management Stats Loaded" }, {
				total_vendors, total_purchase_orders, total_vendor_payments, total_fuel_purchases, total_expenses, total_vendor_spend, total_purchase_order_amount_paid, 
				total_purchase_order_balance_due, total_vendor_payment_amount_paid, total_fuel_purchase_liters_purchased, total_fuel_purchase_total_cost, total_expense_amount, 
				total_purchase_order_via_po_type, total_purchase_order_via_payment_status, total_purchase_order_via_delivery_status, total_purchase_order_via_order_status, 
				total_vendor_payment_via_payment_method, total_fuel_purchase_via_fuel_type, total_fuel_purchase_via_payment_status, total_fuel_purchase_via_delivery_status, 
				total_expense_via_category, total_purchase_orders_via_user, total_purchase_orders_via_user_approval, total_vendor_payment_via_user, total_vendor_payment_via_facilitator, 
				total_fuel_purchase_via_user, total_expense_via_user, purchaseOrderDateAnalysisDaily, purchaseOrderDateAnalysisWeekly, purchaseOrderDateAnalysisMonthly, 
				purchaseOrderDateAnalysisYearly, purchaseOrderExpectedDeliveryDateAnalysisDaily, purchaseOrderExpectedDeliveryDateAnalysisWeekly, purchaseOrderExpectedDeliveryDateAnalysisMonthly, 
				purchaseOrderExpectedDeliveryDateAnalysisYearly, purchaseOrderTotalAmountAnalysisDaily, purchaseOrderTotalAmountAnalysisWeekly, purchaseOrderTotalAmountAnalysisMonthly, 
				purchaseOrderTotalAmountAnalysisYearly, purchaseOrderAmountPaidAnalysisDaily, purchaseOrderAmountPaidAnalysisWeekly, purchaseOrderAmountPaidAnalysisMonthly, 
				purchaseOrderAmountPaidAnalysisYearly, purchaseOrderBalanceDueAnalysisDaily, purchaseOrderBalanceDueAnalysisWeekly, purchaseOrderBalanceDueAnalysisMonthly, 
				purchaseOrderBalanceDueAnalysisYearly, vendorPaymentDateAnalysisDaily, vendorPaymentDateAnalysisWeekly, vendorPaymentDateAnalysisMonthly, vendorPaymentDateAnalysisYearly, 
				fuelPurchaseDateAnalysisDaily, fuelPurchaseDateAnalysisWeekly, fuelPurchaseDateAnalysisMonthly, fuelPurchaseDateAnalysisYearly, expenseDateAnalysisDaily, expenseDateAnalysisWeekly, 
				expenseDateAnalysisMonthly, expenseDateAnalysisYearly
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getInventoryAndStockManagementStats(req: IGetAuthTypesRequest, res: Response) {
		const user_unique_id: string = req.USER_UNIQUE_ID;

		const queryParams: IPagination = req.query;

		const acl_details = await ACL.findOne({
			attributes: { exclude: ['id'] },
			where: {
				user_unique_id: user_unique_id,
				[Op.and]: [
					{ module_unique_id: queryParams.module_unique_id },
					{
						...(queryParams.sub_module_unique_id ? {
							sub_module_unique_id: queryParams.sub_module_unique_id
						} : {})
					}
				],
				acl_expiring: { 
					[Op.or]: [
						{ [Op.gte]: timestamp_str_alt(new Date().setHours(0, 0, 0, 0)) },
						{ [Op.eq]: null }
					]
				},
				status: default_status
			}
		});

		if (!acl_details) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized access to record" }, null);
		} 
		
		if (!acl_details.view) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized access to view record content" }, null);
		}

		try {
			const total_raw_materials = await RAW_MATERIAL.count();
			const total_raw_material_stock_logs = await RAW_MATERIAL_STOCK_LOG.count();
			const total_finished_goods = await FINISHED_GOOD.count();
			const total_finished_good_stock_logs = await FINISHED_GOOD_STOCK_LOG.count();
			
			const total_raw_material_stock_log_via_movement_type = await RAW_MATERIAL_STOCK_LOG.findAll({
				attributes: ["movement_type", [RAW_MATERIAL_STOCK_LOG.sequelize!.fn('count', RAW_MATERIAL_STOCK_LOG.sequelize!.col('id')), 'total_count']],
				group: "movement_type"
			});

			const total_raw_material_stock_log_via_source_module = await RAW_MATERIAL_STOCK_LOG.findAll({
				attributes: ["source_module", [RAW_MATERIAL_STOCK_LOG.sequelize!.fn('count', RAW_MATERIAL_STOCK_LOG.sequelize!.col('id')), 'total_count']],
				group: "source_module"
			});

			const total_finished_good_stock_log_via_movement_type = await FINISHED_GOOD_STOCK_LOG.findAll({
				attributes: ["movement_type", [FINISHED_GOOD_STOCK_LOG.sequelize!.fn('count', FINISHED_GOOD_STOCK_LOG.sequelize!.col('id')), 'total_count']],
				group: "movement_type"
			});

			const total_finished_good_stock_log_via_source_module = await FINISHED_GOOD_STOCK_LOG.findAll({
				attributes: ["source_module", [FINISHED_GOOD_STOCK_LOG.sequelize!.fn('count', FINISHED_GOOD_STOCK_LOG.sequelize!.col('id')), 'total_count']],
				group: "source_module"
			});
			
			const total_raw_material_via_user = await RAW_MATERIAL.findAll({
				attributes: ["User.firstname", "User.lastname", "User.unique_id", [RAW_MATERIAL.sequelize!.fn('count', RAW_MATERIAL.sequelize!.col('created_by')), 'total_count']],
				include: [
					{
						model: USER,
						as: "User",
						attributes: ['firstname', 'lastname', 'unique_id']
					},
				],
				subQuery: false,
				group: ["created_by", "User.firstname", "User.lastname", "User.unique_id"]
			});

			const total_finished_good_via_user = await FINISHED_GOOD.findAll({
				attributes: ["User.firstname", "User.lastname", "User.unique_id", [FINISHED_GOOD.sequelize!.fn('count', FINISHED_GOOD.sequelize!.col('created_by')), 'total_count']],
				include: [
					{
						model: USER,
						as: "User",
						attributes: ['firstname', 'lastname', 'unique_id']
					},
				],
				subQuery: false,
				group: ["created_by", "User.firstname", "User.lastname", "User.unique_id"]
			});
			
			return SuccessResponse(res, { unique_id: user_unique_id, text: "Inventory & Stock Management Stats Loaded" }, {
				total_raw_materials, total_raw_material_stock_logs, total_finished_goods, total_finished_good_stock_logs, total_raw_material_stock_log_via_movement_type, 
				total_raw_material_stock_log_via_source_module, total_finished_good_stock_log_via_movement_type, total_finished_good_stock_log_via_source_module, total_raw_material_via_user, 
				total_finished_good_via_user
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getProductionAndQualityControlStats(req: IGetAuthTypesRequest, res: Response) {
		const user_unique_id: string = req.USER_UNIQUE_ID;

		const queryParams: IPagination = req.query;

		const acl_details = await ACL.findOne({
			attributes: { exclude: ['id'] },
			where: {
				user_unique_id: user_unique_id,
				[Op.and]: [
					{ module_unique_id: queryParams.module_unique_id },
					{
						...(queryParams.sub_module_unique_id ? {
							sub_module_unique_id: queryParams.sub_module_unique_id
						} : {})
					}
				],
				acl_expiring: { 
					[Op.or]: [
						{ [Op.gte]: timestamp_str_alt(new Date().setHours(0, 0, 0, 0)) },
						{ [Op.eq]: null }
					]
				},
				status: default_status
			}
		});

		if (!acl_details) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized access to record" }, null);
		} 
		
		if (!acl_details.view) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized access to view record content" }, null);
		}

		try {
			const total_production_batches = await PRODUCTION_BATCH.count();
			const total_production_teams = await PRODUCTION_TEAM.count();
			const total_production_qc_logs = await PRODUCTION_QC_LOG.count();
			const total_production_fuel_logs = await PRODUCTION_FUEL_LOG.count();
			const total_machine_maintenance_logs = await MACHINE_MAINTENANCE_LOG.count();
			const total_stacking_logs = await STACKING_LOG.count();
			
			const total_production_batch_quantity_produced = await PRODUCTION_BATCH.sum("quantity_produced");
			const total_production_fuel_log_liters_dispensed = await PRODUCTION_FUEL_LOG.sum("liters_dispensed");
			const total_machine_maintenance_log_cost = await MACHINE_MAINTENANCE_LOG.sum("cost");
			const total_stacking_log_blocks_stacked = await STACKING_LOG.sum("blocks_stacked");
			const total_stacking_log_breakage_quantity = await STACKING_LOG.sum("breakage_quantity");
			const total_stacking_log_total_cost = await STACKING_LOG.sum("total_cost");
			
			const total_production_batch_via_shift = await PRODUCTION_BATCH.findAll({
				attributes: ["shift", [PRODUCTION_BATCH.sequelize!.fn('count', PRODUCTION_BATCH.sequelize!.col('id')), 'total_count']],
				group: "shift"
			});

			const total_production_fuel_log_via_fuel_type = await PRODUCTION_FUEL_LOG.findAll({
				attributes: ["fuel_type", [PRODUCTION_FUEL_LOG.sequelize!.fn('count', PRODUCTION_FUEL_LOG.sequelize!.col('id')), 'total_count'], [PRODUCTION_FUEL_LOG.sequelize!.fn('sum', PRODUCTION_FUEL_LOG.sequelize!.col('liters_dispensed')), 'liters_dispensed']],
				group: "fuel_type"
			});

			const total_production_batch_via_user = await PRODUCTION_BATCH.findAll({
				attributes: ["User.firstname", "User.lastname", "User.unique_id", [PRODUCTION_BATCH.sequelize!.fn('count', PRODUCTION_BATCH.sequelize!.col('created_by')), 'total_count'], [PRODUCTION_BATCH.sequelize!.fn('sum', PRODUCTION_BATCH.sequelize!.col('quantity_produced')), 'quantity_produced']],
				include: [
					{
						model: USER,
						as: "User",
						attributes: ['firstname', 'lastname', 'unique_id']
					},
				],
				subQuery: false,
				group: ["created_by", "User.firstname", "User.lastname", "User.unique_id"]
			});

			const total_production_batch_via_machine = await PRODUCTION_BATCH.findAll({
				attributes: ["Machine.name", "Machine.code", "Machine.reference", [PRODUCTION_BATCH.sequelize!.fn('count', PRODUCTION_BATCH.sequelize!.col('machine_unique_id')), 'total_count'], [PRODUCTION_BATCH.sequelize!.fn('sum', PRODUCTION_BATCH.sequelize!.col('quantity_produced')), 'quantity_produced']],
				include: [
					{
						model: MACHINE,
						as: "Machine",
						attributes: ['name', 'code', 'reference']
					},
				],
				subQuery: false,
				group: ["machine_unique_id"]
			});

			const total_production_batch_via_production_team = await PRODUCTION_BATCH.findAll({
				attributes: ["ProductionTeam.name", "ProductionTeam.is_active", "ProductionTeam.unique_id", [PRODUCTION_BATCH.sequelize!.fn('count', PRODUCTION_BATCH.sequelize!.col('production_team_unique_id')), 'total_count'], [PRODUCTION_BATCH.sequelize!.fn('sum', PRODUCTION_BATCH.sequelize!.col('quantity_produced')), 'quantity_produced']],
				include: [
					{
						model: PRODUCTION_TEAM,
						as: "ProductionTeam",
						attributes: ['name', 'is_active', 'unique_id']
					},
				],
				subQuery: false,
				group: ["production_team_unique_id"]
			});
			
			const total_production_batch_via_finished_good = await PRODUCTION_BATCH.findAll({
				attributes: ["FinishedGood.name", "FinishedGood.type", "FinishedGood.reference", [PRODUCTION_BATCH.sequelize!.fn('count', PRODUCTION_BATCH.sequelize!.col('finished_good_unique_id')), 'total_count'], [PRODUCTION_BATCH.sequelize!.fn('sum', PRODUCTION_BATCH.sequelize!.col('quantity_produced')), 'quantity_produced']],
				include: [
					{
						model: FINISHED_GOOD,
						as: "FinishedGood",
						attributes: ['name', 'type', 'reference']
					},
				],
				subQuery: false,
				group: ["finished_good_unique_id"]
			});

			const total_production_qc_log_via_user = await PRODUCTION_QC_LOG.findAll({
				attributes: ["User.firstname", "User.lastname", "User.unique_id", [PRODUCTION_QC_LOG.sequelize!.fn('count', PRODUCTION_QC_LOG.sequelize!.col('created_by')), 'total_count'], [PRODUCTION_QC_LOG.sequelize!.fn('sum', PRODUCTION_QC_LOG.sequelize!.col('defective_quantity')), 'defective_quantity']],
				include: [
					{
						model: USER,
						as: "User",
						attributes: ['firstname', 'lastname', 'unique_id']
					},
				],
				subQuery: false,
				group: ["created_by", "User.firstname", "User.lastname", "User.unique_id"]
			});

			const total_production_qc_log_via_machine = await PRODUCTION_QC_LOG.findAll({
				attributes: ["Machine.name", "Machine.code", "Machine.reference", [PRODUCTION_QC_LOG.sequelize!.fn('count', PRODUCTION_QC_LOG.sequelize!.col('machine_unique_id')), 'total_count'], [PRODUCTION_QC_LOG.sequelize!.fn('sum', PRODUCTION_QC_LOG.sequelize!.col('defective_quantity')), 'defective_quantity']],
				include: [
					{
						model: MACHINE,
						as: "Machine",
						attributes: ['name', 'code', 'reference']
					},
				],
				subQuery: false,
				group: ["machine_unique_id"]
			});

			const total_production_qc_log_via_production_team = await PRODUCTION_QC_LOG.findAll({
				attributes: ["ProductionTeam.name", "ProductionTeam.is_active", "ProductionTeam.unique_id", [PRODUCTION_QC_LOG.sequelize!.fn('count', PRODUCTION_QC_LOG.sequelize!.col('production_team_unique_id')), 'total_count'], [PRODUCTION_QC_LOG.sequelize!.fn('sum', PRODUCTION_QC_LOG.sequelize!.col('defective_quantity')), 'defective_quantity']],
				include: [
					{
						model: PRODUCTION_TEAM,
						as: "ProductionTeam",
						attributes: ['name', 'is_active', 'unique_id']
					},
				],
				subQuery: false,
				group: ["production_team_unique_id"]
			});

			const total_production_qc_log_via_production_batch = await PRODUCTION_QC_LOG.findAll({
				attributes: ["ProductionBatch.quantity_produced", "ProductionBatch.shift", "ProductionBatch.unique_id", [PRODUCTION_QC_LOG.sequelize!.fn('count', PRODUCTION_QC_LOG.sequelize!.col('production_batch_unique_id')), 'total_count'], [PRODUCTION_QC_LOG.sequelize!.fn('sum', PRODUCTION_QC_LOG.sequelize!.col('defective_quantity')), 'defective_quantity']],
				include: [
					{
						model: PRODUCTION_BATCH,
						as: "ProductionBatch",
						attributes: ['quantity_produced', 'shift', 'unique_id']
					},
				],
				subQuery: false,
				group: ["production_batch_unique_id"]
			});
			
			const total_production_qc_log_via_finished_good = await PRODUCTION_QC_LOG.findAll({
				attributes: ["FinishedGood.name", "FinishedGood.type", "FinishedGood.reference", [PRODUCTION_QC_LOG.sequelize!.fn('count', PRODUCTION_QC_LOG.sequelize!.col('finished_good_unique_id')), 'total_count'], [PRODUCTION_QC_LOG.sequelize!.fn('sum', PRODUCTION_QC_LOG.sequelize!.col('defective_quantity')), 'defective_quantity']],
				include: [
					{
						model: FINISHED_GOOD,
						as: "FinishedGood",
						attributes: ['name', 'type', 'reference']
					},
				],
				subQuery: false,
				group: ["finished_good_unique_id"]
			});

			const total_production_fuel_log_via_dispenser = await PRODUCTION_FUEL_LOG.findAll({
				attributes: ["User.firstname", "User.lastname", "User.unique_id", [PRODUCTION_FUEL_LOG.sequelize!.fn('count', PRODUCTION_FUEL_LOG.sequelize!.col('dispensed_by')), 'total_count'], [PRODUCTION_FUEL_LOG.sequelize!.fn('sum', PRODUCTION_FUEL_LOG.sequelize!.col('liters_dispensed')), 'liters_dispensed']],
				include: [
					{
						model: USER,
						as: "User",
						attributes: ['firstname', 'lastname', 'unique_id']
					},
				],
				subQuery: false,
				group: ["dispensed_by", "User.firstname", "User.lastname", "User.unique_id"]
			});

			const total_production_fuel_log_via_machine = await PRODUCTION_FUEL_LOG.findAll({
				attributes: ["Machine.name", "Machine.code", "Machine.reference", [PRODUCTION_FUEL_LOG.sequelize!.fn('count', PRODUCTION_FUEL_LOG.sequelize!.col('machine_unique_id')), 'total_count'], [PRODUCTION_FUEL_LOG.sequelize!.fn('sum', PRODUCTION_FUEL_LOG.sequelize!.col('liters_dispensed')), 'liters_dispensed']],
				include: [
					{
						model: MACHINE,
						as: "Machine",
						attributes: ['name', 'code', 'reference']
					},
				],
				subQuery: false,
				group: ["machine_unique_id"]
			});

			const total_machine_maintenance_log_via_user = await MACHINE_MAINTENANCE_LOG.findAll({
				attributes: ["User.firstname", "User.lastname", "User.unique_id", [MACHINE_MAINTENANCE_LOG.sequelize!.fn('count', MACHINE_MAINTENANCE_LOG.sequelize!.col('created_by')), 'total_count'], [MACHINE_MAINTENANCE_LOG.sequelize!.fn('sum', MACHINE_MAINTENANCE_LOG.sequelize!.col('cost')), 'cost']],
				include: [
					{
						model: USER,
						as: "User",
						attributes: ['firstname', 'lastname', 'unique_id']
					},
				],
				subQuery: false,
				group: ["created_by", "User.firstname", "User.lastname", "User.unique_id"]
			});

			const total_machine_maintenance_log_via_machine = await MACHINE_MAINTENANCE_LOG.findAll({
				attributes: ["Machine.name", "Machine.code", "Machine.reference", [MACHINE_MAINTENANCE_LOG.sequelize!.fn('count', MACHINE_MAINTENANCE_LOG.sequelize!.col('machine_unique_id')), 'total_count'], [MACHINE_MAINTENANCE_LOG.sequelize!.fn('sum', MACHINE_MAINTENANCE_LOG.sequelize!.col('cost')), 'cost']],
				include: [
					{
						model: MACHINE,
						as: "Machine",
						attributes: ['name', 'code', 'reference']
					},
				],
				subQuery: false,
				group: ["machine_unique_id"]
			});

			const total_machine_maintenance_log_via_vendor = await MACHINE_MAINTENANCE_LOG.findAll({
				attributes: ["Vendor.name", "Vendor.type", "Vendor.reference", [MACHINE_MAINTENANCE_LOG.sequelize!.fn('count', MACHINE_MAINTENANCE_LOG.sequelize!.col('vendor_unique_id')), 'total_count'], [MACHINE_MAINTENANCE_LOG.sequelize!.fn('sum', MACHINE_MAINTENANCE_LOG.sequelize!.col('cost')), 'cost']],
				include: [
					{
						model: VENDOR,
						as: "Vendor",
						attributes: ['name', 'type', 'reference']
					},
				],
				subQuery: false,
				group: ["vendor_unique_id"]
			});

			const total_stacking_log_via_user = await STACKING_LOG.findAll({
				attributes: ["User.firstname", "User.lastname", "User.unique_id", [STACKING_LOG.sequelize!.fn('count', STACKING_LOG.sequelize!.col('created_by')), 'total_count'], [STACKING_LOG.sequelize!.fn('sum', STACKING_LOG.sequelize!.col('blocks_stacked')), 'blocks_stacked'], [STACKING_LOG.sequelize!.fn('sum', STACKING_LOG.sequelize!.col('breakage_quantity')), 'breakage_quantity'], [STACKING_LOG.sequelize!.fn('sum', STACKING_LOG.sequelize!.col('total_cost')), 'total_cost']],
				include: [
					{
						model: USER,
						as: "User",
						attributes: ['firstname', 'lastname', 'unique_id']
					},
				],
				subQuery: false,
				group: ["created_by", "User.firstname", "User.lastname", "User.unique_id"]
			});
			
			const total_stacking_log_via_finished_good = await STACKING_LOG.findAll({
				attributes: ["FinishedGood.name", "FinishedGood.type", "FinishedGood.reference", [STACKING_LOG.sequelize!.fn('count', STACKING_LOG.sequelize!.col('finished_good_unique_id')), 'total_count'], [STACKING_LOG.sequelize!.fn('sum', STACKING_LOG.sequelize!.col('blocks_stacked')), 'blocks_stacked'], [STACKING_LOG.sequelize!.fn('sum', STACKING_LOG.sequelize!.col('breakage_quantity')), 'breakage_quantity'], [STACKING_LOG.sequelize!.fn('sum', STACKING_LOG.sequelize!.col('total_cost')), 'total_cost']],
				include: [
					{
						model: FINISHED_GOOD,
						as: "FinishedGood",
						attributes: ['name', 'type', 'reference']
					},
				],
				subQuery: false,
				group: ["finished_good_unique_id"]
			});

			const productionBatchProductionDateAnalysisDaily = await PRODUCTION_BATCH.findAll({
				attributes: [
					[PRODUCTION_BATCH.sequelize!.fn('date', PRODUCTION_BATCH.sequelize!.col('production_date')), 'date'],
					[PRODUCTION_BATCH.sequelize!.fn('count', PRODUCTION_BATCH.sequelize!.col('id')), 'total_count'],
					[PRODUCTION_BATCH.sequelize!.fn('sum', PRODUCTION_BATCH.sequelize!.col('quantity_produced')), 'quantity_produced']
				],
				group: ['date'],
				order: [['date', 'ASC']],
			});

			const productionBatchProductionDateAnalysisWeekly = await PRODUCTION_BATCH.findAll({
				attributes: [
					[PRODUCTION_BATCH.sequelize!.fn('DATE_FORMAT', PRODUCTION_BATCH.sequelize!.col('production_date'), '%Y-%u'), 'week'],
					[PRODUCTION_BATCH.sequelize!.fn('count', PRODUCTION_BATCH.sequelize!.col('id')), 'total_count'],
					[PRODUCTION_BATCH.sequelize!.fn('sum', PRODUCTION_BATCH.sequelize!.col('quantity_produced')), 'quantity_produced']
				],
				group: ['week'],
				order: [['week', 'ASC']],
			});

			const productionBatchProductionDateAnalysisMonthly = await PRODUCTION_BATCH.findAll({
				attributes: [
					[PRODUCTION_BATCH.sequelize!.fn('DATE_FORMAT', PRODUCTION_BATCH.sequelize!.col('production_date'), '%Y-%m'), 'month'],
					[PRODUCTION_BATCH.sequelize!.fn('count', PRODUCTION_BATCH.sequelize!.col('id')), 'total_count'],
					[PRODUCTION_BATCH.sequelize!.fn('sum', PRODUCTION_BATCH.sequelize!.col('quantity_produced')), 'quantity_produced']
				],
				group: ['month'],
				order: [['month', 'ASC']],
			});

			const productionBatchProductionDateAnalysisYearly = await PRODUCTION_BATCH.findAll({
				attributes: [
					[PRODUCTION_BATCH.sequelize!.fn('DATE_FORMAT', PRODUCTION_BATCH.sequelize!.col('production_date'), '%Y'), 'year'],
					[PRODUCTION_BATCH.sequelize!.fn('count', PRODUCTION_BATCH.sequelize!.col('id')), 'total_count'],
					[PRODUCTION_BATCH.sequelize!.fn('sum', PRODUCTION_BATCH.sequelize!.col('quantity_produced')), 'quantity_produced']
				],
				group: ['year'],
				order: [['year', 'ASC']],
			});

			const productionQcLogQcDateAnalysisDaily = await PRODUCTION_QC_LOG.findAll({
				attributes: [
					[PRODUCTION_QC_LOG.sequelize!.fn('date', PRODUCTION_QC_LOG.sequelize!.col('qc_date')), 'date'],
					[PRODUCTION_QC_LOG.sequelize!.fn('count', PRODUCTION_QC_LOG.sequelize!.col('id')), 'total_count'],
					[PRODUCTION_QC_LOG.sequelize!.fn('sum', PRODUCTION_QC_LOG.sequelize!.col('defective_quantity')), 'defective_quantity']
				],
				group: ['date'],
				order: [['date', 'ASC']],
			});

			const productionQcLogQcDateAnalysisWeekly = await PRODUCTION_QC_LOG.findAll({
				attributes: [
					[PRODUCTION_QC_LOG.sequelize!.fn('DATE_FORMAT', PRODUCTION_QC_LOG.sequelize!.col('qc_date'), '%Y-%u'), 'week'],
					[PRODUCTION_QC_LOG.sequelize!.fn('count', PRODUCTION_QC_LOG.sequelize!.col('id')), 'total_count'],
					[PRODUCTION_QC_LOG.sequelize!.fn('sum', PRODUCTION_QC_LOG.sequelize!.col('defective_quantity')), 'defective_quantity']
				],
				group: ['week'],
				order: [['week', 'ASC']],
			});

			const productionQcLogQcDateAnalysisMonthly = await PRODUCTION_QC_LOG.findAll({
				attributes: [
					[PRODUCTION_QC_LOG.sequelize!.fn('DATE_FORMAT', PRODUCTION_QC_LOG.sequelize!.col('qc_date'), '%Y-%m'), 'month'],
					[PRODUCTION_QC_LOG.sequelize!.fn('count', PRODUCTION_QC_LOG.sequelize!.col('id')), 'total_count'],
					[PRODUCTION_QC_LOG.sequelize!.fn('sum', PRODUCTION_QC_LOG.sequelize!.col('defective_quantity')), 'defective_quantity']
				],
				group: ['month'],
				order: [['month', 'ASC']],
			});

			const productionQcLogQcDateAnalysisYearly = await PRODUCTION_QC_LOG.findAll({
				attributes: [
					[PRODUCTION_QC_LOG.sequelize!.fn('DATE_FORMAT', PRODUCTION_QC_LOG.sequelize!.col('qc_date'), '%Y'), 'year'],
					[PRODUCTION_QC_LOG.sequelize!.fn('count', PRODUCTION_QC_LOG.sequelize!.col('id')), 'total_count'],
					[PRODUCTION_QC_LOG.sequelize!.fn('sum', PRODUCTION_QC_LOG.sequelize!.col('defective_quantity')), 'defective_quantity']
				],
				group: ['year'],
				order: [['year', 'ASC']],
			});

			const productionFuelLogDispensedDateAnalysisDaily = await PRODUCTION_FUEL_LOG.findAll({
				attributes: [
					[PRODUCTION_FUEL_LOG.sequelize!.fn('date', PRODUCTION_FUEL_LOG.sequelize!.col('dispensed_date')), 'date'],
					[PRODUCTION_FUEL_LOG.sequelize!.fn('count', PRODUCTION_FUEL_LOG.sequelize!.col('id')), 'total_count'],
					[PRODUCTION_FUEL_LOG.sequelize!.fn('sum', PRODUCTION_FUEL_LOG.sequelize!.col('liters_dispensed')), 'liters_dispensed']
				],
				group: ['date'],
				order: [['date', 'ASC']],
			});

			const productionFuelLogDispensedDateAnalysisWeekly = await PRODUCTION_FUEL_LOG.findAll({
				attributes: [
					[PRODUCTION_FUEL_LOG.sequelize!.fn('DATE_FORMAT', PRODUCTION_FUEL_LOG.sequelize!.col('dispensed_date'), '%Y-%u'), 'week'],
					[PRODUCTION_FUEL_LOG.sequelize!.fn('count', PRODUCTION_FUEL_LOG.sequelize!.col('id')), 'total_count'],
					[PRODUCTION_FUEL_LOG.sequelize!.fn('sum', PRODUCTION_FUEL_LOG.sequelize!.col('liters_dispensed')), 'liters_dispensed']
				],
				group: ['week'],
				order: [['week', 'ASC']],
			});

			const productionFuelLogDispensedDateAnalysisMonthly = await PRODUCTION_FUEL_LOG.findAll({
				attributes: [
					[PRODUCTION_FUEL_LOG.sequelize!.fn('DATE_FORMAT', PRODUCTION_FUEL_LOG.sequelize!.col('dispensed_date'), '%Y-%m'), 'month'],
					[PRODUCTION_FUEL_LOG.sequelize!.fn('count', PRODUCTION_FUEL_LOG.sequelize!.col('id')), 'total_count'],
					[PRODUCTION_FUEL_LOG.sequelize!.fn('sum', PRODUCTION_FUEL_LOG.sequelize!.col('liters_dispensed')), 'liters_dispensed']
				],
				group: ['month'],
				order: [['month', 'ASC']],
			});

			const productionFuelLogDispensedDateAnalysisYearly = await PRODUCTION_FUEL_LOG.findAll({
				attributes: [
					[PRODUCTION_FUEL_LOG.sequelize!.fn('DATE_FORMAT', PRODUCTION_FUEL_LOG.sequelize!.col('dispensed_date'), '%Y'), 'year'],
					[PRODUCTION_FUEL_LOG.sequelize!.fn('count', PRODUCTION_FUEL_LOG.sequelize!.col('id')), 'total_count'],
					[PRODUCTION_FUEL_LOG.sequelize!.fn('sum', PRODUCTION_FUEL_LOG.sequelize!.col('liters_dispensed')), 'liters_dispensed']
				],
				group: ['year'],
				order: [['year', 'ASC']],
			});

			const machineMaintenanceLogServiceDateAnalysisDaily = await MACHINE_MAINTENANCE_LOG.findAll({
				attributes: [
					[MACHINE_MAINTENANCE_LOG.sequelize!.fn('date', MACHINE_MAINTENANCE_LOG.sequelize!.col('service_date')), 'date'],
					[MACHINE_MAINTENANCE_LOG.sequelize!.fn('count', MACHINE_MAINTENANCE_LOG.sequelize!.col('id')), 'total_count'],
					[MACHINE_MAINTENANCE_LOG.sequelize!.fn('sum', MACHINE_MAINTENANCE_LOG.sequelize!.col('cost')), 'cost']
				],
				group: ['date'],
				order: [['date', 'ASC']],
			});

			const machineMaintenanceLogServiceDateAnalysisWeekly = await MACHINE_MAINTENANCE_LOG.findAll({
				attributes: [
					[MACHINE_MAINTENANCE_LOG.sequelize!.fn('DATE_FORMAT', MACHINE_MAINTENANCE_LOG.sequelize!.col('service_date'), '%Y-%u'), 'week'],
					[MACHINE_MAINTENANCE_LOG.sequelize!.fn('count', MACHINE_MAINTENANCE_LOG.sequelize!.col('id')), 'total_count'],
					[MACHINE_MAINTENANCE_LOG.sequelize!.fn('sum', MACHINE_MAINTENANCE_LOG.sequelize!.col('cost')), 'cost']
				],
				group: ['week'],
				order: [['week', 'ASC']],
			});

			const machineMaintenanceLogServiceDateAnalysisMonthly = await MACHINE_MAINTENANCE_LOG.findAll({
				attributes: [
					[MACHINE_MAINTENANCE_LOG.sequelize!.fn('DATE_FORMAT', MACHINE_MAINTENANCE_LOG.sequelize!.col('service_date'), '%Y-%m'), 'month'],
					[MACHINE_MAINTENANCE_LOG.sequelize!.fn('count', MACHINE_MAINTENANCE_LOG.sequelize!.col('id')), 'total_count'],
					[MACHINE_MAINTENANCE_LOG.sequelize!.fn('sum', MACHINE_MAINTENANCE_LOG.sequelize!.col('cost')), 'cost']
				],
				group: ['month'],
				order: [['month', 'ASC']],
			});

			const machineMaintenanceLogServiceDateAnalysisYearly = await MACHINE_MAINTENANCE_LOG.findAll({
				attributes: [
					[MACHINE_MAINTENANCE_LOG.sequelize!.fn('DATE_FORMAT', MACHINE_MAINTENANCE_LOG.sequelize!.col('service_date'), '%Y'), 'year'],
					[MACHINE_MAINTENANCE_LOG.sequelize!.fn('count', MACHINE_MAINTENANCE_LOG.sequelize!.col('id')), 'total_count'],
					[MACHINE_MAINTENANCE_LOG.sequelize!.fn('sum', MACHINE_MAINTENANCE_LOG.sequelize!.col('cost')), 'cost']
				],
				group: ['year'],
				order: [['year', 'ASC']],
			});

			const machineMaintenanceLogNextServiceDateAnalysisDaily = await MACHINE_MAINTENANCE_LOG.findAll({
				attributes: [
					[MACHINE_MAINTENANCE_LOG.sequelize!.fn('date', MACHINE_MAINTENANCE_LOG.sequelize!.col('next_service_date')), 'date'],
					[MACHINE_MAINTENANCE_LOG.sequelize!.fn('count', MACHINE_MAINTENANCE_LOG.sequelize!.col('id')), 'total_count'],
					[MACHINE_MAINTENANCE_LOG.sequelize!.fn('sum', MACHINE_MAINTENANCE_LOG.sequelize!.col('cost')), 'cost']
				],
				group: ['date'],
				order: [['date', 'ASC']],
			});

			const machineMaintenanceLogNextServiceDateAnalysisWeekly = await MACHINE_MAINTENANCE_LOG.findAll({
				attributes: [
					[MACHINE_MAINTENANCE_LOG.sequelize!.fn('DATE_FORMAT', MACHINE_MAINTENANCE_LOG.sequelize!.col('next_service_date'), '%Y-%u'), 'week'],
					[MACHINE_MAINTENANCE_LOG.sequelize!.fn('count', MACHINE_MAINTENANCE_LOG.sequelize!.col('id')), 'total_count'],
					[MACHINE_MAINTENANCE_LOG.sequelize!.fn('sum', MACHINE_MAINTENANCE_LOG.sequelize!.col('cost')), 'cost']
				],
				group: ['week'],
				order: [['week', 'ASC']],
			});

			const machineMaintenanceLogNextServiceDateAnalysisMonthly = await MACHINE_MAINTENANCE_LOG.findAll({
				attributes: [
					[MACHINE_MAINTENANCE_LOG.sequelize!.fn('DATE_FORMAT', MACHINE_MAINTENANCE_LOG.sequelize!.col('next_service_date'), '%Y-%m'), 'month'],
					[MACHINE_MAINTENANCE_LOG.sequelize!.fn('count', MACHINE_MAINTENANCE_LOG.sequelize!.col('id')), 'total_count'],
					[MACHINE_MAINTENANCE_LOG.sequelize!.fn('sum', MACHINE_MAINTENANCE_LOG.sequelize!.col('cost')), 'cost']
				],
				group: ['month'],
				order: [['month', 'ASC']],
			});

			const machineMaintenanceLogNextServiceDateAnalysisYearly = await MACHINE_MAINTENANCE_LOG.findAll({
				attributes: [
					[MACHINE_MAINTENANCE_LOG.sequelize!.fn('DATE_FORMAT', MACHINE_MAINTENANCE_LOG.sequelize!.col('next_service_date'), '%Y'), 'year'],
					[MACHINE_MAINTENANCE_LOG.sequelize!.fn('count', MACHINE_MAINTENANCE_LOG.sequelize!.col('id')), 'total_count'],
					[MACHINE_MAINTENANCE_LOG.sequelize!.fn('sum', MACHINE_MAINTENANCE_LOG.sequelize!.col('cost')), 'cost']
				],
				group: ['year'],
				order: [['year', 'ASC']],
			});

			const stackingLogStackDateAnalysisDaily = await STACKING_LOG.findAll({
				attributes: [
					[STACKING_LOG.sequelize!.fn('date', STACKING_LOG.sequelize!.col('stack_date')), 'date'],
					[STACKING_LOG.sequelize!.fn('count', STACKING_LOG.sequelize!.col('id')), 'total_count'],
					[STACKING_LOG.sequelize!.fn('sum', STACKING_LOG.sequelize!.col('blocks_stacked')), 'blocks_stacked'], 
					[STACKING_LOG.sequelize!.fn('sum', STACKING_LOG.sequelize!.col('breakage_quantity')), 'breakage_quantity'], 
					[STACKING_LOG.sequelize!.fn('sum', STACKING_LOG.sequelize!.col('total_cost')), 'total_cost']
				],
				group: ['date'],
				order: [['date', 'ASC']],
			});

			const stackingLogStackDateAnalysisWeekly = await STACKING_LOG.findAll({
				attributes: [
					[STACKING_LOG.sequelize!.fn('DATE_FORMAT', STACKING_LOG.sequelize!.col('stack_date'), '%Y-%u'), 'week'],
					[STACKING_LOG.sequelize!.fn('count', STACKING_LOG.sequelize!.col('id')), 'total_count'],
					[STACKING_LOG.sequelize!.fn('sum', STACKING_LOG.sequelize!.col('blocks_stacked')), 'blocks_stacked'], 
					[STACKING_LOG.sequelize!.fn('sum', STACKING_LOG.sequelize!.col('breakage_quantity')), 'breakage_quantity'], 
					[STACKING_LOG.sequelize!.fn('sum', STACKING_LOG.sequelize!.col('total_cost')), 'total_cost']
				],
				group: ['week'],
				order: [['week', 'ASC']],
			});

			const stackingLogStackDateAnalysisMonthly = await STACKING_LOG.findAll({
				attributes: [
					[STACKING_LOG.sequelize!.fn('DATE_FORMAT', STACKING_LOG.sequelize!.col('stack_date'), '%Y-%m'), 'month'],
					[STACKING_LOG.sequelize!.fn('count', STACKING_LOG.sequelize!.col('id')), 'total_count'],
					[STACKING_LOG.sequelize!.fn('sum', STACKING_LOG.sequelize!.col('blocks_stacked')), 'blocks_stacked'], 
					[STACKING_LOG.sequelize!.fn('sum', STACKING_LOG.sequelize!.col('breakage_quantity')), 'breakage_quantity'], 
					[STACKING_LOG.sequelize!.fn('sum', STACKING_LOG.sequelize!.col('total_cost')), 'total_cost']
				],
				group: ['month'],
				order: [['month', 'ASC']],
			});

			const stackingLogStackDateAnalysisYearly = await STACKING_LOG.findAll({
				attributes: [
					[STACKING_LOG.sequelize!.fn('DATE_FORMAT', STACKING_LOG.sequelize!.col('stack_date'), '%Y'), 'year'],
					[STACKING_LOG.sequelize!.fn('count', STACKING_LOG.sequelize!.col('id')), 'total_count'],
					[STACKING_LOG.sequelize!.fn('sum', STACKING_LOG.sequelize!.col('blocks_stacked')), 'blocks_stacked'], 
					[STACKING_LOG.sequelize!.fn('sum', STACKING_LOG.sequelize!.col('breakage_quantity')), 'breakage_quantity'], 
					[STACKING_LOG.sequelize!.fn('sum', STACKING_LOG.sequelize!.col('total_cost')), 'total_cost']
				],
				group: ['year'],
				order: [['year', 'ASC']],
			});

			return SuccessResponse(res, { unique_id: user_unique_id, text: "Production & Quality Control Stats Loaded" }, {
				total_production_batches, total_production_teams, total_production_qc_logs, total_production_fuel_logs, total_machine_maintenance_logs, total_stacking_logs, 
				total_production_batch_quantity_produced, total_production_fuel_log_liters_dispensed, total_machine_maintenance_log_cost, total_stacking_log_blocks_stacked, 
				total_stacking_log_breakage_quantity, total_stacking_log_total_cost, total_production_batch_via_shift, total_production_fuel_log_via_fuel_type, 
				total_production_batch_via_user, total_production_batch_via_machine, total_production_batch_via_production_team, total_production_batch_via_finished_good, 
				total_production_qc_log_via_user, total_production_qc_log_via_machine, total_production_qc_log_via_production_team, total_production_qc_log_via_production_batch, 
				total_production_qc_log_via_finished_good, total_production_fuel_log_via_dispenser, total_production_fuel_log_via_machine, total_machine_maintenance_log_via_user, 
				total_machine_maintenance_log_via_machine, total_machine_maintenance_log_via_vendor, total_stacking_log_via_user, total_stacking_log_via_finished_good, 
				productionBatchProductionDateAnalysisDaily, productionBatchProductionDateAnalysisWeekly, productionBatchProductionDateAnalysisMonthly, productionBatchProductionDateAnalysisYearly, 
				productionQcLogQcDateAnalysisDaily, productionQcLogQcDateAnalysisWeekly, productionQcLogQcDateAnalysisMonthly, productionQcLogQcDateAnalysisYearly, productionFuelLogDispensedDateAnalysisDaily, 
				productionFuelLogDispensedDateAnalysisWeekly, productionFuelLogDispensedDateAnalysisMonthly, productionFuelLogDispensedDateAnalysisYearly, machineMaintenanceLogServiceDateAnalysisDaily, 
				machineMaintenanceLogServiceDateAnalysisWeekly, machineMaintenanceLogServiceDateAnalysisMonthly, machineMaintenanceLogServiceDateAnalysisYearly, machineMaintenanceLogNextServiceDateAnalysisDaily, 
				machineMaintenanceLogNextServiceDateAnalysisWeekly, machineMaintenanceLogNextServiceDateAnalysisMonthly, machineMaintenanceLogNextServiceDateAnalysisYearly, stackingLogStackDateAnalysisDaily, 
				stackingLogStackDateAnalysisWeekly, stackingLogStackDateAnalysisMonthly, stackingLogStackDateAnalysisYearly
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getLogisticsAndSupplyChainStats(req: IGetAuthTypesRequest, res: Response) {
		const user_unique_id: string = req.USER_UNIQUE_ID;

		const queryParams: IPagination = req.query;

		const acl_details = await ACL.findOne({
			attributes: { exclude: ['id'] },
			where: {
				user_unique_id: user_unique_id,
				[Op.and]: [
					{ module_unique_id: queryParams.module_unique_id },
					{
						...(queryParams.sub_module_unique_id ? {
							sub_module_unique_id: queryParams.sub_module_unique_id
						} : {})
					}
				],
				acl_expiring: { 
					[Op.or]: [
						{ [Op.gte]: timestamp_str_alt(new Date().setHours(0, 0, 0, 0)) },
						{ [Op.eq]: null }
					]
				},
				status: default_status
			}
		});

		if (!acl_details) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized access to record" }, null);
		} 
		
		if (!acl_details.view) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized access to view record content" }, null);
		}

		try {
			const total_delivery_assignments = await DELIVERY_ASSIGNMENT.count();
			const total_supply_logs = await SUPPLY_LOG.count();
			const total_logistics_fuel_logs = await LOGISTICS_FUEL_LOG.count();

			const total_supply_log_blocks_loaded = await SUPPLY_LOG.sum("blocks_loaded");
			const total_supply_log_blocks_dropped = await SUPPLY_LOG.sum("blocks_dropped");
			const total_supply_log_blocks_returned = await SUPPLY_LOG.sum("blocks_returned");
			const total_supply_log_breakage_quantity = await SUPPLY_LOG.sum("breakage_quantity");
			const total_logistics_fuel_log_liters_dispensed = await LOGISTICS_FUEL_LOG.sum("liters_dispensed");
			const total_logistics_fuel_log_expected_trips = await LOGISTICS_FUEL_LOG.sum("expected_trips");
			const total_logistics_fuel_log_actual_trips = await LOGISTICS_FUEL_LOG.sum("actual_trips");

			const total_delivery_assignment_via_auto_assigned = await DELIVERY_ASSIGNMENT.findAll({
				attributes: ["auto_assigned", [DELIVERY_ASSIGNMENT.sequelize!.fn('count', DELIVERY_ASSIGNMENT.sequelize!.col('id')), 'total_count']],
				group: "auto_assigned"
			});

			const total_delivery_assignment_via_assignment_status = await DELIVERY_ASSIGNMENT.findAll({
				attributes: ["assignment_status", [DELIVERY_ASSIGNMENT.sequelize!.fn('count', DELIVERY_ASSIGNMENT.sequelize!.col('id')), 'total_count']],
				group: "assignment_status"
			});

			const total_logistics_fuel_log_via_fuel_type = await LOGISTICS_FUEL_LOG.findAll({
				attributes: ["fuel_type", [LOGISTICS_FUEL_LOG.sequelize!.fn('count', LOGISTICS_FUEL_LOG.sequelize!.col('id')), 'total_count'], [LOGISTICS_FUEL_LOG.sequelize!.fn('sum', LOGISTICS_FUEL_LOG.sequelize!.col('liters_dispensed')), 'liters_dispensed'], [LOGISTICS_FUEL_LOG.sequelize!.fn('sum', LOGISTICS_FUEL_LOG.sequelize!.col('expected_trips')), 'expected_trips'], [LOGISTICS_FUEL_LOG.sequelize!.fn('sum', LOGISTICS_FUEL_LOG.sequelize!.col('actual_trips')), 'actual_trips']],
				group: "fuel_type"
			});

			const total_delivery_assignment_via_vehicle = await DELIVERY_ASSIGNMENT.findAll({
				attributes: ["Vehicle.type", "Vehicle.code", "Vehicle.plate_number", "Vehicle.reference", [DELIVERY_ASSIGNMENT.sequelize!.fn('count', DELIVERY_ASSIGNMENT.sequelize!.col('vehicle_unique_id')), 'total_count']],
				include: [
					{
						model: VEHICLE,
						as: "Vehicle",
						attributes: ['type', 'code', 'plate_number', 'reference']
					},
				],
				subQuery: false,
				group: ["vehicle_unique_id"]
			});

			const total_delivery_assignment_via_user = await DELIVERY_ASSIGNMENT.findAll({
				attributes: ["User.firstname", "User.lastname", "User.unique_id", [DELIVERY_ASSIGNMENT.sequelize!.fn('count', DELIVERY_ASSIGNMENT.sequelize!.col('updated_by')), 'total_count']],
				include: [
					{
						model: USER,
						as: "User",
						attributes: ['firstname', 'lastname', 'unique_id']
					},
				],
				subQuery: false,
				group: ["updated_by", "User.firstname", "User.lastname", "User.unique_id"]
			});

			const total_supply_log_via_user = await SUPPLY_LOG.findAll({
				attributes: ["User.firstname", "User.lastname", "User.unique_id", [SUPPLY_LOG.sequelize!.fn('count', SUPPLY_LOG.sequelize!.col('created_by')), 'total_count'], [SUPPLY_LOG.sequelize!.fn('sum', SUPPLY_LOG.sequelize!.col('blocks_loaded')), 'blocks_loaded'], [SUPPLY_LOG.sequelize!.fn('sum', SUPPLY_LOG.sequelize!.col('blocks_dropped')), 'blocks_dropped'], [SUPPLY_LOG.sequelize!.fn('sum', SUPPLY_LOG.sequelize!.col('blocks_returned')), 'blocks_returned'], [SUPPLY_LOG.sequelize!.fn('sum', SUPPLY_LOG.sequelize!.col('breakage_quantity')), 'breakage_quantity'],],
				include: [
					{
						model: USER,
						as: "User",
						attributes: ['firstname', 'lastname', 'unique_id']
					},
				],
				subQuery: false,
				group: ["created_by", "User.firstname", "User.lastname", "User.unique_id"]
			});

			const total_logistics_fuel_log_via_user = await LOGISTICS_FUEL_LOG.findAll({
				attributes: ["User.firstname", "User.lastname", "User.unique_id", [LOGISTICS_FUEL_LOG.sequelize!.fn('count', LOGISTICS_FUEL_LOG.sequelize!.col('created_by')), 'total_count'], [LOGISTICS_FUEL_LOG.sequelize!.fn('sum', LOGISTICS_FUEL_LOG.sequelize!.col('liters_dispensed')), 'liters_dispensed'], [LOGISTICS_FUEL_LOG.sequelize!.fn('sum', LOGISTICS_FUEL_LOG.sequelize!.col('expected_trips')), 'expected_trips'], [LOGISTICS_FUEL_LOG.sequelize!.fn('sum', LOGISTICS_FUEL_LOG.sequelize!.col('actual_trips')), 'actual_trips']],
				include: [
					{
						model: USER,
						as: "User",
						attributes: ['firstname', 'lastname', 'unique_id']
					},
				],
				subQuery: false,
				group: ["created_by", "User.firstname", "User.lastname", "User.unique_id"]
			});

			const total_logistics_fuel_log_via_vehicle = await LOGISTICS_FUEL_LOG.findAll({
				attributes: ["Vehicle.type", "Vehicle.code", "Vehicle.plate_number", "Vehicle.reference", [LOGISTICS_FUEL_LOG.sequelize!.fn('count', LOGISTICS_FUEL_LOG.sequelize!.col('vehicle_unique_id')), 'total_count'], [LOGISTICS_FUEL_LOG.sequelize!.fn('sum', LOGISTICS_FUEL_LOG.sequelize!.col('liters_dispensed')), 'liters_dispensed'], [LOGISTICS_FUEL_LOG.sequelize!.fn('sum', LOGISTICS_FUEL_LOG.sequelize!.col('expected_trips')), 'expected_trips'], [LOGISTICS_FUEL_LOG.sequelize!.fn('sum', LOGISTICS_FUEL_LOG.sequelize!.col('actual_trips')), 'actual_trips']],
				include: [
					{
						model: VEHICLE,
						as: "Vehicle",
						attributes: ['type', 'code', 'plate_number', 'reference']
					},
				],
				subQuery: false,
				group: ["vehicle_unique_id"]
			});

			const deliveryAssignmentScheduledDateAnalysisDaily = await DELIVERY_ASSIGNMENT.findAll({
				attributes: [
					[DELIVERY_ASSIGNMENT.sequelize!.fn('date', DELIVERY_ASSIGNMENT.sequelize!.col('scheduled_date')), 'date'],
					[DELIVERY_ASSIGNMENT.sequelize!.fn('count', DELIVERY_ASSIGNMENT.sequelize!.col('id')), 'total_count'],
				],
				group: ['date'],
				order: [['date', 'ASC']],
			});

			const deliveryAssignmentScheduledDateAnalysisWeekly = await DELIVERY_ASSIGNMENT.findAll({
				attributes: [
					[DELIVERY_ASSIGNMENT.sequelize!.fn('DATE_FORMAT', DELIVERY_ASSIGNMENT.sequelize!.col('scheduled_date'), '%Y-%u'), 'week'],
					[DELIVERY_ASSIGNMENT.sequelize!.fn('count', DELIVERY_ASSIGNMENT.sequelize!.col('id')), 'total_count'],
				],
				group: ['week'],
				order: [['week', 'ASC']],
			});

			const deliveryAssignmentScheduledDateAnalysisMonthly = await DELIVERY_ASSIGNMENT.findAll({
				attributes: [
					[DELIVERY_ASSIGNMENT.sequelize!.fn('DATE_FORMAT', DELIVERY_ASSIGNMENT.sequelize!.col('scheduled_date'), '%Y-%m'), 'month'],
					[DELIVERY_ASSIGNMENT.sequelize!.fn('count', DELIVERY_ASSIGNMENT.sequelize!.col('id')), 'total_count'],
				],
				group: ['month'],
				order: [['month', 'ASC']],
			});

			const deliveryAssignmentScheduledDateAnalysisYearly = await DELIVERY_ASSIGNMENT.findAll({
				attributes: [
					[DELIVERY_ASSIGNMENT.sequelize!.fn('DATE_FORMAT', DELIVERY_ASSIGNMENT.sequelize!.col('scheduled_date'), '%Y'), 'year'],
					[DELIVERY_ASSIGNMENT.sequelize!.fn('count', DELIVERY_ASSIGNMENT.sequelize!.col('id')), 'total_count'],
				],
				group: ['year'],
				order: [['year', 'ASC']],
			});
			
			const deliveryAssignmentStartedAtDateAnalysisDaily = await DELIVERY_ASSIGNMENT.findAll({
				attributes: [
					[DELIVERY_ASSIGNMENT.sequelize!.fn('date', DELIVERY_ASSIGNMENT.sequelize!.col('started_at')), 'date'],
					[DELIVERY_ASSIGNMENT.sequelize!.fn('count', DELIVERY_ASSIGNMENT.sequelize!.col('id')), 'total_count'],
				],
				group: ['date'],
				order: [['date', 'ASC']],
			});

			const deliveryAssignmentStartedAtDateAnalysisWeekly = await DELIVERY_ASSIGNMENT.findAll({
				attributes: [
					[DELIVERY_ASSIGNMENT.sequelize!.fn('DATE_FORMAT', DELIVERY_ASSIGNMENT.sequelize!.col('started_at'), '%Y-%u'), 'week'],
					[DELIVERY_ASSIGNMENT.sequelize!.fn('count', DELIVERY_ASSIGNMENT.sequelize!.col('id')), 'total_count'],
				],
				group: ['week'],
				order: [['week', 'ASC']],
			});

			const deliveryAssignmentStartedAtDateAnalysisMonthly = await DELIVERY_ASSIGNMENT.findAll({
				attributes: [
					[DELIVERY_ASSIGNMENT.sequelize!.fn('DATE_FORMAT', DELIVERY_ASSIGNMENT.sequelize!.col('started_at'), '%Y-%m'), 'month'],
					[DELIVERY_ASSIGNMENT.sequelize!.fn('count', DELIVERY_ASSIGNMENT.sequelize!.col('id')), 'total_count'],
				],
				group: ['month'],
				order: [['month', 'ASC']],
			});

			const deliveryAssignmentStartedAtDateAnalysisYearly = await DELIVERY_ASSIGNMENT.findAll({
				attributes: [
					[DELIVERY_ASSIGNMENT.sequelize!.fn('DATE_FORMAT', DELIVERY_ASSIGNMENT.sequelize!.col('started_at'), '%Y'), 'year'],
					[DELIVERY_ASSIGNMENT.sequelize!.fn('count', DELIVERY_ASSIGNMENT.sequelize!.col('id')), 'total_count'],
				],
				group: ['year'],
				order: [['year', 'ASC']],
			});

			const deliveryAssignmentCompletedAtDateAnalysisDaily = await DELIVERY_ASSIGNMENT.findAll({
				attributes: [
					[DELIVERY_ASSIGNMENT.sequelize!.fn('date', DELIVERY_ASSIGNMENT.sequelize!.col('completed_at')), 'date'],
					[DELIVERY_ASSIGNMENT.sequelize!.fn('count', DELIVERY_ASSIGNMENT.sequelize!.col('id')), 'total_count'],
				],
				group: ['date'],
				order: [['date', 'ASC']],
			});

			const deliveryAssignmentCompletedAtDateAnalysisWeekly = await DELIVERY_ASSIGNMENT.findAll({
				attributes: [
					[DELIVERY_ASSIGNMENT.sequelize!.fn('DATE_FORMAT', DELIVERY_ASSIGNMENT.sequelize!.col('completed_at'), '%Y-%u'), 'week'],
					[DELIVERY_ASSIGNMENT.sequelize!.fn('count', DELIVERY_ASSIGNMENT.sequelize!.col('id')), 'total_count'],
				],
				group: ['week'],
				order: [['week', 'ASC']],
			});

			const deliveryAssignmentCompletedAtDateAnalysisMonthly = await DELIVERY_ASSIGNMENT.findAll({
				attributes: [
					[DELIVERY_ASSIGNMENT.sequelize!.fn('DATE_FORMAT', DELIVERY_ASSIGNMENT.sequelize!.col('completed_at'), '%Y-%m'), 'month'],
					[DELIVERY_ASSIGNMENT.sequelize!.fn('count', DELIVERY_ASSIGNMENT.sequelize!.col('id')), 'total_count'],
				],
				group: ['month'],
				order: [['month', 'ASC']],
			});

			const deliveryAssignmentCompletedAtDateAnalysisYearly = await DELIVERY_ASSIGNMENT.findAll({
				attributes: [
					[DELIVERY_ASSIGNMENT.sequelize!.fn('DATE_FORMAT', DELIVERY_ASSIGNMENT.sequelize!.col('completed_at'), '%Y'), 'year'],
					[DELIVERY_ASSIGNMENT.sequelize!.fn('count', DELIVERY_ASSIGNMENT.sequelize!.col('id')), 'total_count'],
				],
				group: ['year'],
				order: [['year', 'ASC']],
			});

			const supplyLogDeliveryDateAnalysisDaily = await SUPPLY_LOG.findAll({
				attributes: [
					[SUPPLY_LOG.sequelize!.fn('date', SUPPLY_LOG.sequelize!.col('delivery_date')), 'date'],
					[SUPPLY_LOG.sequelize!.fn('count', SUPPLY_LOG.sequelize!.col('id')), 'total_count'],
					[SUPPLY_LOG.sequelize!.fn('sum', SUPPLY_LOG.sequelize!.col('blocks_loaded')), 'blocks_loaded'],
					[SUPPLY_LOG.sequelize!.fn('sum', SUPPLY_LOG.sequelize!.col('blocks_dropped')), 'blocks_dropped'],
					[SUPPLY_LOG.sequelize!.fn('sum', SUPPLY_LOG.sequelize!.col('blocks_returned')), 'blocks_returned'],
					[SUPPLY_LOG.sequelize!.fn('sum', SUPPLY_LOG.sequelize!.col('breakage_quantity')), 'breakage_quantity'],
				],
				group: ['date'],
				order: [['date', 'ASC']],
			});

			const supplyLogDeliveryDateAnalysisWeekly = await SUPPLY_LOG.findAll({
				attributes: [
					[SUPPLY_LOG.sequelize!.fn('DATE_FORMAT', SUPPLY_LOG.sequelize!.col('delivery_date'), '%Y-%u'), 'week'],
					[SUPPLY_LOG.sequelize!.fn('count', SUPPLY_LOG.sequelize!.col('id')), 'total_count'],
					[SUPPLY_LOG.sequelize!.fn('sum', SUPPLY_LOG.sequelize!.col('blocks_loaded')), 'blocks_loaded'],
					[SUPPLY_LOG.sequelize!.fn('sum', SUPPLY_LOG.sequelize!.col('blocks_dropped')), 'blocks_dropped'],
					[SUPPLY_LOG.sequelize!.fn('sum', SUPPLY_LOG.sequelize!.col('blocks_returned')), 'blocks_returned'],
					[SUPPLY_LOG.sequelize!.fn('sum', SUPPLY_LOG.sequelize!.col('breakage_quantity')), 'breakage_quantity'],
				],
				group: ['week'],
				order: [['week', 'ASC']],
			});

			const supplyLogDeliveryDateAnalysisMonthly = await SUPPLY_LOG.findAll({
				attributes: [
					[SUPPLY_LOG.sequelize!.fn('DATE_FORMAT', SUPPLY_LOG.sequelize!.col('delivery_date'), '%Y-%m'), 'month'],
					[SUPPLY_LOG.sequelize!.fn('count', SUPPLY_LOG.sequelize!.col('id')), 'total_count'],
					[SUPPLY_LOG.sequelize!.fn('sum', SUPPLY_LOG.sequelize!.col('blocks_loaded')), 'blocks_loaded'],
					[SUPPLY_LOG.sequelize!.fn('sum', SUPPLY_LOG.sequelize!.col('blocks_dropped')), 'blocks_dropped'],
					[SUPPLY_LOG.sequelize!.fn('sum', SUPPLY_LOG.sequelize!.col('blocks_returned')), 'blocks_returned'],
					[SUPPLY_LOG.sequelize!.fn('sum', SUPPLY_LOG.sequelize!.col('breakage_quantity')), 'breakage_quantity'],
				],
				group: ['month'],
				order: [['month', 'ASC']],
			});

			const supplyLogDeliveryDateAnalysisYearly = await SUPPLY_LOG.findAll({
				attributes: [
					[SUPPLY_LOG.sequelize!.fn('DATE_FORMAT', SUPPLY_LOG.sequelize!.col('delivery_date'), '%Y'), 'year'],
					[SUPPLY_LOG.sequelize!.fn('count', SUPPLY_LOG.sequelize!.col('id')), 'total_count'],
					[SUPPLY_LOG.sequelize!.fn('sum', SUPPLY_LOG.sequelize!.col('blocks_loaded')), 'blocks_loaded'],
					[SUPPLY_LOG.sequelize!.fn('sum', SUPPLY_LOG.sequelize!.col('blocks_dropped')), 'blocks_dropped'],
					[SUPPLY_LOG.sequelize!.fn('sum', SUPPLY_LOG.sequelize!.col('blocks_returned')), 'blocks_returned'],
					[SUPPLY_LOG.sequelize!.fn('sum', SUPPLY_LOG.sequelize!.col('breakage_quantity')), 'breakage_quantity'],
				],
				group: ['year'],
				order: [['year', 'ASC']],
			});

			const logisticsFuelLogDispenseDateAnalysisDaily = await LOGISTICS_FUEL_LOG.findAll({
				attributes: [
					[LOGISTICS_FUEL_LOG.sequelize!.fn('date', LOGISTICS_FUEL_LOG.sequelize!.col('dispense_date')), 'date'],
					[LOGISTICS_FUEL_LOG.sequelize!.fn('count', LOGISTICS_FUEL_LOG.sequelize!.col('id')), 'total_count'],
					[LOGISTICS_FUEL_LOG.sequelize!.fn('sum', LOGISTICS_FUEL_LOG.sequelize!.col('liters_dispensed')), 'liters_dispensed'], 
					[LOGISTICS_FUEL_LOG.sequelize!.fn('sum', LOGISTICS_FUEL_LOG.sequelize!.col('expected_trips')), 'expected_trips'], 
					[LOGISTICS_FUEL_LOG.sequelize!.fn('sum', LOGISTICS_FUEL_LOG.sequelize!.col('actual_trips')), 'actual_trips']
				],
				group: ['date'],
				order: [['date', 'ASC']],
			});

			const logisticsFuelLogDispenseDateAnalysisWeekly = await LOGISTICS_FUEL_LOG.findAll({
				attributes: [
					[LOGISTICS_FUEL_LOG.sequelize!.fn('DATE_FORMAT', LOGISTICS_FUEL_LOG.sequelize!.col('dispense_date'), '%Y-%u'), 'week'],
					[LOGISTICS_FUEL_LOG.sequelize!.fn('count', LOGISTICS_FUEL_LOG.sequelize!.col('id')), 'total_count'],
					[LOGISTICS_FUEL_LOG.sequelize!.fn('sum', LOGISTICS_FUEL_LOG.sequelize!.col('liters_dispensed')), 'liters_dispensed'], 
					[LOGISTICS_FUEL_LOG.sequelize!.fn('sum', LOGISTICS_FUEL_LOG.sequelize!.col('expected_trips')), 'expected_trips'], 
					[LOGISTICS_FUEL_LOG.sequelize!.fn('sum', LOGISTICS_FUEL_LOG.sequelize!.col('actual_trips')), 'actual_trips']
				],
				group: ['week'],
				order: [['week', 'ASC']],
			});

			const logisticsFuelLogDispenseDateAnalysisMonthly = await LOGISTICS_FUEL_LOG.findAll({
				attributes: [
					[LOGISTICS_FUEL_LOG.sequelize!.fn('DATE_FORMAT', LOGISTICS_FUEL_LOG.sequelize!.col('dispense_date'), '%Y-%m'), 'month'],
					[LOGISTICS_FUEL_LOG.sequelize!.fn('count', LOGISTICS_FUEL_LOG.sequelize!.col('id')), 'total_count'],
					[LOGISTICS_FUEL_LOG.sequelize!.fn('sum', LOGISTICS_FUEL_LOG.sequelize!.col('liters_dispensed')), 'liters_dispensed'], 
					[LOGISTICS_FUEL_LOG.sequelize!.fn('sum', LOGISTICS_FUEL_LOG.sequelize!.col('expected_trips')), 'expected_trips'], 
					[LOGISTICS_FUEL_LOG.sequelize!.fn('sum', LOGISTICS_FUEL_LOG.sequelize!.col('actual_trips')), 'actual_trips']
				],
				group: ['month'],
				order: [['month', 'ASC']],
			});

			const logisticsFuelLogDispenseDateAnalysisYearly = await LOGISTICS_FUEL_LOG.findAll({
				attributes: [
					[LOGISTICS_FUEL_LOG.sequelize!.fn('DATE_FORMAT', LOGISTICS_FUEL_LOG.sequelize!.col('dispense_date'), '%Y'), 'year'],
					[LOGISTICS_FUEL_LOG.sequelize!.fn('count', LOGISTICS_FUEL_LOG.sequelize!.col('id')), 'total_count'],
					[LOGISTICS_FUEL_LOG.sequelize!.fn('sum', LOGISTICS_FUEL_LOG.sequelize!.col('liters_dispensed')), 'liters_dispensed'], 
					[LOGISTICS_FUEL_LOG.sequelize!.fn('sum', LOGISTICS_FUEL_LOG.sequelize!.col('expected_trips')), 'expected_trips'], 
					[LOGISTICS_FUEL_LOG.sequelize!.fn('sum', LOGISTICS_FUEL_LOG.sequelize!.col('actual_trips')), 'actual_trips']
				],
				group: ['year'],
				order: [['year', 'ASC']],
			});

			return SuccessResponse(res, { unique_id: user_unique_id, text: "Logistics & Supply Chain Stats Loaded" }, {
				total_delivery_assignments, total_supply_logs, total_logistics_fuel_logs, total_supply_log_blocks_loaded, total_supply_log_blocks_dropped, total_supply_log_blocks_returned, 
				total_supply_log_breakage_quantity, total_logistics_fuel_log_liters_dispensed, total_logistics_fuel_log_expected_trips, total_logistics_fuel_log_actual_trips, 
				total_delivery_assignment_via_auto_assigned, total_delivery_assignment_via_assignment_status, total_logistics_fuel_log_via_fuel_type, total_delivery_assignment_via_vehicle, 
				total_delivery_assignment_via_user, total_supply_log_via_user, total_logistics_fuel_log_via_user, total_logistics_fuel_log_via_vehicle, deliveryAssignmentScheduledDateAnalysisDaily, 
				deliveryAssignmentScheduledDateAnalysisWeekly, deliveryAssignmentScheduledDateAnalysisMonthly, deliveryAssignmentScheduledDateAnalysisYearly, deliveryAssignmentStartedAtDateAnalysisDaily, 
				deliveryAssignmentStartedAtDateAnalysisWeekly, deliveryAssignmentStartedAtDateAnalysisMonthly, deliveryAssignmentStartedAtDateAnalysisYearly, deliveryAssignmentCompletedAtDateAnalysisDaily, 
				deliveryAssignmentCompletedAtDateAnalysisWeekly, deliveryAssignmentCompletedAtDateAnalysisMonthly, deliveryAssignmentCompletedAtDateAnalysisYearly, supplyLogDeliveryDateAnalysisDaily, 
				supplyLogDeliveryDateAnalysisWeekly, supplyLogDeliveryDateAnalysisMonthly, supplyLogDeliveryDateAnalysisYearly, logisticsFuelLogDispenseDateAnalysisDaily, logisticsFuelLogDispenseDateAnalysisWeekly, 
				logisticsFuelLogDispenseDateAnalysisMonthly, logisticsFuelLogDispenseDateAnalysisYearly
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getGeneralStats(req: IGetAuthTypesRequest, res: Response) {
		const user_unique_id: string = req.USER_UNIQUE_ID;

		try {
			const total_approvals = await APPROVAL.count();
			const total_customers = await CUSTOMER.count();
			const total_delivery_assignments = await DELIVERY_ASSIGNMENT.count();
			const total_discounts = await DISCOUNT.count();
			const total_expenses = await EXPENSE.count();
			const total_finished_goods = await FINISHED_GOOD.count();
			const total_fuel_purchases = await FUEL_PURCHASE.count();
			const total_invoices = await INVOICE.count();
			const total_machines = await MACHINE.count();
			const total_production_batches = await PRODUCTION_BATCH.count();
			const total_products = await PRODUCT.count();
			const total_purchase_orders = await PURCHASE_ORDER.count();
			const total_raw_materials = await RAW_MATERIAL.count();
			const total_sales_orders = await SALES_ORDER.count();
			const total_users = await USER.count();
			const total_vehicles = await VEHICLE.count();
			const total_vendors = await VENDOR.count();

			const total_expense_amount = await EXPENSE.sum("amount");
			const total_fuel_purchase_liters = await FUEL_PURCHASE.sum("liters_purchased");
			const total_fuel_purchase_cost = await FUEL_PURCHASE.sum("total_cost");
			const total_invoice_amount = await INVOICE.sum("total_amount");
			const total_sales_order_amount = await SALES_ORDER.sum("total_amount");

			const daily_sales_orders = await SALES_ORDER.findAll({
				attributes: [
					[SALES_ORDER.sequelize!.fn("date", SALES_ORDER.sequelize!.col("createdAt")), "date"],
					[SALES_ORDER.sequelize!.fn("count", SALES_ORDER.sequelize!.col("id")), "total_count"],
					[SALES_ORDER.sequelize!.fn("sum", SALES_ORDER.sequelize!.col("total_amount")), "total_amount"],
				],
				group: ["date"],
				order: [["date", "ASC"]],
			});

			const daily_invoices = await INVOICE.findAll({
				attributes: [
					[INVOICE.sequelize!.fn("date", INVOICE.sequelize!.col("invoice_date")), "date"],
					[INVOICE.sequelize!.fn("count", INVOICE.sequelize!.col("id")), "total_count"],
					[INVOICE.sequelize!.fn("sum", INVOICE.sequelize!.col("total_amount")), "total_amount"],
				],
				group: ["date"],
				order: [["date", "ASC"]],
			});

			const daily_fuel_purchases = await FUEL_PURCHASE.findAll({
				attributes: [
					[FUEL_PURCHASE.sequelize!.fn("date", FUEL_PURCHASE.sequelize!.col("purchase_date")), "date"],
					[FUEL_PURCHASE.sequelize!.fn("count", FUEL_PURCHASE.sequelize!.col("id")), "total_count"],
					[FUEL_PURCHASE.sequelize!.fn("sum", FUEL_PURCHASE.sequelize!.col("liters_purchased")), "liters_purchased"],
					[FUEL_PURCHASE.sequelize!.fn("sum", FUEL_PURCHASE.sequelize!.col("total_cost")), "total_cost"],
				],
				group: ["date"],
				order: [["date", "ASC"]],
			});

			const daily_expenses = await EXPENSE.findAll({
				attributes: [
					[EXPENSE.sequelize!.fn("date", EXPENSE.sequelize!.col("expense_date")), "date"],
					[EXPENSE.sequelize!.fn("count", EXPENSE.sequelize!.col("id")), "total_count"],
					[EXPENSE.sequelize!.fn("sum", EXPENSE.sequelize!.col("amount")), "total_amount"],
				],
				group: ["date"],
				order: [["date", "ASC"]],
			});

			return SuccessResponse(res, { unique_id: user_unique_id, text: "General Stats loaded" }, {
				total_approvals, total_customers, total_delivery_assignments, total_discounts, total_expenses, total_finished_goods, total_fuel_purchases, total_invoices, 
				total_machines, total_production_batches, total_products, total_purchase_orders, total_raw_materials, total_sales_orders, total_users, total_vehicles, 
				total_vendors, total_expense_amount, total_fuel_purchase_liters, total_fuel_purchase_cost, total_invoice_amount, total_sales_order_amount, daily_sales_orders, 
				daily_invoices, daily_fuel_purchases, daily_expenses,
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}
};
