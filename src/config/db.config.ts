import dotenv from 'dotenv';
dotenv.config();

const {
	DATABASE,
	DATABASE_ONLINE,
	DB_HOST,
	DB_HOST_ONLINE,
	DB_USER,
	DB_USER_ONLINE,
	DB_PASSWORD,
	DB_PASSWORD_ONLINE,
	NODE_ENV
} = process.env;

export const config = {
	HOST: NODE_ENV === "development" ? DB_HOST : DB_HOST_ONLINE,
	USER: NODE_ENV === "development" ? DB_USER : DB_USER_ONLINE,
	PASSWORD: NODE_ENV === "development" ? DB_PASSWORD : DB_PASSWORD_ONLINE,
	DB: NODE_ENV === "development" ? DATABASE : DATABASE_ONLINE,
	logging: 0,
	pool: {
		max: 100,
		min: 0,
		acquire: 60000,
		idle: 10000,
		evict: 10000,
	}
};
export const dialect = "mysql";
export const dialectOptions = {
	useUTC: false, //for reading from database
	dateStrings: true,
	typeCast: true
};
export const timezone = '+00:00';
export const production = false;
