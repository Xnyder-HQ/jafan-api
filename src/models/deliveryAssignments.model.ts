import { Model, Table, Column, DataType } from "sequelize-typescript";
import { db_end, db_start } from "../config/config";
import SalesOrder from "./salesOrders.model";
// Import employer model here when you implement it's module
import Vehicle from "./vehicles.model";
import User from "./users.model";

export interface IDeliveryAssignment {
	id?: number;
	unique_id?: string;
	sales_order_unique_id: string;
	vehicle_unique_id?: string;
	// driver_unique_id?: string; // Uncomment when you implement employee module
	scheduled_date: Date;
	assigned_at?: Date;
	auto_assigned?: boolean;
	started_at?: Date;
	completed_at?: Date;
	notes?: string;
	assignment_status: string;
	updated_by?: string;
	status?: number;
}

@Table({
	tableName: `${db_start}delivery_assignments${db_end}`
})
export default class DeliveryAssignment extends Model {
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
		type: DataType.DATEONLY,
		allowNull: false,
		field: "scheduled_date"
	})
	scheduled_date?: string;

	@Column({
		type: DataType.DATE,
		allowNull: true,
		field: "assigned_at"
	})
	assigned_at?: string;

	@Column({
		type: DataType.BOOLEAN,
		allowNull: false,
		defaultValue: true,
		field: "auto_assigned"
	})
	auto_assigned?: string;

	@Column({
		type: DataType.DATE,
		allowNull: true,
		field: "started_at"
	})
	started_at?: string;

	@Column({
		type: DataType.DATE,
		allowNull: true,
		field: "completed_at"
	})
	completed_at?: string;

	@Column({
		type: DataType.TEXT,
		allowNull: true,
		field: "notes"
	})
	notes?: string;

	@Column({
		type: DataType.STRING(20),
		allowNull: false,
		field: "assignment_status"
	})
	assignment_status?: string;

	@Column({
		type: DataType.STRING(40),
		allowNull: false,
		field: "updated_by",
		references: {
			model: User,
			key: "unique_id"
		}
	})
	updated_by?: string;

	@Column({
		type: DataType.INTEGER({ length: 1 }),
		field: "status"
	})
	status?: number;
}