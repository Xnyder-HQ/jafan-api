import { Model, Table, Column, DataType } from "sequelize-typescript";
import { db_end, db_start } from "../config/config";
import User from "./users.model";

export interface IMachine {
	id?: number;
	unique_id?: string;
	reference: string;
	name: string;
	code: string;
	type: string;
	description?: string;
	supported_block_types: string;
	expected_blocks_per_day?: number;
	fuel_type: string;
	installed_date?: Date;
	is_active?: boolean;
	created_by?: string;
	status?: number;
}

@Table({
	tableName: `${db_start}machines${db_end}`
})
export default class Machine extends Model {
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
		allowNull: false,
		field: "code"
	})
	code?: string;

	@Column({
		type: DataType.STRING(50),
		allowNull: false,
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
		type: DataType.TEXT,
		allowNull: false,
		field: "supported_block_types",
		get() {
			const _supported_block_types = this.getDataValue('supported_block_types');
			return (_supported_block_types === null || _supported_block_types === undefined ? null : JSON.parse(_supported_block_types));
		},
		set(value) {
			const _supported_block_types = JSON.stringify(value);
			this.setDataValue('supported_block_types', value === null ? null : _supported_block_types);
		}
	})
	supported_block_types?: string;

	@Column({
		type: DataType.FLOAT,
		allowNull: true,
		field: "expected_blocks_per_day"
	})
	expected_blocks_per_day?: number;

	@Column({
		type: DataType.STRING(50),
		allowNull: false,
		field: "fuel_type"
	})
	fuel_type?: string;

	@Column({
		type: DataType.DATEONLY,
		allowNull: true,
		field: "installed_date"
	})
	installed_date?: string;

	@Column({
		type: DataType.BOOLEAN,
		allowNull: false,
		defaultValue: false,
		field: "is_active"
	})
	is_active?: string;

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