import { Model, Table, Column, DataType } from "sequelize-typescript";
import { db_end, db_start } from "../config/config";
import User from "./users.model";

export interface IBusinessRule {
	id?: number;
	unique_id?: string;
	rule_key: string;
	rule_value: number;
	value_type: string;
	applies_to: string;
	notes?: string;
	is_active?: boolean;
	updated_by?: string;
	status?: number;
}

@Table({
	tableName: `${db_start}business_rules${db_end}`
})
export default class BusinessRule extends Model {
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
		type: DataType.STRING(100),
		allowNull: false,
		field: "rule_key"
	})
	rule_key?: string;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "rule_value"
	})
	rule_value?: number;
	
	@Column({
		type: DataType.STRING(20),
		allowNull: false,
		field: "value_type"
	})
	value_type?: string;

	@Column({
		type: DataType.STRING(100),
		allowNull: false,
		field: "applies_to"
	})
	applies_to?: string;

	@Column({
		type: DataType.TEXT,
		allowNull: true,
		field: "notes"
	})
	notes?: string;

	@Column({
		type: DataType.BOOLEAN,
		allowNull: false,
		defaultValue: false,
		field: "is_active"
	})
	is_active?: string;

	@Column({
		type: DataType.STRING(40),
		allowNull: true,
		field: "updated_by",
		references: {
			model: User,
			key: "unique_id"
		}
	})
	updated_by?: string;

	@Column({
		type: DataType.INTEGER({ length: 1 }),
		field: "status"
	})
	status?: number;
}