import { Model, Table, Column, DataType } from "sequelize-typescript";
import { db_end, db_start } from "../config/config";

export interface IAppDefault {
	id?: number;
	unique_id?: string;
	criteria?: string;
	data_type?: string;
	value?: string;
	status?: number;
}

@Table({
	tableName: `${db_start}api_defaults${db_end}`
})
export default class AppDefault extends Model {
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
		type: DataType.STRING(50),
		allowNull: false,
		field: "criteria"
	})
	criteria?: string;

	@Column({
		type: DataType.STRING(10),
		allowNull: false,
		field: "data_type"
	})
	data_type?: string;

	@Column({
		type: DataType.TEXT,
		allowNull: true,
		field: "value"
	})
	value?: string;

	@Column({
		type: DataType.INTEGER({ length: 1 }),
		field: "status"
	})
	status?: number;
}