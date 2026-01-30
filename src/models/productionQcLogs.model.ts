import { Model, Table, Column, DataType } from "sequelize-typescript";
import { db_end, db_start } from "../config/config";
import Machine from "./machines.model";
import ProductionTeam from "./productionTeams.model";
import ProductionBatches from "./productionBatches.model";
import FinishedGood from "./finishedGoods.model";
import User from "./users.model";

export interface IProductionQcLog {
	id?: number;
	unique_id?: string;
	machine_unique_id: string;
	production_batch_unique_id: string;
	production_team_unique_id: string;
	finished_good_unique_id: string;
	defective_quantity: number;
	qc_date: Date;
	notes?: string;
	created_by?: string;
	status?: number;
}

@Table({
	tableName: `${db_start}production_qc_logs${db_end}`
})
export default class ProductionQcLog extends Model {
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
		field: "machine_unique_id",
		references: {
			model: Machine,
			key: "unique_id"
		}
	})
	machine_unique_id?: string;

	@Column({
		type: DataType.STRING(40),
		allowNull: false,
		field: "production_batch_unique_id",
		references: {
			model: ProductionBatches,
			key: "unique_id"
		}
	})
	production_batch_unique_id?: string;

	@Column({
		type: DataType.STRING(40),
		allowNull: false,
		field: "production_team_unique_id",
		references: {
			model: ProductionTeam,
			key: "unique_id"
		}
	})
	production_team_unique_id?: string;

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
		field: "defective_quantity"
	})
	defective_quantity?: number;

	@Column({
		type: DataType.DATEONLY,
		allowNull: false,
		field: "qc_date"
	})
	qc_date?: string;

	@Column({
		type: DataType.TEXT,
		allowNull: true,
		field: "notes"
	})
	notes?: string;

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