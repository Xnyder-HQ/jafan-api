import { Model, Table, Column, DataType } from "sequelize-typescript";
import { db_end, db_start } from "../config/config";
import Customer from "./customers.model";
// import Discount from "./discounts.model";
import User from "./users.model";

export interface ISalesOrder {
	id?: number;
	unique_id?: string;
	customer_unique_id?: string;
	// discount_unique_id?: string;
	reference: string;
	total_amount: number;
	discount_amount?: number;
	discount_reason?: string;
	outside_town?: boolean;
	outside_town_location?: string;
	estimated_trip_liters?: number;
	outside_town_surcharge?: number;
	amount_payable: number;
	total_items_ordered: number;
	total_items_dropped: number;
	notes?: string;
	order_status: string;
	created_by?: string;
	approved_by?: string;
	status?: number;
}

@Table({
	tableName: `${db_start}sales_orders${db_end}`
})
export default class SalesOrder extends Model {
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
		field: "customer_unique_id",
		references: {
			model: Customer,
			key: "unique_id"
		}
	})
	customer_unique_id?: string;

	// @Column({
	// 	type: DataType.STRING(40),
	// 	allowNull: true,
	// 	field: "discount_unique_id",
	// 	references: {
	// 		model: Discount,
	// 		key: "unique_id"
	// 	}
	// })
	// discount_unique_id?: string;

	@Column({
		type: DataType.STRING(20),
		allowNull: false,
		field: "reference"
	})
	reference?: string;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "total_amount"
	})
	total_amount?: number;

	@Column({
		type: DataType.FLOAT,
		allowNull: true,
		field: "discount_amount"
	})
	discount_amount?: number;

	@Column({
		type: DataType.STRING(1000),
		allowNull: true,
		field: "discount_reason"
	})
	discount_reason?: string;

	@Column({
		type: DataType.BOOLEAN,
		allowNull: false,
		defaultValue: true,
		field: "outside_town"
	})
	outside_town?: string;

	@Column({
		type: DataType.STRING(300),
		allowNull: true,
		field: "outside_town_location"
	})
	outside_town_location?: string;

	@Column({
		type: DataType.FLOAT,
		allowNull: true,
		field: "estimated_trip_liters"
	})
	estimated_trip_liters?: number;

	@Column({
		type: DataType.FLOAT,
		allowNull: true,
		field: "outside_town_surcharge"
	})
	outside_town_surcharge?: number;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "amount_payable"
	})
	amount_payable?: number;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "total_items_ordered"
	})
	total_items_ordered?: number;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "total_items_dropped"
	})
	total_items_dropped?: number;

	@Column({
		type: DataType.TEXT,
		allowNull: true,
		field: "notes"
	})
	notes?: string;

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