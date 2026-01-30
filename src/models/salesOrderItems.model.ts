import { Model, Table, Column, DataType } from "sequelize-typescript";
import { db_end, db_start } from "../config/config";
import SalesOrder from "./salesOrders.model";
import Product from "./products.model";
import User from "./users.model";

export interface ISalesOrderItem {
	id?: number;
	unique_id?: string;
	sales_order_unique_id: string;
	product_unique_id: string;
	product_name: string;
	unit_price: number;
	quantity_ordered: number;
	quantity_supplied: number;
	total_price: number;
	status?: number;
}

@Table({
	tableName: `${db_start}sales_order_items${db_end}`
})
export default class SalesOrderItem extends Model {
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
		field: "product_unique_id",
		references: {
			model: Product,
			key: "unique_id"
		}
	})
	product_unique_id?: string;

	@Column({
		type: DataType.STRING(300),
		allowNull: false,
		field: "product_name"
	})
	product_name?: string;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "unit_price"
	})
	unit_price?: number;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "quantity_ordered"
	})
	quantity_ordered?: number;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "quantity_supplied"
	})
	quantity_supplied?: number;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "total_price"
	})
	total_price?: number;

	@Column({
		type: DataType.INTEGER({ length: 1 }),
		field: "status"
	})
	status?: number;
}