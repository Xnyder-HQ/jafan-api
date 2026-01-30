import { Request, Response } from "express";
import { Op } from "sequelize";
import { validationResult, matchedData } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import MODULE, { IModule } from "../models/modules.model";
import SUB_MODULE, { ISubModule } from "../models/subModules.model";
import { IGetAuthTypesRequest } from "../middleware/checks";
import { ServerError, SuccessResponse, ValidationError, OtherSuccessResponse, NotFoundError, BadRequestError, logger } from '../common/index';
import {
	IPagination, ISearch, default_status, paginate, return_all_letters_uppercase, anonymous, true_status, false_status, strip_text,
	dynamicWhere, timestamp_str_alt
} from '../config/config';

export default class SubModuleController {
	async getSubModules(req: IGetAuthTypesRequest, res: Response) {
		const api_key: string = req.API_KEY;

		const queryParams: IPagination = req.query;

		const total_records = await SUB_MODULE.count();
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await SUB_MODULE.findAndCountAll({
				attributes: { exclude: ['id'] },
				include: [
					{
						model: MODULE,
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
				return SuccessResponse(res, { unique_id: api_key, text: "Sub Modules Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: api_key, text: "Sub Modules loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: api_key, text: err.message }, null);
		}
	}

	async getSubModule(req: IGetAuthTypesRequest, res: Response) {
		const api_key: string = req.API_KEY;

		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: api_key, text: "Validation Error Occured" }, errors.array())
		}

		try {
			const response = await SUB_MODULE.findOne({
				attributes: { exclude: ['id'] },
				where: { ...payload },
				include: [
					{
						model: MODULE,
						attributes: ['unique_id', 'name', 'stripped']
					}
				], 
			});

			if (!response) {
				return SuccessResponse(res, { unique_id: api_key, text: "Sub Module Not found" }, null);
			} else {
				return SuccessResponse(res, { unique_id: api_key, text: "Sub Module loaded" }, response);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: api_key, text: err.message }, null);
		}
	}

	async searchSubModules(req: IGetAuthTypesRequest, res: Response) {
		const api_key: string = req.API_KEY;

		const queryParams: IPagination = req.query;

		const total_records = await SUB_MODULE.count({
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
			const response = await SUB_MODULE.findAndCountAll({
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
						model: MODULE,
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
				return SuccessResponse(res, { unique_id: api_key, text: "Sub Modules Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: api_key, text: "Sub Modules loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: api_key, text: err.message }, null);
		}
	}

	async getSubModulesSpecifically(req: IGetAuthTypesRequest, res: Response) {
		const api_key: string = req.API_KEY;

		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: api_key, text: "Validation Error Occured" }, errors.array())
		}

		const queryParams: IPagination = req.query;

		const total_records = await SUB_MODULE.count({ where: dynamicWhere(queryParams) });
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await SUB_MODULE.findAndCountAll({
				attributes: { exclude: ['id'] },
				where: dynamicWhere(queryParams),
				include: [
					{
						model: MODULE,
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
				return SuccessResponse(res, { unique_id: api_key, text: "Sub Modules Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: api_key, text: "Sub Modules loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: api_key, text: err.message }, null);
		}
	}

	async filterSubModulesSpecifically(req: IGetAuthTypesRequest, res: Response) {
		const api_key: string = req.API_KEY;

		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: api_key, text: "Validation Error Occured" }, errors.array())
		}

		const queryParams: IPagination = req.query;

		const total_records = await SUB_MODULE.count({
			where: {
				...dynamicWhere(queryParams),
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
			const response = await SUB_MODULE.findAndCountAll({
				attributes: { exclude: ['id'] },
				where: {
					...dynamicWhere(queryParams),
					createdAt: {
						[Op.gte]: timestamp_str_alt(new Date(payload.start_date).setHours(0, 0, 0, 0)),
						[Op.lte]: timestamp_str_alt(new Date(payload.end_date).setHours(23, 59, 59, 0)),
					}
				},
				include: [
					{
						model: MODULE,
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
				return SuccessResponse(res, { unique_id: api_key, text: "Sub Modules Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: api_key, text: "Sub Modules loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: api_key, text: err.message }, null);
		}
	}

	async publicGetSubModules(req: IGetAuthTypesRequest, res: Response) {
		const queryParams: IPagination = req.query;

		const total_records = await SUB_MODULE.count({ where: { status: default_status } });
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await SUB_MODULE.findAndCountAll({
				attributes: { exclude: ['id', 'status'] },
				where: { status: default_status },
				include: [
					{
						model: MODULE,
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
				return SuccessResponse(res, { unique_id: anonymous, text: "Sub Modules Not found" }, []);
			} else {
				// return SuccessResponse(res, { unique_id: anonymous, text: "Sub Modules loaded" }, { ...response, pages: pagination.pages });
				return SuccessResponse(res, { unique_id: anonymous, text: "Sub Modules loaded" }, { ...response });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async publicGetSubModule(req: IGetAuthTypesRequest, res: Response) {
		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: anonymous, text: "Validation Error Occured" }, errors.array())
		}

		try {
			const response = await SUB_MODULE.findOne({
				attributes: { exclude: ['id', 'status'] },
				where: { ...payload }, 
				include: [
					{
						model: MODULE,
						attributes: ['unique_id', 'name', 'stripped']
					}
				], 
			});

			if (!response) {
				return SuccessResponse(res, { unique_id: anonymous, text: "Sub Module Not found" }, null);
			} else {
				return SuccessResponse(res, { unique_id: anonymous, text: "Sub Module loaded" }, response);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async publicSearchSubModules(req: IGetAuthTypesRequest, res: Response) {
		const queryParams: IPagination = req.query;

		const total_records = await SUB_MODULE.count({
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
			const response = await SUB_MODULE.findAndCountAll({
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
						model: MODULE,
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
				return SuccessResponse(res, { unique_id: anonymous, text: "Sub Modules Not found" }, []);
			} else {
				// return SuccessResponse(res, { unique_id: anonymous, text: "Sub Modules loaded" }, { ...response, pages: pagination.pages });
				return SuccessResponse(res, { unique_id: anonymous, text: "Sub Modules loaded" }, { ...response });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async publicGetSubModulesSpecifically(req: IGetAuthTypesRequest, res: Response) {
		const queryParams: IPagination = req.query;

		const total_records = await SUB_MODULE.count({ where: { ...dynamicWhere(queryParams), status: default_status } });
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await SUB_MODULE.findAndCountAll({
				attributes: { exclude: ['id', 'status'] },
				where: { ...dynamicWhere(queryParams), status: default_status },
				include: [
					{
						model: MODULE,
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
				return SuccessResponse(res, { unique_id: anonymous, text: "Sub Modules Not found" }, []);
			} else {
				// return SuccessResponse(res, { unique_id: anonymous, text: "Sub Modules loaded" }, { ...response, pages: pagination.pages });
				return SuccessResponse(res, { unique_id: anonymous, text: "Sub Modules loaded" }, { ...response });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async publicFilterSubModulesSpecifically(req: IGetAuthTypesRequest, res: Response) {
		const queryParams: IPagination = req.query;

		const total_records = await SUB_MODULE.count({ 
			where: {
				...dynamicWhere(queryParams),
				createdAt: {
					[Op.gte]: timestamp_str_alt(new Date(queryParams.start_date).setHours(0, 0, 0, 0)),
					[Op.lte]: timestamp_str_alt(new Date(queryParams.end_date).setHours(23, 59, 59, 0)),
				}, 
				status: default_status 
			}
		});
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await SUB_MODULE.findAndCountAll({
				attributes: { exclude: ['id', 'status'] },
				where: {
					...dynamicWhere(queryParams),
					createdAt: {
						[Op.gte]: timestamp_str_alt(new Date(queryParams.start_date).setHours(0, 0, 0, 0)),
						[Op.lte]: timestamp_str_alt(new Date(queryParams.end_date).setHours(23, 59, 59, 0)),
					}, 
					status: default_status 
				},
				include: [
					{
						model: MODULE,
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
				return SuccessResponse(res, { unique_id: anonymous, text: "Sub Modules Not found" }, []);
			} else {
				// return SuccessResponse(res, { unique_id: anonymous, text: "Sub Modules loaded" }, { ...response, pages: pagination.pages });
				return SuccessResponse(res, { unique_id: anonymous, text: "Sub Modules loaded" }, { ...response });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async addSubModule(req: IGetAuthTypesRequest, res: Response) {
		const api_key: string = req.API_KEY;

		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: api_key, text: "Validation Error Occured" }, errors.array());
		}

		try {
			const sub_category_unique_id = uuidv4();

			await SUB_MODULE.sequelize?.transaction(async (transaction) => {
				const subCategoryResponse = await SUB_MODULE.create({
					unique_id: sub_category_unique_id,
					module_unique_id: payload.module_unique_id ? payload.module_unique_id : null,
					name: payload.name,
					stripped: strip_text(payload.name),
					status: default_status
				}, { transaction });

				if (subCategoryResponse) {
					return SuccessResponse(res, { unique_id: api_key, text: "Sub Module created successfully!" }, { unique_id: sub_category_unique_id });
				} else {
					throw new Error("Error adding sub category");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: api_key, text: err.message }, null);
		}
	}

	async updateSubModuleDetails(req: IGetAuthTypesRequest, res: Response) {
		const api_key: string = req.API_KEY;

		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: api_key, text: "Validation Error Occured" }, errors.array())
		}

		try {
			await SUB_MODULE.sequelize?.transaction(async (transaction) => {
				const response = await SUB_MODULE.update(
					{
						...payload,
						stripped: strip_text(payload.name),
						module_unique_id: payload.module_unique_id ? payload.module_unique_id : null,
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
					throw new Error("Sub Module not found");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: api_key, text: err.message }, null);
		}
	}

	async deleteSubModule(req: IGetAuthTypesRequest, res: Response) {
		const api_key: string = req.API_KEY;

		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: api_key, text: "Validation Error Occured" }, errors.array())
		}

		try {
			await SUB_MODULE.sequelize?.transaction(async (transaction) => {
				const response = await SUB_MODULE.destroy(
					{
						where: {
							unique_id: payload.unique_id,
							status: default_status
						},
						transaction
					}
				);

				if (response > 0) {
					return SuccessResponse(res, { unique_id: api_key, text: "Sub Module was deleted successfully!" }, null);
				} else {
					throw new Error("Error deleting record");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: api_key, text: err.message }, null);
		}
	}
};
