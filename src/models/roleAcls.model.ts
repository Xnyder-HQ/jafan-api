import { Model, Table, Column, DataType } from "sequelize-typescript";
import { db_end, db_start } from "../config/config";
import Role from "./roles.model";
import Module from "./modules.model";
import SubModule from "./subModules.model";

export interface IRoleAcl {
	id?: number;
	unique_id: string;
	role_unique_id: string;
	module_unique_id: string;
	sub_module_unique_id?: string;
	view: boolean;
	add: boolean;
	edit: boolean;
	delete: boolean;
	elevated_role: boolean;
	status?: number;
}

@Table({
	tableName: `${db_start}role_acls${db_end}`
})
export default class RoleAcl extends Model {
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
		field: "role_unique_id",
		references: {
			model: Role,
			key: "unique_id"
		}
	})
	role_unique_id?: string;

	@Column({
		type: DataType.STRING(40),
		allowNull: false,
		field: "module_unique_id",
		references: {
			model: Module,
			key: "unique_id"
		}
	})
	module_unique_id?: string;

	@Column({
		type: DataType.STRING(40),
		allowNull: true,
		field: "sub_module_unique_id",
		references: {
			model: SubModule,
			key: "unique_id"
		}
	})
	sub_module_unique_id?: string;

	@Column({
		type: DataType.BOOLEAN,
		allowNull: false,
		defaultValue: false,
		field: "view"
	})
	view?: string;

	@Column({
		type: DataType.BOOLEAN,
		allowNull: false,
		defaultValue: false,
		field: "add"
	})
	add?: string;

	@Column({
		type: DataType.BOOLEAN,
		allowNull: false,
		defaultValue: false,
		field: "edit"
	})
	edit?: string;

	@Column({
		type: DataType.BOOLEAN,
		allowNull: false,
		defaultValue: false,
		field: "delete"
	})
	delete?: string;

	@Column({
		type: DataType.BOOLEAN,
		allowNull: false,
		defaultValue: false,
		field: "elevated_role"
	})
	elevated_role?: string;

	@Column({
		type: DataType.INTEGER({ length: 1 }),
		field: "status"
	})
	status?: number;
}