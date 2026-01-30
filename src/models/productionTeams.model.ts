import { Model, Table, Column, DataType } from "sequelize-typescript";
import { db_end, db_start } from "../config/config";
import Machine from "./machines.model";
import User from "./users.model";

export interface IProductionTeam {
	id?: number;
	unique_id?: string;
	machine_unique_id?: string;
	name: string;
	is_active?: boolean;
	created_by?: string;
	status?: number;
}

@Table({
	tableName: `${db_start}production_teams${db_end}`
})
export default class ProductionTeam extends Model {
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
		type: DataType.STRING(300),
		allowNull: false,
		field: "name"
	})
	name?: string;

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