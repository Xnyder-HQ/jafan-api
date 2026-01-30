import { Model, Table, Column, DataType } from "sequelize-typescript";
import { db_end, db_start } from "../config/config";
import RawMaterial from "./rawMaterials.model";
import User from "./users.model";

export interface IRawMaterialStockLog {
	id?: number;
	unique_id?: string;
	raw_material_unique_id: string;
	movement_type: string;
	quantity: number;
	unit_cost?: number;
	quantity_after: number;
	source_module: string;
	reference?: string;
	created_by?: string;
	status?: number;
}

@Table({
	tableName: `${db_start}raw_material_stock_logs${db_end}`
})
export default class RawMaterialStockLog extends Model {
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
		field: "raw_material_unique_id",
		references: {
			model: RawMaterial,
			key: "unique_id"
		}
	})
	raw_material_unique_id?: string;

	@Column({
		type: DataType.STRING(20),
		allowNull: false,
		field: "movement_type"
	})
	movement_type?: string;
	
	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "quantity"
	})
	quantity?: number;

	@Column({
		type: DataType.FLOAT,
		allowNull: true,
		field: "unit_cost"
	})
	unit_cost?: number;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "quantity_after"
	})
	quantity_after?: number;

	@Column({
		type: DataType.STRING(100),
		allowNull: false,
		field: "source_module"
	})
	source_module?: string;

	@Column({
		type: DataType.STRING(40),
		allowNull: true,
		field: "reference"
	})
	reference?: string;

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