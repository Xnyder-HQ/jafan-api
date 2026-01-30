import { Model, Table, Column, DataType } from "sequelize-typescript";
import { db_end, db_start } from "../config/config";

export interface IApiKey {
	id?: number;
	unique_id?: string;
	type?: string;
	alias?: string;
	api_key?: string;
	status?: number;
}

@Table({
	tableName: `${db_start}api_keys${db_end}`
})
export default class ApiKey extends Model {
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
		field: "type"
	})
	type?: string;

	@Column({
		type: DataType.STRING(100),
		allowNull: true,
		field: "alias"
	})
	alias?: string;

	@Column({
		type: DataType.STRING(50),
		allowNull: false,
		field: "api_key"
	})
	api_key?: string;

	@Column({
		type: DataType.INTEGER({ length: 1 }),
		field: "status"
	})
	status?: number;
}