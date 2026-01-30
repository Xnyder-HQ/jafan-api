import { Application } from "express";
import homeRoutes from "./home.routes";
import analyticsRoutes from "./analytics.routes"; 
import appDefaultsRoutes from "./appDefaults.routes"; 
import authRoutes from "./auth.routes"; 
import approvalsRoutes from "./approvals.routes"; 
import businessRulesRoutes from "./businessRules.routes"; 
import aclsRoutes from "./acls.routes"; 
import categoriesRoutes from "./categories.routes"; 
import customersRoutes from "./customers.routes"; 
import deliveryAssignmentsRoutes from "./deliveryAssignments.routes"; 
import discountsRoutes from "./discounts.routes"; 
import expensesRoutes from "./expenses.routes"; 
import finishedGoodsRoutes from "./finishedGoods.routes"; 
import finishedGoodStockLogsRoutes from "./finishedGoodStockLogs.routes"; 
import fuelPurchasesRoutes from "./fuelPurchases.routes"; 
import invoicePaymentsRoutes from "./invoicePayments.routes"; 
import invoicesRoutes from "./invoices.routes"; 
import logisticsFuelLogsRoutes from "./logisticsFuelLogs.routes"; 
import logsRoutes from "./logs.routes"; 
import machineMaintenanceLogsRoutes from "./machineMaintenanceLogs.routes"; 
import machinesRoutes from "./machines.routes"; 
import modulesRoutes from "./modules.routes"; 
import productionBatchesRoutes from "./productionBatches.routes"; 
import productionFuelLogsRoutes from "./productionFuelLogs.routes"; 
import productionQcLogsRoutes from "./productionQcLogs.routes"; 
import productsRoutes from "./products.routes"; 
import productionTeamsRoutes from "./productionTeams.routes"; 
import purchaseOrdersRoutes from "./purchaseOrders.routes"; 
import rawMaterialsRoutes from "./rawMaterials.routes"; 
import rawMaterialStockLogsRoutes from "./rawMaterialStockLogs.routes"; 
import roleAclsRoutes from "./roleAcls.routes"; 
import rolesRoutes from "./roles.routes"; 
import salesOrderItemsRoutes from "./salesOrderItems.routes"; 
import salesOrdersRoutes from "./salesOrders.routes"; 
import stackingLogsRoutes from "./stackingLogs.routes"; 
import subModulesRoutes from "./subModules.routes"; 
import supplyLogsRoutes from "./supplyLogs.routes"; 
import usersRoutes from "./users.routes"; 
import vehiclesRoutes from "./vehicles.routes"; 
import vendorPaymentsRoutes from "./vendorPayments.routes"; 
import vendorsRoutes from "./vendors.routes"; 

export default class Routes {
	constructor(app: Application) {
		app.use("/", 
			homeRoutes, analyticsRoutes, appDefaultsRoutes, authRoutes, categoriesRoutes, approvalsRoutes, aclsRoutes, customersRoutes, 
			discountsRoutes, invoicePaymentsRoutes, invoicesRoutes, logsRoutes, modulesRoutes, productsRoutes, roleAclsRoutes, 
			rolesRoutes, salesOrderItemsRoutes, salesOrdersRoutes, subModulesRoutes, vendorsRoutes, purchaseOrdersRoutes, machinesRoutes, 
			vendorPaymentsRoutes, fuelPurchasesRoutes, expensesRoutes, rawMaterialsRoutes, rawMaterialStockLogsRoutes, finishedGoodsRoutes, 
			finishedGoodStockLogsRoutes, productionTeamsRoutes, productionBatchesRoutes, productionQcLogsRoutes, productionFuelLogsRoutes, 
			machineMaintenanceLogsRoutes, stackingLogsRoutes, vehiclesRoutes, businessRulesRoutes, deliveryAssignmentsRoutes, supplyLogsRoutes, 
			logisticsFuelLogsRoutes, usersRoutes, 
		);
	}
}