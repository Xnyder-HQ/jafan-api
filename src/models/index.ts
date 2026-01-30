import { Sequelize } from "sequelize-typescript";
import { config, dialect, dialectOptions, timezone } from "../config/db.config";
import logger from "../common/logger";
import Acl from "./acls.model";
import ApiKey from "./apiKeys.model";
import AppDefault from "./appDefaults.model";
import Approval from "./approvals.model";
import BusinessRule from "./businessRules.model";
import Category from "./categories.model";
import Customer from "./customers.model";
import DeliveryAssignment from "./deliveryAssignments.model";
import Discount from "./discounts.model";
import Expense from "./expenses.model";
import FinishedGood from "./finishedGoods.model";
import FinishedGoodStockLog from "./finishedGoodStockLogs.model";
import FuelPurchase from "./fuelPurchases.model";
import Invoice from "./invoices.model";
import InvoicePayment from "./invoicePayments.model";
import LogisticsFuelLog from "./logisticsFuelLogs.model";
import Log from "./logs.model";
import MachineMaintenanceLog from "./machineMaintenanceLogs.model";
import Machine from "./machines.model";
import Module from "./modules.model";
import ProductionBatch from "./productionBatches.model";
import ProductionFuelLog from "./productionFuelLogs.model";
import ProductionQcLog from "./productionQcLogs.model";
import ProductionTeam from "./productionTeams.model";
import Product from "./products.model";
import PurchaseOrder from "./purchaseOrders.model";
import RawMaterial from "./rawMaterials.model";
import RawMaterialStockLog from "./rawMaterialStockLogs.model";
import RoleAcl from "./roleAcls.model";
import Role from "./roles.model";
import SalesOrder from "./salesOrders.model";
import SalesOrderItem from "./salesOrderItems.model";
import StackingLog from "./stackingLogs.model";
import SubModule from "./subModules.model";
import SupplyLog from "./supplyLogs.model";
import User from "./users.model";
import Vehicle from "./vehicles.model";
import VendorPayment from "./vendorPayments.model";
import Vendor from "./vendors.model";

class Database {
	public sequelize: Sequelize | undefined;

	constructor() {
		this.connectToDatabase();
	}

	private async connectToDatabase() {
		this.sequelize = new Sequelize({
			database: config.DB,
			username: config.USER,
			password: config.PASSWORD,
			host: config.HOST,
			dialect: dialect,
			logging: false,
			pool: {
				max: config.pool.max,
				min: config.pool.min,
				acquire: config.pool.acquire,
				idle: config.pool.idle,
				evict: config.pool.evict
			},
			dialectOptions: {
				// useUTC: dialectOptions.useUTC, 
				dateStrings: dialectOptions.dateStrings,
				typeCast: dialectOptions.typeCast
			},
			define: {
				charset: "utf8mb4",
				collate: "utf8mb4_unicode_ci"
			},
			timezone: timezone,
			models: [
				ApiKey, AppDefault, Module, SubModule, Category, Role, User, Vendor, Acl, RoleAcl, Approval, BusinessRule, Log, Customer, Product, 
				SalesOrder, SalesOrderItem, Invoice, InvoicePayment, Discount, RawMaterial, RawMaterialStockLog, FinishedGood, Machine, Vehicle, 
				FinishedGoodStockLog, FuelPurchase, PurchaseOrder, VendorPayment, MachineMaintenanceLog, StackingLog, Expense, ProductionTeam, 
				ProductionBatch, ProductionQcLog, ProductionFuelLog, DeliveryAssignment, SupplyLog, LogisticsFuelLog, 
			]
		});

		await this.sequelize
			.authenticate()
			.then(() => {
				// Associations

				// - Sub Module 
				Module.hasMany(SubModule, { foreignKey: "module_unique_id", sourceKey: "unique_id" });
				SubModule.belongsTo(Module, { foreignKey: "module_unique_id", targetKey: "unique_id" });

				// - Role ACL 
				Role.hasMany(RoleAcl, { foreignKey: "role_unique_id", sourceKey: "unique_id" });
				RoleAcl.belongsTo(Role, { foreignKey: "role_unique_id", targetKey: "unique_id" });
				
				Module.hasMany(RoleAcl, { foreignKey: "module_unique_id", sourceKey: "unique_id" });
				RoleAcl.belongsTo(Module, { foreignKey: "module_unique_id", targetKey: "unique_id" });
				
				SubModule.hasMany(RoleAcl, { foreignKey: "sub_module_unique_id", sourceKey: "unique_id" });
				RoleAcl.belongsTo(SubModule, { foreignKey: "sub_module_unique_id", targetKey: "unique_id" });

				// - ACL 
				User.hasMany(Acl, { foreignKey: "user_unique_id", sourceKey: "unique_id" });
				Acl.belongsTo(User, { foreignKey: "user_unique_id", targetKey: "unique_id" });
				
				Role.hasMany(Acl, { foreignKey: "role_unique_id", sourceKey: "unique_id" });
				Acl.belongsTo(Role, { foreignKey: "role_unique_id", targetKey: "unique_id" });
				
				Module.hasMany(Acl, { foreignKey: "module_unique_id", sourceKey: "unique_id" });
				Acl.belongsTo(Module, { foreignKey: "module_unique_id", targetKey: "unique_id" });
				
				SubModule.hasMany(Acl, { foreignKey: "sub_module_unique_id", sourceKey: "unique_id" });
				Acl.belongsTo(SubModule, { foreignKey: "sub_module_unique_id", targetKey: "unique_id" });

				// - Approval 
				User.hasMany(Approval, { foreignKey: "user_unique_id", sourceKey: "unique_id" });
				Approval.belongsTo(User, { foreignKey: "user_unique_id", targetKey: "unique_id" });
				
				Module.hasMany(Approval, { foreignKey: "module_unique_id", sourceKey: "unique_id" });
				Approval.belongsTo(Module, { foreignKey: "module_unique_id", targetKey: "unique_id" });
				
				SubModule.hasMany(Approval, { foreignKey: "sub_module_unique_id", sourceKey: "unique_id" });
				Approval.belongsTo(SubModule, { foreignKey: "sub_module_unique_id", targetKey: "unique_id" });

				// - Log 
				User.hasMany(Log, { foreignKey: "user_unique_id", sourceKey: "unique_id" });
				Log.belongsTo(User, { foreignKey: "user_unique_id", targetKey: "unique_id" });
				
				// - Customer 
				User.hasMany(Customer, { foreignKey: "created_by", sourceKey: "unique_id" });
				Customer.belongsTo(User, { foreignKey: "created_by", targetKey: "unique_id" });
				
				// - Product 
				Category.hasMany(Product, { foreignKey: "category_unique_id", sourceKey: "unique_id" });
				Product.belongsTo(Category, { foreignKey: "category_unique_id", targetKey: "unique_id" });
				
				User.hasMany(Product, { foreignKey: "created_by", sourceKey: "unique_id" });
				Product.belongsTo(User, { foreignKey: "created_by", targetKey: "unique_id" });
				
				// - Sales Order 
				Customer.hasMany(SalesOrder, { foreignKey: "customer_unique_id", sourceKey: "unique_id" });
				SalesOrder.belongsTo(Customer, { foreignKey: "customer_unique_id", targetKey: "unique_id" });
				
				// Discount.hasMany(SalesOrder, { foreignKey: "discount_unique_id", sourceKey: "unique_id" });
				// SalesOrder.belongsTo(Discount, { foreignKey: "discount_unique_id", targetKey: "unique_id" });
				
				User.hasMany(SalesOrder, { foreignKey: "created_by", sourceKey: "unique_id", as: "CreatedSalesOrders" });
				SalesOrder.belongsTo(User, { foreignKey: "created_by", targetKey: "unique_id", as: "Creator" });
				
				User.hasMany(SalesOrder, { foreignKey: "approved_by", sourceKey: "unique_id", as: "ApprovedSalesOrders" });
				SalesOrder.belongsTo(User, { foreignKey: "approved_by", targetKey: "unique_id", as: "Approver" });
				
				// - Sales Order Item 
				SalesOrder.hasMany(SalesOrderItem, { foreignKey: "sales_order_unique_id", sourceKey: "unique_id" });
				SalesOrderItem.belongsTo(SalesOrder, { foreignKey: "sales_order_unique_id", targetKey: "unique_id" });
				
				Product.hasMany(SalesOrderItem, { foreignKey: "product_unique_id", sourceKey: "unique_id" });
				SalesOrderItem.belongsTo(Product, { foreignKey: "product_unique_id", targetKey: "unique_id" });

				// - Invoice 
				Customer.hasMany(Invoice, { foreignKey: "customer_unique_id", sourceKey: "unique_id" });
				Invoice.belongsTo(Customer, { foreignKey: "customer_unique_id", targetKey: "unique_id" });
				
				SalesOrder.hasMany(Invoice, { foreignKey: "sales_order_unique_id", sourceKey: "unique_id" });
				Invoice.belongsTo(SalesOrder, { foreignKey: "sales_order_unique_id", targetKey: "unique_id" });
				
				User.hasMany(Invoice, { foreignKey: "created_by", sourceKey: "unique_id" });
				Invoice.belongsTo(User, { foreignKey: "created_by", targetKey: "unique_id" });
				
				// - Invoice Payment 
				Customer.hasMany(InvoicePayment, { foreignKey: "customer_unique_id", sourceKey: "unique_id" });
				InvoicePayment.belongsTo(Customer, { foreignKey: "customer_unique_id", targetKey: "unique_id" });
				
				Invoice.hasMany(InvoicePayment, { foreignKey: "invoice_unique_id", sourceKey: "unique_id" });
				InvoicePayment.belongsTo(Invoice, { foreignKey: "invoice_unique_id", targetKey: "unique_id" });
				
				User.hasMany(InvoicePayment, { foreignKey: "received_by", sourceKey: "unique_id" });
				InvoicePayment.belongsTo(User, { foreignKey: "received_by", targetKey: "unique_id" });

				// - Discount 
				SalesOrder.hasMany(Discount, { foreignKey: "sales_order_unique_id", sourceKey: "unique_id" });
				Discount.belongsTo(SalesOrder, { foreignKey: "sales_order_unique_id", targetKey: "unique_id" });
				
				Invoice.hasMany(Discount, { foreignKey: "invoice_unique_id", sourceKey: "unique_id" });
				Discount.belongsTo(Invoice, { foreignKey: "invoice_unique_id", targetKey: "unique_id" });
				
				User.hasMany(Discount, { foreignKey: "created_by", sourceKey: "unique_id", as: "CreatedDiscounts" });
				Discount.belongsTo(User, { foreignKey: "created_by", targetKey: "unique_id", as: "Creator" });
				
				User.hasMany(Discount, { foreignKey: "approved_by", sourceKey: "unique_id", as: "ApprovedDiscounts" });
				Discount.belongsTo(User, { foreignKey: "approved_by", targetKey: "unique_id", as: "Approver" });
				
				// - Vendor 
				User.hasMany(Vendor, { foreignKey: "created_by", sourceKey: "unique_id" });
				Vendor.belongsTo(User, { foreignKey: "created_by", targetKey: "unique_id" });
				
				// - Purchase Order 
				Vendor.hasMany(PurchaseOrder, { foreignKey: "vendor_unique_id", sourceKey: "unique_id" });
				PurchaseOrder.belongsTo(Vendor, { foreignKey: "vendor_unique_id", targetKey: "unique_id" });
				
				RawMaterial.hasMany(PurchaseOrder, { foreignKey: "raw_material_unique_id", sourceKey: "unique_id" });
				PurchaseOrder.belongsTo(RawMaterial, { foreignKey: "raw_material_unique_id", targetKey: "unique_id" });
				
				User.hasMany(PurchaseOrder, { foreignKey: "created_by", sourceKey: "unique_id", as: "CreatedPurchaseOrders" });
				PurchaseOrder.belongsTo(User, { foreignKey: "created_by", targetKey: "unique_id", as: "Creator" });
				
				User.hasMany(PurchaseOrder, { foreignKey: "approved_by", sourceKey: "unique_id", as: "ApprovedPurchaseOrders" });
				PurchaseOrder.belongsTo(User, { foreignKey: "approved_by", targetKey: "unique_id", as: "Approver" });
				
				// - Vendor Payment 
				Vendor.hasMany(VendorPayment, { foreignKey: "vendor_unique_id", sourceKey: "unique_id" });
				VendorPayment.belongsTo(Vendor, { foreignKey: "vendor_unique_id", targetKey: "unique_id" });
				
				PurchaseOrder.hasMany(VendorPayment, { foreignKey: "purchase_order_unique_id", sourceKey: "unique_id" });
				VendorPayment.belongsTo(PurchaseOrder, { foreignKey: "purchase_order_unique_id", targetKey: "unique_id" });
				
				User.hasMany(VendorPayment, { foreignKey: "created_by", sourceKey: "unique_id", as: "CreatedVendorPayments" });
				VendorPayment.belongsTo(User, { foreignKey: "created_by", targetKey: "unique_id", as: "Creator" });
				
				User.hasMany(VendorPayment, { foreignKey: "facilitated_by", sourceKey: "unique_id", as: "FacilitatedVendorPayments" });
				VendorPayment.belongsTo(User, { foreignKey: "facilitated_by", targetKey: "unique_id", as: "Facilitator" });
				
				// - Fuel Purchase  
				Vendor.hasMany(FuelPurchase, { foreignKey: "vendor_unique_id", sourceKey: "unique_id" });
				FuelPurchase.belongsTo(Vendor, { foreignKey: "vendor_unique_id", targetKey: "unique_id" });
				
				User.hasMany(FuelPurchase, { foreignKey: "created_by", sourceKey: "unique_id" });
				FuelPurchase.belongsTo(User, { foreignKey: "created_by", targetKey: "unique_id" });
				
				// - Expense  
				PurchaseOrder.hasMany(Expense, { foreignKey: "purchase_order_unique_id", sourceKey: "unique_id" });
				Expense.belongsTo(PurchaseOrder, { foreignKey: "purchase_order_unique_id", targetKey: "unique_id" });
				
				FuelPurchase.hasMany(Expense, { foreignKey: "fuel_purchase_unique_id", sourceKey: "unique_id" });
				Expense.belongsTo(FuelPurchase, { foreignKey: "fuel_purchase_unique_id", targetKey: "unique_id" });
				
				VendorPayment.hasMany(Expense, { foreignKey: "vendor_payment_unique_id", sourceKey: "unique_id" });
				Expense.belongsTo(VendorPayment, { foreignKey: "vendor_payment_unique_id", targetKey: "unique_id" });
				
				MachineMaintenanceLog.hasMany(Expense, { foreignKey: "machine_maintenance_log_unique_id", sourceKey: "unique_id" });
				Expense.belongsTo(MachineMaintenanceLog, { foreignKey: "machine_maintenance_log_unique_id", targetKey: "unique_id" });
				
				StackingLog.hasMany(Expense, { foreignKey: "stacking_log_unique_id", sourceKey: "unique_id" });
				Expense.belongsTo(StackingLog, { foreignKey: "stacking_log_unique_id", targetKey: "unique_id" });
				
				User.hasMany(Expense, { foreignKey: "created_by", sourceKey: "unique_id" });
				Expense.belongsTo(User, { foreignKey: "created_by", targetKey: "unique_id" });
				
				// - Raw Material  
				User.hasMany(RawMaterial, { foreignKey: "created_by", sourceKey: "unique_id" });
				RawMaterial.belongsTo(User, { foreignKey: "created_by", targetKey: "unique_id" });
				
				// - Raw Material Stock Log 
				RawMaterial.hasMany(RawMaterialStockLog, { foreignKey: "raw_material_unique_id", sourceKey: "unique_id" });
				RawMaterialStockLog.belongsTo(RawMaterial, { foreignKey: "raw_material_unique_id", targetKey: "unique_id" });
				
				User.hasMany(RawMaterialStockLog, { foreignKey: "created_by", sourceKey: "unique_id" });
				RawMaterialStockLog.belongsTo(User, { foreignKey: "created_by", targetKey: "unique_id" });
				
				// - Finished Good  
				Product.hasMany(FinishedGood, { foreignKey: "product_unique_id", sourceKey: "unique_id" });
				FinishedGood.belongsTo(Product, { foreignKey: "product_unique_id", targetKey: "unique_id" });
				
				User.hasMany(FinishedGood, { foreignKey: "created_by", sourceKey: "unique_id" });
				FinishedGood.belongsTo(User, { foreignKey: "created_by", targetKey: "unique_id" });
				
				// - Finished Good Stock Log 
				FinishedGood.hasMany(FinishedGoodStockLog, { foreignKey: "finished_good_unique_id", sourceKey: "unique_id" });
				FinishedGoodStockLog.belongsTo(FinishedGood, { foreignKey: "finished_good_unique_id", targetKey: "unique_id" });
				
				User.hasMany(FinishedGoodStockLog, { foreignKey: "created_by", sourceKey: "unique_id" });
				FinishedGoodStockLog.belongsTo(User, { foreignKey: "created_by", targetKey: "unique_id" });
				
				// - Machine  
				User.hasMany(Machine, { foreignKey: "created_by", sourceKey: "unique_id" });
				Machine.belongsTo(User, { foreignKey: "created_by", targetKey: "unique_id" });

				// - Production Team 
				Machine.hasMany(ProductionTeam, { foreignKey: "machine_unique_id", sourceKey: "unique_id" });
				ProductionTeam.belongsTo(Machine, { foreignKey: "machine_unique_id", targetKey: "unique_id" });
				
				User.hasMany(ProductionTeam, { foreignKey: "created_by", sourceKey: "unique_id" });
				ProductionTeam.belongsTo(User, { foreignKey: "created_by", targetKey: "unique_id" });
				
				// - Production Batch 
				Machine.hasMany(ProductionBatch, { foreignKey: "machine_unique_id", sourceKey: "unique_id" });
				ProductionBatch.belongsTo(Machine, { foreignKey: "machine_unique_id", targetKey: "unique_id" });
				
				ProductionTeam.hasMany(ProductionBatch, { foreignKey: "production_team_unique_id", sourceKey: "unique_id" });
				ProductionBatch.belongsTo(ProductionTeam, { foreignKey: "production_team_unique_id", targetKey: "unique_id" });
				
				FinishedGood.hasMany(ProductionBatch, { foreignKey: "finished_good_unique_id", sourceKey: "unique_id" });
				ProductionBatch.belongsTo(FinishedGood, { foreignKey: "finished_good_unique_id", targetKey: "unique_id" });
				
				User.hasMany(ProductionBatch, { foreignKey: "created_by", sourceKey: "unique_id" });
				ProductionBatch.belongsTo(User, { foreignKey: "created_by", targetKey: "unique_id" });
				
				// - Production QC Log 
				Machine.hasMany(ProductionQcLog, { foreignKey: "machine_unique_id", sourceKey: "unique_id" });
				ProductionQcLog.belongsTo(Machine, { foreignKey: "machine_unique_id", targetKey: "unique_id" });
				
				ProductionBatch.hasMany(ProductionQcLog, { foreignKey: "production_batch_unique_id", sourceKey: "unique_id" });
				ProductionQcLog.belongsTo(ProductionBatch, { foreignKey: "production_batch_unique_id", targetKey: "unique_id" });
				
				ProductionTeam.hasMany(ProductionQcLog, { foreignKey: "production_team_unique_id", sourceKey: "unique_id" });
				ProductionQcLog.belongsTo(ProductionTeam, { foreignKey: "production_team_unique_id", targetKey: "unique_id" });
				
				FinishedGood.hasMany(ProductionQcLog, { foreignKey: "finished_good_unique_id", sourceKey: "unique_id" });
				ProductionQcLog.belongsTo(FinishedGood, { foreignKey: "finished_good_unique_id", targetKey: "unique_id" });
				
				User.hasMany(ProductionQcLog, { foreignKey: "created_by", sourceKey: "unique_id" });
				ProductionQcLog.belongsTo(User, { foreignKey: "created_by", targetKey: "unique_id" });
				
				// - Production Fuel Log 
				Machine.hasMany(ProductionFuelLog, { foreignKey: "machine_unique_id", sourceKey: "unique_id" });
				ProductionFuelLog.belongsTo(Machine, { foreignKey: "machine_unique_id", targetKey: "unique_id" });
				
				User.hasMany(ProductionFuelLog, { foreignKey: "dispensed_by", sourceKey: "unique_id" });
				ProductionFuelLog.belongsTo(User, { foreignKey: "dispensed_by", targetKey: "unique_id" });
				
				// - Machine Maintenance Log 
				Machine.hasMany(MachineMaintenanceLog, { foreignKey: "machine_unique_id", sourceKey: "unique_id" });
				MachineMaintenanceLog.belongsTo(Machine, { foreignKey: "machine_unique_id", targetKey: "unique_id" });
				
				Vendor.hasMany(MachineMaintenanceLog, { foreignKey: "vendor_unique_id", sourceKey: "unique_id" });
				MachineMaintenanceLog.belongsTo(Vendor, { foreignKey: "vendor_unique_id", targetKey: "unique_id" });
				
				User.hasMany(MachineMaintenanceLog, { foreignKey: "created_by", sourceKey: "unique_id" });
				MachineMaintenanceLog.belongsTo(User, { foreignKey: "created_by", targetKey: "unique_id" });
				
				// - Stacking Log 
				FinishedGood.hasMany(StackingLog, { foreignKey: "finished_good_unique_id", sourceKey: "unique_id" });
				StackingLog.belongsTo(FinishedGood, { foreignKey: "finished_good_unique_id", targetKey: "unique_id" });
				
				// Uncomment when you implement employee module
				// Employee.hasMany(StackingLog, { foreignKey: "stacked_by", sourceKey: "unique_id" });
				// StackingLog.belongsTo(Employee, { foreignKey: "stacked_by", targetKey: "unique_id" });
				
				User.hasMany(StackingLog, { foreignKey: "created_by", sourceKey: "unique_id" });
				StackingLog.belongsTo(User, { foreignKey: "created_by", targetKey: "unique_id" });
				
				// - Vehicle  
				User.hasMany(Vehicle, { foreignKey: "created_by", sourceKey: "unique_id" });
				Vehicle.belongsTo(User, { foreignKey: "created_by", targetKey: "unique_id" });
				
				// - Business Rule  
				User.hasMany(BusinessRule, { foreignKey: "updated_by", sourceKey: "unique_id" });
				BusinessRule.belongsTo(User, { foreignKey: "updated_by", targetKey: "unique_id" });

				// - Delivery Assignment 
				SalesOrder.hasMany(DeliveryAssignment, { foreignKey: "sales_order_unique_id", sourceKey: "unique_id" });
				DeliveryAssignment.belongsTo(SalesOrder, { foreignKey: "sales_order_unique_id", targetKey: "unique_id" });
				
				Vehicle.hasMany(DeliveryAssignment, { foreignKey: "vehicle_unique_id", sourceKey: "unique_id" });
				DeliveryAssignment.belongsTo(Vehicle, { foreignKey: "vehicle_unique_id", targetKey: "unique_id" });
				
				// Uncomment when you implement employee module
				// Employee.hasMany(DeliveryAssignment, { foreignKey: "driver_unique_id", sourceKey: "unique_id" });
				// DeliveryAssignment.belongsTo(Employee, { foreignKey: "driver_unique_id", targetKey: "unique_id" });
				
				User.hasMany(DeliveryAssignment, { foreignKey: "updated_by", sourceKey: "unique_id" });
				DeliveryAssignment.belongsTo(User, { foreignKey: "updated_by", targetKey: "unique_id" });
				
				// - Supply Log 
				DeliveryAssignment.hasMany(SupplyLog, { foreignKey: "delivery_assignment_unique_id", sourceKey: "unique_id" });
				SupplyLog.belongsTo(DeliveryAssignment, { foreignKey: "delivery_assignment_unique_id", targetKey: "unique_id" });
				
				SalesOrder.hasMany(SupplyLog, { foreignKey: "sales_order_unique_id", sourceKey: "unique_id" });
				SupplyLog.belongsTo(SalesOrder, { foreignKey: "sales_order_unique_id", targetKey: "unique_id" });
				
				SalesOrderItem.hasMany(SupplyLog, { foreignKey: "sales_order_item_unique_id", sourceKey: "unique_id" });
				SupplyLog.belongsTo(SalesOrderItem, { foreignKey: "sales_order_item_unique_id", targetKey: "unique_id" });
				
				Customer.hasMany(SupplyLog, { foreignKey: "customer_unique_id", sourceKey: "unique_id" });
				SupplyLog.belongsTo(Customer, { foreignKey: "customer_unique_id", targetKey: "unique_id" });
				
				Product.hasMany(SupplyLog, { foreignKey: "product_unique_id", sourceKey: "unique_id" });
				SupplyLog.belongsTo(Product, { foreignKey: "product_unique_id", targetKey: "unique_id" });
				
				Vehicle.hasMany(SupplyLog, { foreignKey: "vehicle_unique_id", sourceKey: "unique_id" });
				SupplyLog.belongsTo(Vehicle, { foreignKey: "vehicle_unique_id", targetKey: "unique_id" });
				
				// Uncomment when you implement employee module
				// Employee.hasMany(SupplyLog, { foreignKey: "driver_unique_id", sourceKey: "unique_id" });
				// SupplyLog.belongsTo(Employee, { foreignKey: "driver_unique_id", targetKey: "unique_id" });
				
				User.hasMany(SupplyLog, { foreignKey: "created_by", sourceKey: "unique_id" });
				SupplyLog.belongsTo(User, { foreignKey: "created_by", targetKey: "unique_id" });
				
				// - Logistics Fuel Log 
				Vehicle.hasMany(LogisticsFuelLog, { foreignKey: "vehicle_unique_id", sourceKey: "unique_id" });
				LogisticsFuelLog.belongsTo(Vehicle, { foreignKey: "vehicle_unique_id", targetKey: "unique_id" });
				
				// Uncomment when you implement employee module
				// Employee.hasMany(LogisticsFuelLog, { foreignKey: "driver_unique_id", sourceKey: "unique_id" });
				// LogisticsFuelLog.belongsTo(Employee, { foreignKey: "driver_unique_id", targetKey: "unique_id" });
				
				User.hasMany(LogisticsFuelLog, { foreignKey: "created_by", sourceKey: "unique_id" });
				LogisticsFuelLog.belongsTo(User, { foreignKey: "created_by", targetKey: "unique_id" });
				
				// - User 
				Role.hasMany(User, { foreignKey: "role_unique_id", sourceKey: "unique_id" });
				User.belongsTo(Role, { foreignKey: "role_unique_id", targetKey: "unique_id" });
				
				// End - Associations
				
				logger.info("DB Connected 🚀");
			})
			.catch((err) => {
				logger.error("Unable to connect to the Database:".concat(JSON.stringify(err)));
			});
	}
}

export default Database;