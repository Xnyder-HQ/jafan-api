import { Model, Table, Column, DataType } from "sequelize-typescript";
import { db_end, db_start } from "../config/config";
import Vendor from "./vendors.model";
import RawMaterial from "./rawMaterials.model";
import User from "./users.model";

export interface IPurchaseOrder {
	id?: number;
	unique_id?: string;
	vendor_unique_id: string;
	raw_material_unique_id?: string;
	reference: string;
	po_type: string;
	total_amount: number;
	amount_paid: number;
	balance_due: number;
	quantity?: number;
	order_date: Date;
	expected_delivery_date?: Date;
	notes?: string;
	payment_status: string;
	delivery_status: string;
	order_status: string;
	created_by?: string;
	approved_by?: string;
	status?: number;
}

@Table({
	tableName: `${db_start}purchase_orders${db_end}`
})
export default class PurchaseOrder extends Model {
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
		allowNull: false,
		field: "vendor_unique_id",
		references: {
			model: Vendor,
			key: "unique_id"
		}
	})
	vendor_unique_id?: string;

	@Column({
		type: DataType.STRING(40),
		allowNull: true,
		field: "raw_material_unique_id",
		references: {
			model: RawMaterial,
			key: "unique_id"
		}
	})
	raw_material_unique_id?: string;

	@Column({
		type: DataType.STRING(20),
		allowNull: false,
		field: "reference"
	})
	reference?: string;

	@Column({
		type: DataType.STRING(20),
		allowNull: false,
		field: "po_type"
	})
	po_type?: string;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "total_amount"
	})
	total_amount?: number;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "amount_paid"
	})
	amount_paid?: number;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "balance_due"
	})
	balance_due?: number;

	@Column({
		type: DataType.FLOAT,
		allowNull: true,
		field: "quantity"
	})
	quantity?: number;

	@Column({
		type: DataType.DATE,
		allowNull: false,
		field: "order_date"
	})
	order_date?: string;

	@Column({
		type: DataType.DATE,
		allowNull: true,
		field: "expected_delivery_date"
	})
	expected_delivery_date?: string;

	@Column({
		type: DataType.TEXT,
		allowNull: true,
		field: "notes"
	})
	notes?: string;

	@Column({
		type: DataType.STRING(20),
		allowNull: false,
		field: "payment_status"
	})
	payment_status?: string;

	@Column({
		type: DataType.STRING(20),
		allowNull: false,
		field: "delivery_status"
	})
	delivery_status?: string;

	@Column({
		type: DataType.STRING(20),
		allowNull: false,
		field: "order_status"
	})
	order_status?: string;

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
		type: DataType.STRING(40),
		allowNull: true,
		field: "approved_by",
		references: {
			model: User,
			key: "unique_id"
		}
	})
	approved_by?: string;

	@Column({
		type: DataType.INTEGER({ length: 1 }),
		field: "status"
	})
	status?: number;
}