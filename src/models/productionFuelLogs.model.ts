import { Model, Table, Column, DataType } from "sequelize-typescript";
import { db_end, db_start } from "../config/config";
import Machine from "./machines.model";
import User from "./users.model";

export interface IProductionFuelLog {
	id?: number;
	unique_id?: string;
	machine_unique_id?: string;
	fuel_type: string;
	liters_dispensed: number;
	destination: string;
	dispensed_date: Date;
	notes?: string;
	dispensed_by?: string;
	status?: number;
}

@Table({
	tableName: `${db_start}production_fuel_logs${db_end}`
})
export default class ProductionFuelLog extends Model {
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
		field: "machine_unique_id",
		references: {
			model: Machine,
			key: "unique_id"
		}
	})
	machine_unique_id?: string;

	@Column({
		type: DataType.STRING(20),
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
		type: DataType.STRING(100),
		allowNull: false,
		field: "destination"
	})
	destination?: string;

	@Column({
		type: DataType.DATEONLY,
		allowNull: false,
		field: "dispensed_date"
	})
	dispensed_date?: string;

	@Column({
		type: DataType.TEXT,
		allowNull: true,
		field: "notes"
	})
	notes?: string;

	@Column({
		type: DataType.STRING(40),
		allowNull: false,
		field: "dispensed_by",
		references: {
			model: User,
			key: "unique_id"
		}
	})
	dispensed_by?: string;

	@Column({
		type: DataType.INTEGER({ length: 1 }),
		field: "status"
	})
	status?: number;
}