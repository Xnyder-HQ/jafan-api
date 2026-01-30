import { Model, Table, Column, DataType } from "sequelize-typescript";
import { db_end, db_start } from "../config/config";
import Vendor from "./vendors.model";
import RawMaterial from "./rawMaterials.model";
import User from "./users.model";

export interface IFuelPurchase {
	id?: number;
	unique_id?: string;
	vendor_unique_id: string;
	raw_material_unique_id?: string;
	reference: string;
	fuel_type: string;
	liters_purchased: number;
	price_per_liter: number;
	total_cost: number;
	purchase_date: Date;
	notes?: string;
	receipt_image?: string;
	receipt_image_public_id?: string;
	payment_status: string;
	delivery_status: string;
	created_by?: string;
	status?: number;
}

@Table({
	tableName: `${db_start}fuel_purchases${db_end}`
})
export default class FuelPurchase extends Model {
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
		field: "vendor_unique_id",
		references: {
			model: Vendor,
			key: "unique_id"
		}
	})
	vendor_unique_id?: string;

	@Column({
		type: DataType.STRING(40),
		allowNull: true,
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
		field: "reference"
	})
	reference?: string;

	@Column({
		type: DataType.STRING(20),
		allowNull: false,
		field: "fuel_type"
	})
	fuel_type?: string;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "liters_purchased"
	})
	liters_purchased?: number;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "price_per_liter"
	})
	price_per_liter?: number;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "total_cost"
	})
	total_cost?: number;

	@Column({
		type: DataType.DATEONLY,
		allowNull: false,
		field: "purchase_date"
	})
	purchase_date?: string;

	@Column({
		type: DataType.TEXT,
		allowNull: true,
		field: "notes"
	})
	notes?: string;
	
	@Column({
		type: DataType.STRING(500),
		allowNull: true,
		field: "receipt_image"
	})
	receipt_image?: string;

	@Column({
		type: DataType.STRING(500),
		allowNull: true,
		field: "receipt_image_public_id"
	})
	receipt_image_public_id?: string;

	@Column({
		type: DataType.STRING(20),
		allowNull: false,
		field: "payment_status"
	})
	payment_status?: string;

	@Column({
		type: DataType.STRING(20),
		allowNull: false,
		field: "delivery_status"
	})
	delivery_status?: string;

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