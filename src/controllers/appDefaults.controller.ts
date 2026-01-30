import { Request, Response } from "express";
import { Op } from "sequelize";
import { validationResult, matchedData } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import APP_DEFAULT, { IAppDefault } from "../models/appDefaults.model";
import { IGetAuthTypesRequest } from "../middleware/checks";
import { ServerError, SuccessResponse, ValidationError, OtherSuccessResponse, NotFoundError, BadRequestError, logger } from '../common/index';
import {
	IPagination, ISearch, default_status, paginate, return_all_letters_uppercase, anonymous, convert_app_default_name
} from '../config/config';

export default class AppDefaultController {
	async getAppDefaults(req: IGetAuthTypesRequest, res: Response) {
		const api_key: string = req.API_KEY;

		const queryParams: IPagination = req.query;

		const total_records = await APP_DEFAULT.count();
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await APP_DEFAULT.findAndCountAll({
				attributes: { exclude: ['id'] },
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: api_key, text: "App Defaults Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: api_key, text: "App Defaults loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: api_key, text: err.message }, null);
		}
	}

	async getAppDefault(req: IGetAuthTypesRequest, res: Response) {
		const api_key: string = req.API_KEY;

		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: api_key, text: "Validation Error Occured" }, errors.array())
		}

		try {
			const response = await APP_DEFAULT.findOne({
				attributes: { exclude: ['id'] },
				where: {
					...payload
				},
			});

			if (!response) {
				return SuccessResponse(res, { unique_id: api_key, text: "App Default Not found" }, null);
			} else {
				return SuccessResponse(res, { unique_id: api_key, text: "App Default loaded" }, response);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: api_key, text: err.message }, null);
		}
	}

	async getAppDefaultsSpecifically(req: IGetAuthTypesRequest, res: Response) {
		const api_key: string = req.API_KEY;

		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: api_key, text: "Validation Error Occured" }, errors.array())
		}

		const queryParams: IPagination = req.query;

		const total_records = await APP_DEFAULT.count({ where: { ...payload } });
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await APP_DEFAULT.findAndCountAll({
				attributes: { exclude: ['id'] },
				where: {
					...payload
				},
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: api_key, text: "App Defaults Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: api_key, text: "App Defaults loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: api_key, text: err.message }, null);
		}
	}

	async searchAppDefaults(req: IGetAuthTypesRequest, res: Response) {
		const api_key: string = req.API_KEY;

		const queryParams: IPagination = req.query;

		const total_records = await APP_DEFAULT.count({
			where: {
				[Op.or]: [
					{
						criteria: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					},
				]
			},
		});
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await APP_DEFAULT.findAndCountAll({
				attributes: { exclude: ['id'] },
				where: {
					[Op.or]: [
						{
							criteria: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
						},
					]
				},
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: api_key, text: "App Defaults Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: api_key, text: "App Defaults loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: api_key, text: err.message }, null);
		}
	}

	async publicGetAppDefault(req: IGetAuthTypesRequest, res: Response) {
		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: anonymous, text: "Validation Error Occured" }, errors.array())
		}

		try {
			const response = await APP_DEFAULT.findOne({
				attributes: { exclude: ['id', 'createdAt', 'updatedAt', 'status'] },
				where: {
					...payload
				}
			});

			if (!response) {
				return SuccessResponse(res, { unique_id: anonymous, text: "App Default Not found" }, null);
			} else {
				return SuccessResponse(res, { unique_id: anonymous, text: "App Default loaded" }, response);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async publicSearchAppDefaults(req: IGetAuthTypesRequest, res: Response) {
		const queryParams: IPagination = req.query;

		const total_records = await APP_DEFAULT.count({
			where: {
				[Op.or]: [
					{
						criteria: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					},
				]
			},
		});
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await APP_DEFAULT.findAndCountAll({
				attributes: { exclude: ['id', 'createdAt', 'updatedAt', 'status'] },
				where: {
					[Op.or]: [
						{
							criteria: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
						},
					]
				},
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: anonymous, text: "App Defaults Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: anonymous, text: "App Defaults loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async addAppDefault(req: IGetAuthTypesRequest, res: Response) {
		const api_key: string = req.API_KEY;
		
		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: api_key, text: "Validation Error Occured" }, errors.array());
		}

		try {
			await APP_DEFAULT.sequelize?.transaction(async (transaction) => {
				const appDefaultResponse = await APP_DEFAULT.create({
					unique_id: uuidv4(),
					criteria: convert_app_default_name(payload.criteria),
					data_type: payload.data_type,
					value: payload.data_type === "BOOLEAN" ? (payload.value === true || payload.value === 1 ? 1 : 0) : (
						payload.data_type === "STRING" || payload.data_type === "INTEGER" ? payload.value : JSON.stringify(payload.value)
					),
					status: default_status
				}, { transaction });

				if (appDefaultResponse) {
					return SuccessResponse(res, { unique_id: api_key, text: "App Default added successfully!" }, null);
				} else {
					throw new Error("Error adding app default");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: api_key, text: err.message }, null);
		}
	}

	async updateAppDefaultDetails(req: IGetAuthTypesRequest, res: Response) {
		const api_key: string = req.API_KEY;

		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: api_key, text: "Validation Error Occured" }, errors.array())
		}

		try {
			await APP_DEFAULT.sequelize?.transaction(async (transaction) => {
				const response = await APP_DEFAULT.update(
					{
						criteria: convert_app_default_name(payload.criteria),
						data_type: payload.data_type,
						value: payload.data_type === "BOOLEAN" ? (payload.value === true || payload.value === 1 ? 1 : 0) : (
							payload.data_type === "STRING" || payload.data_type === "INTEGER" ? payload.value : JSON.stringify(payload.value)
						),
					}, {
						where: {
							unique_id: payload.unique_id,
							status: default_status
						},
						transaction
					}
				);

				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: api_key, text: "Details updated successfully!" }, null);
				} else {
					throw new Error("Error updating details");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: api_key, text: err.message }, null);
		}
	}

	async deleteAppDefault(req: IGetAuthTypesRequest, res: Response) {
		const api_key: string = req.API_KEY;

		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: api_key, text: "Validation Error Occured" }, errors.array())
		}

		try {
			await APP_DEFAULT.sequelize?.transaction(async (transaction) => {
				const response = await APP_DEFAULT.destroy(
					{
						where: {
							unique_id: payload.unique_id,
							status: default_status
						}, 
						transaction
					}
				);

				if (response > 0) {
					SuccessResponse(res, { unique_id: api_key, text: "App Default was deleted successfully!" }, null);
				} else {
					throw new Error("Error deleting record");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: api_key, text: err.message }, null);
		}
	}
};
