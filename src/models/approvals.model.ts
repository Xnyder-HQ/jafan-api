import { Model, Table, Column, DataType } from "sequelize-typescript";
import { db_end, db_start } from "../config/config";
import User from "./users.model";
import Module from "./modules.model";
import SubModule from "./subModules.model";

export interface IApproval {
	id?: number;
	unique_id: string;
	user_unique_id: string;
	module_unique_id: string;
	sub_module_unique_id?: string;
	view: boolean;
	add: boolean;
	edit: boolean;
	delete: boolean;
	elevated_role: boolean;
	acl_expiring?: Date;
	approval_status: string;
	status?: number;
}

@Table({
	tableName: `${db_start}approvals${db_end}`
})
export default class Approval extends Model {
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
		field: "user_unique_id",
		references: {
			model: User,
			key: "unique_id"
		}
	})
	user_unique_id?: string;

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
		type: DataType.DATE,
		allowNull: true,
		field: "acl_expiring"
	})
	acl_expiring?: string;

	@Column({
		type: DataType.STRING(20),
		allowNull: false,
		field: "approval_status"
	})
	approval_status?: string;

	@Column({
		type: DataType.INTEGER({ length: 1 }),
		field: "status"
	})
	status?: number;
}