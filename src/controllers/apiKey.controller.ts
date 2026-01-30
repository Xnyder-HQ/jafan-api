import { Request, Response } from "express";
import { Op } from "sequelize";
import { validationResult, matchedData } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import API_KEY, { IApiKey } from "../models/apiKeys.model";
import { IGetAuthTypesRequest } from "../middleware/checks";
import { ServerError, SuccessResponse, ValidationError, OtherSuccessResponse, NotFoundError, BadRequestError, logger } from '../common/index';
import {
	IPagination, ISearch, default_status, paginate, return_all_letters_uppercase, anonymous, random_uuid
} from '../config/config';

export default class ApiKeyController {
	async getApiKeys(req: IGetAuthTypesRequest, res: Response) {
		const api_key: string = req.API_KEY;

		const queryParams: IPagination = req.query;

		const total_records = await API_KEY.count();
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await API_KEY.findAndCountAll({
				attributes: { exclude: ['id'] },
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: api_key, text: "Api Keys Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: api_key, text: "Api Keys loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: api_key, text: err.message }, null);
		}
	}

	async getApiKey(req: IGetAuthTypesRequest, res: Response) {
		const api_key: string = req.API_KEY;

		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: api_key, text: "Validation Error Occured" }, errors.array())
		}

		try {
			const response = await API_KEY.findOne({
				attributes: { exclude: ['id'] },
				where: {
					...payload
				},
			});

			if (!response) {
				return SuccessResponse(res, { unique_id: api_key, text: "Api Key Not found" }, null);
			} else {
				return SuccessResponse(res, { unique_id: api_key, text: "Api Key loaded" }, response);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: api_key, text: err.message }, null);
		}
	}

	async getApiKeysSpecifically(req: IGetAuthTypesRequest, res: Response) {
		const api_key: string = req.API_KEY;

		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: api_key, text: "Validation Error Occured" }, errors.array())
		}

		const queryParams: IPagination = req.query;

		const total_records = await API_KEY.count({ where: { ...payload } });
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await API_KEY.findAndCountAll({
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
				return SuccessResponse(res, { unique_id: api_key, text: "Api Keys Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: api_key, text: "Api Keys loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: api_key, text: err.message }, null);
		}
	}

	async searchApiKeys(req: IGetAuthTypesRequest, res: Response) {
		const api_key: string = req.API_KEY;

		const queryParams: IPagination = req.query;

		const total_records = await API_KEY.count({
			where: {
				[Op.or]: [
					{
						alias: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					},
					{
						type: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					},
				]
			},
		});
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await API_KEY.findAndCountAll({
				attributes: { exclude: ['id'] },
				where: {
					[Op.or]: [
						{
							alias: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
						},
						{
							type: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
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
				return SuccessResponse(res, { unique_id: api_key, text: "Api Keys Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: api_key, text: "Api Keys loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: api_key, text: err.message }, null);
		}
	}

	async publicGetApiKey(req: IGetAuthTypesRequest, res: Response) {
		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: anonymous, text: "Validation Error Occured" }, errors.array())
		}

		try {
			const response = await API_KEY.findOne({
				attributes: { exclude: ['id', 'createdAt', 'updatedAt', 'status'] },
				where: {
					...payload
				}
			});

			if (!response) {
				return SuccessResponse(res, { unique_id: anonymous, text: "Api Key Not found" }, null);
			} else {
				return SuccessResponse(res, { unique_id: anonymous, text: "Api Key loaded" }, response);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async publicSearchApiKeys(req: IGetAuthTypesRequest, res: Response) {
		const queryParams: IPagination = req.query;

		const total_records = await API_KEY.count({
			where: {
				[Op.or]: [
					{
						alias: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					},
					{
						type: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					},
				]
			},
		});
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await API_KEY.findAndCountAll({
				attributes: { exclude: ['id', 'createdAt', 'updatedAt', 'status'] },
				where: {
					[Op.or]: [
						{
							alias: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
						},
						{
							type: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
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
				return SuccessResponse(res, { unique_id: anonymous, text: "Api Keys Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: anonymous, text: "Api Keys loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async addApiKey(req: IGetAuthTypesRequest, res: Response) {
		const api_key: string = req.API_KEY;
		
		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: api_key, text: "Validation Error Occured" }, errors.array());
		}

		try {
			await API_KEY.sequelize?.transaction(async (transaction) => {
				const apiKeyResponse = await API_KEY.create({
					unique_id: uuidv4(),
					type: payload.type,
					alias: payload.alias ? payload.alias : null,
					api_key: random_uuid(20),
					status: default_status
				}, { transaction });

				if (apiKeyResponse) {
					return SuccessResponse(res, { unique_id: api_key, text: "Api Key added successfully!" }, null);
				} else {
					throw new Error("Error adding app default");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: api_key, text: err.message }, null);
		}
	}

	async updateApiKeyDetails(req: IGetAuthTypesRequest, res: Response) {
		const api_key: string = req.API_KEY;

		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: api_key, text: "Validation Error Occured" }, errors.array())
		}

		try {
			await API_KEY.sequelize?.transaction(async (transaction) => {
				const response = await API_KEY.update(
					{
						alias: payload.alias ? payload.alias : null,
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

	async deleteApiKey(req: IGetAuthTypesRequest, res: Response) {
		const api_key: string = req.API_KEY;

		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: api_key, text: "Validation Error Occured" }, errors.array())
		}

		try {
			await API_KEY.sequelize?.transaction(async (transaction) => {
				const response = await API_KEY.destroy(
					{
						where: {
							unique_id: payload.unique_id,
							status: default_status
						}, 
						transaction
					}
				);

				if (response > 0) {
					SuccessResponse(res, { unique_id: api_key, text: "Api Key was deleted successfully!" }, null);
				} else {
					throw new Error("Error deleting record");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: api_key, text: err.message }, null);
		}
	}
};
