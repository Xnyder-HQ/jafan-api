import { Request, Response } from "express";
import { Op } from "sequelize";
import { validationResult, matchedData } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import MODULE, { IModule } from "../models/modules.model";
import SUB_MODULE, { ISubModule } from "../models/subModules.model";
import { IGetAuthTypesRequest } from "../middleware/checks";
import { ServerError, SuccessResponse, ValidationError, OtherSuccessResponse, NotFoundError, BadRequestError, logger } from '../common/index';
import {
	IPagination, ISearch, default_status, paginate, return_all_letters_uppercase, anonymous, true_status, false_status, strip_text, timestamp_str_alt
} from '../config/config';

export default class ModuleController {
	async getModules(req: IGetAuthTypesRequest, res: Response) {
		const api_key: string = req.API_KEY;

		const queryParams: IPagination = req.query;

		const total_records = await MODULE.count();
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await MODULE.findAndCountAll({
				attributes: { exclude: ['id'] },
				include: [
					{
						model: SUB_MODULE,
						attributes: ['unique_id', 'name', 'stripped']
					}
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: api_key, text: "Modules Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: api_key, text: "Modules loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: api_key, text: err.message }, null);
		}
	}

	async getModule(req: IGetAuthTypesRequest, res: Response) {
		const api_key: string = req.API_KEY;

		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: api_key, text: "Validation Error Occured" }, errors.array())
		}

		try {
			const response = await MODULE.findOne({
				attributes: { exclude: ['id'] },
				where: { ...payload }, 
				include: [
					{
						model: SUB_MODULE,
						attributes: ['unique_id', 'name', 'stripped']
					}
				], 
			});

			if (!response) {
				return SuccessResponse(res, { unique_id: api_key, text: "Module Not found" }, null);
			} else {
				return SuccessResponse(res, { unique_id: api_key, text: "Module loaded" }, response);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: api_key, text: err.message }, null);
		}
	}

	async searchModules(req: IGetAuthTypesRequest, res: Response) {
		const api_key: string = req.API_KEY;

		const queryParams: IPagination = req.query;

		const total_records = await MODULE.count({
			where: {
				[Op.or]: [
					{
						name: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					}
				]
			}
		});
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await MODULE.findAndCountAll({
				attributes: { exclude: ['id'] },
				where: {
					[Op.or]: [
						{
							name: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
						}
					]
				},
				include: [
					{
						model: SUB_MODULE,
						attributes: ['unique_id', 'name', 'stripped']
					}
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: api_key, text: "Modules Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: api_key, text: "Modules loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: api_key, text: err.message }, null);
		}
	}

	async getModulesSpecifically(req: IGetAuthTypesRequest, res: Response) {
		const api_key: string = req.API_KEY;

		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: api_key, text: "Validation Error Occured" }, errors.array())
		}

		const queryParams: IPagination = req.query;

		const total_records = await MODULE.count({ where: { ...payload } });
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await MODULE.findAndCountAll({
				attributes: { exclude: ['id'] },
				where: {
					...payload
				},
				include: [
					{
						model: SUB_MODULE,
						attributes: ['unique_id', 'name', 'stripped']
					}
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: api_key, text: "Modules Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: api_key, text: "Modules loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: api_key, text: err.message }, null);
		}
	}

	async filterModules(req: IGetAuthTypesRequest, res: Response) {
		const api_key: string = req.API_KEY;

		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: api_key, text: "Validation Error Occured" }, errors.array())
		}

		const queryParams: IPagination = req.query;

		const total_records = await MODULE.count({ 
			where: {
				createdAt: {
					[Op.gte]: timestamp_str_alt(new Date(payload.start_date).setHours(0, 0, 0, 0)),
					[Op.lte]: timestamp_str_alt(new Date(payload.end_date).setHours(23, 59, 59, 0)),
				}
			}
		});
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await MODULE.findAndCountAll({
				attributes: { exclude: ['id'] },
				where: {
					createdAt: {
						[Op.gte]: timestamp_str_alt(new Date(payload.start_date).setHours(0, 0, 0, 0)),
						[Op.lte]: timestamp_str_alt(new Date(payload.end_date).setHours(23, 59, 59, 0)),
					}
				},
				include: [
					{
						model: SUB_MODULE,
						attributes: ['unique_id', 'name', 'stripped']
					}
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: api_key, text: "Modules Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: api_key, text: "Modules loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: api_key, text: err.message }, null);
		}
	}

	async publicGetModules(req: IGetAuthTypesRequest, res: Response) {
		const queryParams: IPagination = req.query;

		const total_records = await MODULE.count({ where: { status: default_status } });
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await MODULE.findAndCountAll({
				attributes: { exclude: ['id', 'status'] },
				where: { status: default_status },
				include: [
					{
						model: SUB_MODULE,
						attributes: ['unique_id', 'name', 'stripped']
					}
				], 
				order: [
					[orderBy, sortBy]
				],
				// offset: pagination.start,
				// limit: pagination.limit
			});

			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: anonymous, text: "Modules Not found" }, []);
			} else {
				// return SuccessResponse(res, { unique_id: anonymous, text: "Modules loaded" }, { ...response, pages: pagination.pages });
				return SuccessResponse(res, { unique_id: anonymous, text: "Modules loaded" }, { ...response });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async publicGetModule(req: IGetAuthTypesRequest, res: Response) {
		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: anonymous, text: "Validation Error Occured" }, errors.array())
		}

		try {
			const response = await MODULE.findOne({
				attributes: { exclude: ['id', 'status'] },
				where: { ...payload }, 
				include: [
					{
						model: SUB_MODULE,
						attributes: ['unique_id', 'name', 'stripped']
					}
				], 
			});

			if (!response) {
				return SuccessResponse(res, { unique_id: anonymous, text: "Module Not found" }, null);
			} else {
				return SuccessResponse(res, { unique_id: anonymous, text: "Module loaded" }, response);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async publicSearchModules(req: IGetAuthTypesRequest, res: Response) {
		const queryParams: IPagination = req.query;

		const total_records = await MODULE.count({
			where: {
				[Op.or]: [
					{
						name: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					}
				]
			}
		});
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await MODULE.findAndCountAll({
				attributes: { exclude: ['id', 'status'] },
				where: {
					[Op.or]: [
						{
							name: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
						}
					]
				}, 
				include: [
					{
						model: SUB_MODULE,
						attributes: ['unique_id', 'name', 'stripped']
					}
				], 
				order: [
					[orderBy, sortBy]
				],
				// offset: pagination.start,
				// limit: pagination.limit
			});

			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: anonymous, text: "Modules Not found" }, []);
			} else {
				// return SuccessResponse(res, { unique_id: anonymous, text: "Modules loaded" }, { ...response, pages: pagination.pages });
				return SuccessResponse(res, { unique_id: anonymous, text: "Modules loaded" }, { ...response });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async addModule(req: IGetAuthTypesRequest, res: Response) {
		const api_key: string = req.API_KEY;

		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: api_key, text: "Validation Error Occured" }, errors.array());
		}

		try {
			const module_unique_id = uuidv4();

			await MODULE.sequelize?.transaction(async (transaction) => {
				const moduleResponse = await MODULE.create({
					unique_id: module_unique_id,
					name: payload.name,
					stripped: strip_text(payload.name),
					status: default_status
				}, { transaction });

				if (moduleResponse) {
					return SuccessResponse(res, { unique_id: api_key, text: "Module created successfully!" }, { unique_id: module_unique_id });
				} else {
					throw new Error("Error adding module");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: api_key, text: err.message }, null);
		}
	}

	async updateModuleDetails(req: IGetAuthTypesRequest, res: Response) {
		const api_key: string = req.API_KEY;

		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: api_key, text: "Validation Error Occured" }, errors.array())
		}

		try {
			await MODULE.sequelize?.transaction(async (transaction) => {
				const response = await MODULE.update(
					{
						...payload,
						stripped: strip_text(payload.name),
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
					throw new Error("Module not found");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: api_key, text: err.message }, null);
		}
	}

	async deleteModule(req: IGetAuthTypesRequest, res: Response) {
		const api_key: string = req.API_KEY;

		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: api_key, text: "Validation Error Occured" }, errors.array())
		}

		try {
			await MODULE.sequelize?.transaction(async (transaction) => {
				const response = await MODULE.destroy(
					{
						where: {
							unique_id: payload.unique_id,
							status: default_status
						},
						transaction
					}
				);

				if (response > 0) {
					return SuccessResponse(res, { unique_id: api_key, text: "Module was deleted successfully!" }, null);
				} else {
					throw new Error("Error deleting record");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: api_key, text: err.message }, null);
		}
	}
};
