import { Model, Table, Column, DataType } from "sequelize-typescript";
import { db_end, db_start } from "../config/config";
import Product from "./products.model";
import User from "./users.model";

export interface IFinishedGood {
	id?: number;
	unique_id?: string;
	product_unique_id?: string;
	reference: string;
	name: string;
	type?: string;
	description?: string;
	unit_of_measure: string;
	current_quantity: number;
	unit_cost: number;
	selling_price: number;
	created_by?: string;
	status?: number;
}

@Table({
	tableName: `${db_start}finished_goods${db_end}`
})
export default class FinishedGood extends Model {
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
		field: "product_unique_id",
		references: {
			model: Product,
			key: "unique_id"
		}
	})
	product_unique_id?: string;

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
		field: "current_quantity"
	})
	current_quantity?: number;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "unit_cost"
	})
	unit_cost?: number;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "selling_price"
	})
	selling_price?: number;

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