import { Model, Table, Column, DataType } from "sequelize-typescript";
import { db_end, db_start } from "../config/config";
import User from "./users.model";

export interface ILog {
	id?: number;
	unique_id: string;
	user_unique_id?: string;
	type: string;
	description?: string;
	content: string;
	status?: number;
}

@Table({
	tableName: `${db_start}logs${db_end}`
})
export default class Log extends Model {
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
		field: "user_unique_id",
		references: {
			model: User,
			key: "unique_id"
		}
	})
	user_unique_id?: string;

	@Column({
		type: DataType.STRING(50),
		allowNull: false,
		field: "type"
	})
	type?: string;

	@Column({
		type: DataType.STRING(1000),
		allowNull: true,
		field: "description"
	})
	description?: string;

	@Column({
		type: DataType.TEXT,
		allowNull: true,
		get() {
			const _content = this.getDataValue('content');
			return (_content === null || _content === undefined ? null : JSON.parse(_content));
		},
		set(value: any) {
			const _content = JSON.stringify(value);
			this.setDataValue('content', value === null ? null : _content);
		},
		field: "content"
	})
	content?: string;

	@Column({
		type: DataType.INTEGER({ length: 1 }),
		field: "status"
	})
	status?: number;
}