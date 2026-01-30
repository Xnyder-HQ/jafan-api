import { Model, Table, Column, DataType } from "sequelize-typescript";
import { db_end, db_start } from "../config/config";
import Invoice from "./invoices.model";
import Customer from "./customers.model";
import User from "./users.model";

export interface IInvoicePayment {
	id?: number;
	unique_id?: string;
	invoice_unique_id: string;
	customer_unique_id: string;
	payment_date: Date;
	payment_method: string;
	amount_paid: number;
	receipt_reference?: string;
	notes?: string;
	receipt_image?: string;
	receipt_image_public_id?: string;
	received_by: string;
	status?: number;
}

@Table({
	tableName: `${db_start}invoice_payments${db_end}`
})
export default class InvoicePayment extends Model {
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
		field: "invoice_unique_id",
		references: {
			model: Invoice,
			key: "unique_id"
		}
	})
	invoice_unique_id?: string;

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
		type: DataType.FLOAT,
		allowNull: false,
		field: "amount_paid"
	})
	amount_paid?: number;

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
		field: "received_by",
		references: {
			model: User,
			key: "unique_id"
		}
	})
	received_by?: string;

	@Column({
		type: DataType.INTEGER({ length: 1 }),
		field: "status"
	})
	status?: number;
}