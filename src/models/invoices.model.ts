import { Model, Table, Column, DataType } from "sequelize-typescript";
import { db_end, db_start } from "../config/config";
import SalesOrder from "./salesOrders.model";
import Customer from "./customers.model";
import User from "./users.model";

export interface IInvoice {
	id?: number;
	unique_id?: string;
	sales_order_unique_id: string;
	customer_unique_id: string;
	invoice_date: Date;
	due_date: Date;
	invoice_type: string;
	subtotal_amount: number;
	discount_amount?: number;
	outside_town_surcharge: number;
	total_amount: number;
	amount_paid: number;
	balance_due: number;
	notes?: string;
	invoice_status: string;
	created_by: string;
	status?: number;
}

@Table({
	tableName: `${db_start}invoices${db_end}`
})
export default class Invoice extends Model {
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
		allowNull: false,
		field: "customer_unique_id",
		references: {
			model: Customer,
			key: "unique_id"
		}
	})
	customer_unique_id?: string;

	@Column({
		type: DataType.DATEONLY,
		allowNull: false,
		field: "invoice_date"
	})
	invoice_date?: string;

	@Column({
		type: DataType.DATEONLY,
		allowNull: false,
		field: "due_date"
	})
	due_date?: string;

	@Column({
		type: DataType.STRING(20),
		allowNull: false,
		field: "invoice_type"
	})
	invoice_type?: string;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "subtotal_amount"
	})
	subtotal_amount?: number;

	@Column({
		type: DataType.FLOAT,
		allowNull: true,
		field: "discount_amount"
	})
	discount_amount?: number;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "outside_town_surcharge"
	})
	outside_town_surcharge?: number;

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
		type: DataType.TEXT,
		allowNull: true,
		field: "notes"
	})
	notes?: string;

	@Column({
		type: DataType.STRING(20),
		allowNull: false,
		field: "invoice_status"
	})
	invoice_status?: string;

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