import { Model, Table, Column, DataType } from "sequelize-typescript";
import { db_end, db_start } from "../config/config";
import Machine from "./machines.model";
import Vendor from "./vendors.model";
import User from "./users.model";

export interface IMachineMaintenanceLog {
	id?: number;
	unique_id?: string;
	machine_unique_id: string;
	vendor_unique_id?: string;
	service_date: Date;
	cost: number;
	next_service_date?: Date;
	notes: string;
	created_by?: string;
	status?: number;
}

@Table({
	tableName: `${db_start}machine_maintenance_logs${db_end}`
})
export default class MachineMaintenanceLog extends Model {
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
		field: "machine_unique_id",
		references: {
			model: Machine,
			key: "unique_id"
		}
	})
	machine_unique_id?: string;

	@Column({
		type: DataType.STRING(40),
		allowNull: true,
		field: "vendor_unique_id",
		references: {
			model: Vendor,
			key: "unique_id"
		}
	})
	vendor_unique_id?: string;

	@Column({
		type: DataType.DATEONLY,
		allowNull: false,
		field: "service_date"
	})
	service_date?: string;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "cost"
	})
	cost?: number;

	@Column({
		type: DataType.DATEONLY,
		allowNull: true,
		field: "next_service_date"
	})
	next_service_date?: string;

	@Column({
		type: DataType.TEXT,
		allowNull: false,
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