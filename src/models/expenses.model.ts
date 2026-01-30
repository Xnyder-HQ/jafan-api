import { Model, Table, Column, DataType } from "sequelize-typescript";
import { db_end, db_start } from "../config/config";
import VendorPayment from "./vendorPayments.model";
import PurchaseOrder from "./purchaseOrders.model";
import FuelPurchase from "./fuelPurchases.model";
import MachineMaintenanceLog from "./machineMaintenanceLogs.model";
import StackingLog from "./stackingLogs.model";
import User from "./users.model";

export interface IExpense {
	id?: number;
	unique_id?: string;
	purchase_order_unique_id?: string;
	fuel_purchase_unique_id?: string;
	vendor_payment_unique_id?: string;
	machine_maintenance_log_unique_id?: string;
	stacking_log_unique_id?: string;
	// coa_account_code
	category: string;
	amount: number;
	expense_date: Date;
	notes?: string;
	receipt_image?: string;
	receipt_image_public_id?: string;
	created_by: string;
	status?: number;
}

@Table({
	tableName: `${db_start}expenses${db_end}`
})
export default class Expense extends Model {
	[x: string]: any;
	@Column({
		type: DataType.BIGINT,
		allowNull: false,
		primaryKey: true,
		autoIncrement: true,
		field: "id"
	})
	id?: number;

	@Column({
		type: DataType.STRING(40),
		allowNull: false,
		unique: true,
		field: "unique_id"
	})
	unique_id?: string;

	@Column({
		type: DataType.STRING(40),
		allowNull: true,
		field: "purchase_order_unique_id",
		references: {
			model: PurchaseOrder,
			key: "unique_id"
		}
	})
	purchase_order_unique_id?: string;

	@Column({
		type: DataType.STRING(40),
		allowNull: true,
		field: "fuel_purchase_unique_id",
		references: {
			model: FuelPurchase,
			key: "unique_id"
		}
	})
	fuel_purchase_unique_id?: string;

	@Column({
		type: DataType.STRING(40),
		allowNull: true,
		field: "vendor_payment_unique_id",
		references: {
			model: VendorPayment,
			key: "unique_id"
		}
	})
	vendor_payment_unique_id?: string;

	@Column({
		type: DataType.STRING(40),
		allowNull: true,
		field: "machine_maintenance_log_unique_id",
		references: {
			model: MachineMaintenanceLog,
			key: "unique_id"
		}
	})
	machine_maintenance_log_unique_id?: string;

	@Column({
		type: DataType.STRING(40),
		allowNull: true,
		field: "stacking_log_unique_id",
		references: {
			model: StackingLog,
			key: "unique_id"
		}
	})
	stacking_log_unique_id?: string;

	// coa_account_code
	
	@Column({
		type: DataType.STRING(50),
		allowNull: false,
		field: "category"
	})
	category?: string;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "amount"
	})
	amount?: number;

	@Column({
		type: DataType.DATEONLY,
		allowNull: false,
		field: "expense_date"
	})
	expense_date?: string;

	@Column({
		type: DataType.TEXT,
		allowNull: true,
		field: "notes"
	})
	notes?: string;
	
	@Column({
		type: DataType.STRING(500),
		allowNull: true,
		field: "receipt_image"
	})
	receipt_image?: string;

	@Column({
		type: DataType.STRING(500),
		allowNull: true,
		field: "receipt_image_public_id"
	})
	receipt_image_public_id?: string;

	@Column({
		type: DataType.STRING(40),
		allowNull: false,
		field: "created_by",
		references: {
			model: User,
			key: "unique_id"
		}
	})
	created_by?: string;

	@Column({
		type: DataType.INTEGER({ length: 1 }),
		field: "status"
	})
	status?: number;
}