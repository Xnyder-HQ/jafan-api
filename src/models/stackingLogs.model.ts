import { Model, Table, Column, DataType } from "sequelize-typescript";
import { db_end, db_start } from "../config/config";
// Import employer model here when you implement it's module
import FinishedGood from "./finishedGoods.model";
import User from "./users.model";

export interface IStackingLog {
	id?: number;
	unique_id?: string;
	finished_good_unique_id: string;
	blocks_stacked: number;
	stacking_rate: number;
	breakage_quantity: number;
	total_cost: number;
	stack_date: Date;
	notes?: string;
	// stacked_by: string; // Uncomment when you implement employee module
	created_by?: string;
	status?: number;
}

@Table({
	tableName: `${db_start}stacking_logs${db_end}`
})
export default class StackingLog extends Model {
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
		field: "finished_good_unique_id",
		references: {
			model: FinishedGood,
			key: "unique_id"
		}
	})
	finished_good_unique_id?: string;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "blocks_stacked"
	})
	blocks_stacked?: number;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "stacking_rate"
	})
	stacking_rate?: number;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "breakage_quantity"
	})
	breakage_quantity?: number;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "total_cost"
	})
	total_cost?: number;

	@Column({
		type: DataType.DATE,
		allowNull: false,
		field: "stack_date"
	})
	stack_date?: string;

	@Column({
		type: DataType.TEXT,
		allowNull: true,
		field: "notes"
	})
	notes?: string;

	// @Column({
	// 	type: DataType.STRING(40),
	// 	allowNull: true,
	// 	field: "stacked_by",
	// 	references: {
	// 		model: Employee,
	// 		key: "unique_id"
	// 	}
	// })
	// stacked_by?: string; // Uncomment when you implement employee module

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