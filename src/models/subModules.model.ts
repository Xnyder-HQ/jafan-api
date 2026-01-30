import { Model, Table, Column, DataType } from "sequelize-typescript";
import { db_end, db_start } from "../config/config";
import Module from "./modules.model";

export interface ISubModule {
	id?: number;
	unique_id: string;
	module_unique_id?: string;
	name: string;
	stripped: string;
	status?: number;
}

@Table({
	tableName: `${db_start}sub_modules${db_end}`
})
export default class SubModule extends Model {
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
		field: "module_unique_id",
		references: {
			model: Module,
			key: "unique_id"
		}
	})
	module_unique_id?: string;

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
		type: DataType.INTEGER({ length: 1 }),
		field: "status"
	})
	status?: number;
}