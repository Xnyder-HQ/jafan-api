import { Model, Table, Column, DataType } from "sequelize-typescript";
import { db_end, db_start } from "../config/config";
import User from "./users.model";

export interface IRawMaterial {
	id?: number;
	unique_id?: string;
	reference: string;
	name: string;
	type?: string;
	description?: string;
	unit_of_measure?: string;
	current_quantity: number;
	reorder_level?: number;
	created_by?: string;
	status?: number;
}

@Table({
	tableName: `${db_start}raw_materials${db_end}`
})
export default class RawMaterial extends Model {
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
		type: DataType.STRING(300),
		allowNull: false,
		field: "name"
	})
	name?: string;

	@Column({
		type: DataType.STRING(50),
		allowNull: true,
		field: "type"
	})
	type?: string;

	@Column({
		type: DataType.TEXT,
		allowNull: true,
		field: "description"
	})
	description?: string;

	@Column({
		type: DataType.STRING(100),
		allowNull: true,
		field: "unit_of_measure"
	})
	unit_of_measure?: string;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "current_quantity"
	})
	current_quantity?: number;

	@Column({
		type: DataType.FLOAT,
		allowNull: true,
		field: "reorder_level"
	})
	reorder_level?: number;

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