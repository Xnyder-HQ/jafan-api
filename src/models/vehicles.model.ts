import { Model, Table, Column, DataType } from "sequelize-typescript";
import { db_end, db_start } from "../config/config";
// import Employee from "./employees.model"; // Import employer model here when you implement it's module
import User from "./users.model";

export interface IVehicle {
	id?: number;
	unique_id?: string;
	reference: string;
	code: string;
	plate_number: string;
	type: string;
	capacity_unit: string;
	capacity_value: number;
	fuel_type: string;
	benchmark_fuel_liters: number;
	expected_trips_per_benchmark: number;
	purchase_date?: Date;
	availability_status: string;
	notes?: string;
	is_active?: boolean;
	// assigned_driver: string; // Uncomment when you implement employee module
	created_by?: string;
	status?: number;
}

@Table({
	tableName: `${db_start}vehicles${db_end}`
})
export default class Vehicle extends Model {
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
		type: DataType.STRING(20),
		allowNull: false,
		field: "reference"
	})
	reference?: string;

	@Column({
		type: DataType.STRING(50),
		allowNull: false,
		field: "code"
	})
	code?: string;
	
	@Column({
		type: DataType.STRING(20),
		allowNull: false,
		field: "plate_number"
	})
	plate_number?: string;

	@Column({
		type: DataType.STRING(50),
		allowNull: false,
		field: "type"
	})
	type?: string;

	@Column({
		type: DataType.STRING(50),
		allowNull: false,
		field: "capacity_unit"
	})
	capacity_unit?: string;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "capacity_value"
	})
	capacity_value?: number;

	@Column({
		type: DataType.STRING(50),
		allowNull: false,
		field: "fuel_type"
	})
	fuel_type?: string;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "benchmark_fuel_liters"
	})
	benchmark_fuel_liters?: number;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "expected_trips_per_benchmark"
	})
	expected_trips_per_benchmark?: number;

	@Column({
		type: DataType.DATEONLY,
		allowNull: true,
		field: "purchase_date"
	})
	purchase_date?: string;

	@Column({
		type: DataType.STRING(20),
		allowNull: false,
		field: "availability_status"
	})
	availability_status?: string;
	
	@Column({
		type: DataType.TEXT,
		allowNull: true,
		field: "notes"
	})
	notes?: string;

	@Column({
		type: DataType.BOOLEAN,
		allowNull: false,
		defaultValue: false,
		field: "is_active"
	})
	is_active?: string;

	// @Column({
	// 	type: DataType.STRING(40),
	// 	allowNull: false,
	// 	field: "assigned_driver",
	// 	references: {
	// 		model: Employee,
	// 		key: "unique_id"
	// 	}
	// })
	// assigned_driver?: string; // Uncomment when you implement employee module

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