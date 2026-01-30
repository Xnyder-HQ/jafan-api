import { Model, Table, Column, DataType } from "sequelize-typescript";
import { db_end, db_start } from "../config/config";
import SalesOrder from "./salesOrders.model";
import Invoice from "./invoices.model";
import User from "./users.model";

export interface IDiscount {
	id?: number;
	unique_id?: string;
	sales_order_unique_id: string;
	invoice_unique_id?: string;
	discount_amount: number;
	reason?: string;
	created_by: string;
	approved_by?: string;
	status?: number;
}

@Table({
	tableName: `${db_start}discounts${db_end}`
})
export default class Discount extends Model {
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
		field: "sales_order_unique_id",
		references: {
			model: SalesOrder,
			key: "unique_id"
		}
	})
	sales_order_unique_id?: string;

	@Column({
		type: DataType.STRING(40),
		allowNull: true,
		field: "invoice_unique_id",
		references: {
			model: Invoice,
			key: "unique_id"
		}
	})
	invoice_unique_id?: string;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "discount_amount"
	})
	discount_amount?: number;

	@Column({
		type: DataType.STRING(1000),
		allowNull: true,
		field: "reason"
	})
	reason?: string;

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