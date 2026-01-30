import { Model, Table, Column, DataType } from "sequelize-typescript";
import { db_end, db_start } from "../config/config";
import User from "./users.model";

export interface IVendor {
	id?: number;
	unique_id?: string;
	reference: string;
	type: string;
	name: string;
	contact_person?: string;
	email?: string;
	phone_number: string;
	alt_phone_number?: string;
	address?: string;
	total_spend: number;
	profile_image?: string;
	profile_image_public_id?: string;
	created_by?: string;
	status?: number;
}

@Table({
	tableName: `${db_start}vendors${db_end}`
})
export default class Vendor extends Model {
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
		type: DataType.STRING(50),
		allowNull: false,
		field: "reference"
	})
	reference?: string;

	@Column({
		type: DataType.STRING(50),
		allowNull: false,
		field: "type"
	})
	type?: string;

	@Column({
		type: DataType.STRING(200),
		allowNull: false,
		field: "name"
	})
	name?: string;

	@Column({
		type: DataType.STRING(200),
		allowNull: true,
		field: "contact_person"
	})
	contact_person?: string;

	@Column({
		type: DataType.STRING(255),
		allowNull: true,
		field: "email"
	})
	email?: string;

	@Column({
		type: DataType.STRING(40),
		allowNull: false,
		field: "phone_number"
	})
	phone_number?: string;

	@Column({
		type: DataType.STRING(40),
		allowNull: true,
		field: "alt_phone_number"
	})
	alt_phone_number?: string;

	@Column({
		type: DataType.STRING(300),
		allowNull: true,
		field: "address"
	})
	address?: string;

	@Column({
		type: DataType.FLOAT,
		allowNull: false,
		field: "total_spend"
	})
	total_spend?: number;

	@Column({
		type: DataType.STRING(500),
		allowNull: true,
		field: "profile_image"
	})
	profile_image?: string;

	@Column({
		type: DataType.STRING(500),
		allowNull: true,
		field: "profile_image_public_id"
	})
	profile_image_public_id?: string;

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