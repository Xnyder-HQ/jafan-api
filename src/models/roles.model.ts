import { Model, Table, Column, DataType } from "sequelize-typescript";
import { db_end, db_start } from "../config/config";

export interface IRole {
	id?: number;
	unique_id: string;
	name: string;
	stripped: string;
	description?: string;
	status?: number;
}

@Table({
	tableName: `${db_start}roles${db_end}`
})
export default class Role extends Model {
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
		type: DataType.STRING(200),
		allowNull: false,
		field: "name"
	})
	name?: string;

	@Column({
		type: DataType.STRING(200),
		allowNull: false,
		field: "stripped"
	})
	stripped?: string;

	@Column({
		type: DataType.STRING(3000),
		allowNull: true,
		field: "description"
	})
	description?: string;

	@Column({
		type: DataType.INTEGER({ length: 1 }),
		field: "status"
	})
	status?: number;
}