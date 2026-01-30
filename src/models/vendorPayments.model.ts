import { Model, Table, Column, DataType } from "sequelize-typescript";
import { db_end, db_start } from "../config/config";
import Vendor from "./vendors.model";
import PurchaseOrder from "./purchaseOrders.model";
import User from "./users.model";

export interface IVendorPayment {
	id?: number;
	unique_id?: string;
	vendor_unique_id: string;
	purchase_order_unique_id?: string;
	amount_paid: number;
	payment_date: Date;
	payment_method: string;
	receipt_reference?: string;
	notes?: string;
	receipt_image?: string;
	receipt_image_public_id?: string;
	created_by?: string;
	facilitated_by?: string;
	status?: number;
}

@Table({
	tableName: `${db_start}vendor_payments${db_end}`
})
export default class VendorPayment extends Model {
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
		field: "purchase_order_unique_id",
		references: {
			model: PurchaseOrder,
			key: "unique_id"
		}
	})
	purchase_order_unique_id?: string;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "amount_paid"
	})
	amount_paid?: number;

	@Column({
		type: DataType.DATE,
		allowNull: false,
		field: "payment_date"
	})
	payment_date?: string;

	@Column({
		type: DataType.STRING(20),
		allowNull: false,
		field: "payment_method"
	})
	payment_method?: string;

	@Column({
		type: DataType.STRING(200),
		allowNull: true,
		field: "receipt_reference"
	})
	receipt_reference?: string;

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
		type: DataType.STRING(40),
		allowNull: true,
		field: "facilitated_by",
		references: {
			model: User, 
			key: "unique_id"
		}
	})
	facilitated_by?: string;

	@Column({
		type: DataType.INTEGER({ length: 1 }),
		field: "status"
	})
	status?: number;
}