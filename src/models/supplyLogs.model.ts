import { Model, Table, Column, DataType } from "sequelize-typescript";
import { db_end, db_start } from "../config/config";
import SalesOrder from "./salesOrders.model";
import SalesOrderItem from "./salesOrderItems.model";
import DeliveryAssignment from "./deliveryAssignments.model";
import Customer from "./customers.model";
import Product from "./products.model";
// Import employer model here when you implement it's module
import Vehicle from "./vehicles.model";
import User from "./users.model";

export interface ISupplyLog {
	id?: number;
	unique_id?: string;
	delivery_assignment_unique_id: string;
	sales_order_unique_id: string;
	sales_order_item_unique_id: string;
	customer_unique_id: string;
	product_unique_id: string;
	vehicle_unique_id: string;
	// driver_unique_id: string; // Uncomment when you implement employee module
	site_address: string;
	delivery_date: Date;
	blocks_loaded: number;
	blocks_dropped: number;
	blocks_returned: number;
	breakage_quantity: number;
	notes?: string;
	created_by?: string;
	status?: number;
}

@Table({
	tableName: `${db_start}supply_logs${db_end}`
})
export default class SupplyLog extends Model {
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
		field: "delivery_assignment_unique_id",
		references: {
			model: DeliveryAssignment,
			key: "unique_id"
		}
	})
	delivery_assignment_unique_id?: string;

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
		field: "sales_order_item_unique_id",
		references: {
			model: SalesOrderItem,
			key: "unique_id"
		}
	})
	sales_order_item_unique_id?: string;

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
		type: DataType.STRING(40),
		allowNull: false,
		field: "vehicle_unique_id",
		references: {
			model: Vehicle,
			key: "unique_id"
		}
	})
	vehicle_unique_id?: string;

	// @Column({
	// 	type: DataType.STRING(40),
	// 	allowNull: true,
	// 	field: "driver_unique_id",
	// 	references: {
	// 		model: Employee,
	// 		key: "unique_id"
	// 	}
	// })
	// driver_unique_id?: string; // Uncomment when you implement employee module

	@Column({
		type: DataType.STRING(300),
		allowNull: false,
		field: "site_address"
	})
	site_address?: string;

	@Column({
		type: DataType.DATE,
		allowNull: false,
		field: "delivery_date"
	})
	delivery_date?: string;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "blocks_loaded"
	})
	blocks_loaded?: number;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "blocks_dropped"
	})
	blocks_dropped?: number;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "blocks_returned"
	})
	blocks_returned?: number;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "breakage_quantity"
	})
	breakage_quantity?: number;

	@Column({
		type: DataType.TEXT,
		allowNull: true,
		field: "notes"
	})
	notes?: string;

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