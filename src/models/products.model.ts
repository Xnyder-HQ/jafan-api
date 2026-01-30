import { Model, Table, Column, DataType } from "sequelize-typescript";
import { db_end, db_start } from "../config/config";
import Category from "./categories.model";
import User from "./users.model";

export interface IProduct {
	id?: number;
	unique_id?: string;
	category_unique_id?: string;
	reference: string;
	name: string;
	type?: string;
	description?: string;
	unit_of_measure: string;
	quantity: number;
	total_quantity?: number;
	price: number;
	cost_price?: number;
	is_outside_town_eligible?: boolean;
	is_inventory_tracked?: boolean;
	created_by?: string;
	status?: number;
}

@Table({
	tableName: `${db_start}products${db_end}`
})
export default class Product extends Model {
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
		field: "category_unique_id",
		references: {
			model: Category,
			key: "unique_id"
		}
	})
	category_unique_id?: string;

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
		allowNull: false,
		field: "unit_of_measure"
	})
	unit_of_measure?: string;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "quantity"
	})
	quantity?: number;

	@Column({
		type: DataType.FLOAT,
		allowNull: true,
		field: "total_quantity"
	})
	total_quantity?: number;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "price"
	})
	price?: number;

	@Column({
		type: DataType.FLOAT,
		allowNull: true,
		field: "cost_price"
	})
	cost_price?: number;

	@Column({
		type: DataType.BOOLEAN,
		allowNull: false,
		defaultValue: false,
		field: "is_outside_town_eligible"
	})
	is_outside_town_eligible?: string;

	@Column({
		type: DataType.BOOLEAN,
		allowNull: false,
		defaultValue: false,
		field: "is_inventory_tracked"
	})
	is_inventory_tracked?: string;

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