import { Model, Table, Column, DataType } from "sequelize-typescript";
import { db_end, db_start } from "../config/config";
import Role from "./roles.model";

export interface IUser {
	id?: number;
	unique_id?: string;
	role_unique_id: string;
	method: string;
	firstname: string;
	middlename?: string;
	lastname: string;
	username?: string;
	email: string;
	phone_number?: string;
	alt_phone_number?: string;
	gender?: string;
	date_of_birth?: Date;
	address?: string;
	country?: string;
	state?: string;
	city?: string;
	privates: string;
	profile_image?: string;
	profile_image_public_id?: string;
	access: number;
	status?: number;
}

@Table({
	tableName: `${db_start}users${db_end}`
})
export default class User extends Model {
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
		field: "role_unique_id",
		references: {
			model: Role,
			key: "unique_id"
		}
	})
	role_unique_id?: string;

	@Column({
		type: DataType.STRING(50),
		allowNull: false,
		field: "method"
	})
	method?: string;

	@Column({
		type: DataType.STRING(50),
		allowNull: false,
		field: "firstname"
	})
	firstname?: string;

	@Column({
		type: DataType.STRING(50),
		allowNull: true,
		field: "middlename"
	})
	middlename?: string;

	@Column({
		type: DataType.STRING(50),
		allowNull: true,
		field: "lastname"
	})
	lastname?: string;

	@Column({
		type: DataType.STRING(100),
		allowNull: true,
		unique: true,
		field: "username"
	})
	username?: string;

	@Column({
		type: DataType.STRING(255),
		allowNull: false,
		field: "email"
	})
	email?: string;

	@Column({
		type: DataType.STRING(40),
		allowNull: true,
		unique: true,
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
		type: DataType.STRING(20),
		allowNull: true,
		field: "gender"
	})
	gender?: string;

	@Column({
		type: DataType.DATEONLY,
		allowNull: true,
		field: "date_of_birth"
	})
	date_of_birth?: string;

	@Column({
		type: DataType.STRING(300),
		allowNull: true,
		field: "address"
	})
	address?: string;

	@Column({
		type: DataType.STRING(50),
		allowNull: true,
		field: "country"
	})
	country?: string;

	@Column({
		type: DataType.STRING(50),
		allowNull: true,
		field: "state"
	})
	state?: string;

	@Column({
		type: DataType.STRING(50),
		allowNull: true,
		field: "city"
	})
	city?: string;

	@Column({
		type: DataType.STRING(255),
		allowNull: false,
		field: "privates"
	})
	privates?: string;

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
		type: DataType.INTEGER({ length: 1 }),
		field: "access"
	})
	access?: number;

	@Column({
		type: DataType.INTEGER({ length: 1 }),
		field: "status"
	})
	status?: number;
}