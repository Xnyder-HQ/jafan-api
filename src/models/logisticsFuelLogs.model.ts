import { Model, Table, Column, DataType } from "sequelize-typescript";
import { db_end, db_start } from "../config/config";
// Import employer model here when you implement it's module
import Vehicle from "./vehicles.model";
import User from "./users.model";

export interface ILogisticsFuelLog {
	id?: number;
	unique_id?: string;
	vehicle_unique_id: string;
	// driver_unique_id: string; // Uncomment when you implement employee module
	fuel_type: string;
	liters_dispensed: number;
	price_per_liter: number;
	benchmark_liters: number;
	expected_trips: number;
	actual_trips: number;
	dispense_date: Date;
	notes?: string;
	created_by?: string;
	status?: number;
}

@Table({
	tableName: `${db_start}logistics_fuel_logs${db_end}`
})
export default class LogisticsFuelLog extends Model {
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
		type: DataType.STRING(50),
		allowNull: false,
		field: "fuel_type"
	})
	fuel_type?: string;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "liters_dispensed"
	})
	liters_dispensed?: number;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "price_per_liter"
	})
	price_per_liter?: number;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "benchmark_liters"
	})
	benchmark_liters?: number;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "expected_trips"
	})
	expected_trips?: number;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "actual_trips"
	})
	actual_trips?: number;

	@Column({
		type: DataType.DATE,
		allowNull: false,
		field: "dispense_date"
	})
	dispense_date?: string;

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