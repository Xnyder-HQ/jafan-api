import { Request, Response } from "express";
import { Op } from "sequelize";
import { validationResult, matchedData } from 'express-validator';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import RAW_MATERIAL, { IRawMaterial } from "../models/rawMaterials.model";
import RAW_MATERIAL_STOCK_LOG, { IRawMaterialStockLog } from "../models/rawMaterialStockLogs.model";
import ACL, { IACL } from "../models/acls.model";
import MODULE, { IModule } from "../models/modules.model";
import SUB_MODULE, { ISubModule } from "../models/subModules.model";
import ROLE, { IRole } from "../models/roles.model";
import USER, { IUser } from "../models/users.model";
import { addLog } from "./logs.controller";
import { IGetAuthTypesRequest } from "../middleware/checks";
import { ServerError, SuccessResponse, ValidationError, OtherSuccessResponse, NotFoundError, BadRequestError, logger, UnauthorizedError } from '../common/index';
import {
	IPagination, ISearch, default_status, paginate, return_all_letters_uppercase, anonymous, true_status, false_status, strip_text, timestamp_str_alt,
	dynamicWhere, zero,
} from '../config/config';
import { deleteImage } from '../middleware/uploads';

dotenv.config();

const { clouder_key, cloudy_name, cloudy_key, cloudy_secret } = process.env;

export default class RawMaterialStockLog {
	async getRawMaterialStockLogs(req: IGetAuthTypesRequest, res: Response) {
		const user_unique_id: string = req.USER_UNIQUE_ID;

		const queryParams: IPagination = req.query;

		const acl_details = await ACL.findOne({
			attributes: { exclude: ['id'] },
			where: {
				user_unique_id: user_unique_id,
				[Op.and]: [
					{ module_unique_id: queryParams.module_unique_id },
					{
						...(queryParams.sub_module_unique_id ? {
							sub_module_unique_id: queryParams.sub_module_unique_id
						} : {})
					}
				],
				acl_expiring: { 
					[Op.or]: [
						{ [Op.gte]: timestamp_str_alt(new Date().setHours(0, 0, 0, 0)) },
						{ [Op.eq]: null }
					]
				},
				status: default_status
			}
		});

		if (!acl_details) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized access to record" }, null);
		} 
		
		if (!acl_details.view) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized access to view record content" }, null);
		}

		const total_records = await RAW_MATERIAL_STOCK_LOG.count();
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await RAW_MATERIAL_STOCK_LOG.findAndCountAll({
				attributes: { exclude: ['id'] },
				include: [
					{
						model: RAW_MATERIAL,
						attributes: ['unique_id', 'reference', 'name', 'type', 'unit_of_measure', 'current_quantity', 'reorder_level'], 
					}, 
					{
						model: USER,
						attributes: ['unique_id', 'firstname', 'middlename', 'lastname', 'username', 'email'], 
						include: [
							{
								model: ROLE,
								attributes: ['unique_id', 'name', 'stripped']
							}
						]
					},
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Raw Material Stock Logs", user_unique_id, "Queried Raw Material Stock Logs", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Raw Material Stock Logs Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Raw Material Stock Logs loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getRawMaterialStockLog(req: IGetAuthTypesRequest, res: Response) {
		const user_unique_id: string = req.USER_UNIQUE_ID;

		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: user_unique_id, text: "Validation Error Occured" }, errors.array())
		}

		const queryParams: IPagination = req.query;

		const acl_details = await ACL.findOne({
			attributes: { exclude: ['id'] },
			where: {
				user_unique_id: user_unique_id,
				[Op.and]: [
					{ module_unique_id: queryParams.module_unique_id },
					{
						...(queryParams.sub_module_unique_id ? {
							sub_module_unique_id: queryParams.sub_module_unique_id
						} : {})
					}
				],
				acl_expiring: { 
					[Op.or]: [
						{ [Op.gte]: timestamp_str_alt(new Date().setHours(0, 0, 0, 0)) },
						{ [Op.eq]: null }
					]
				},
				status: default_status
			}
		});

		if (!acl_details) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized access to record" }, null);
		} 
		
		if (!acl_details.view) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized access to view record content" }, null);
		}

		try {
			const response = await RAW_MATERIAL_STOCK_LOG.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }, 
				include: [
					{
						model: RAW_MATERIAL,
						attributes: ['unique_id', 'reference', 'name', 'type', 'unit_of_measure', 'current_quantity', 'reorder_level'], 
					}, 
					{
						model: USER,
						attributes: ['unique_id', 'firstname', 'middlename', 'lastname', 'username', 'email'], 
						include: [
							{
								model: ROLE,
								attributes: ['unique_id', 'name', 'stripped']
							}
						]
					},
				], 
			});

			addLog("Raw Material Stock Logs", user_unique_id, "Queried Raw Material Stock Log", queryParams);
			if (!response) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Raw Material Stock Log Not found" }, null);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Raw Material Stock Log loaded" }, response);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async searchRawMaterialStockLogs(req: IGetAuthTypesRequest, res: Response) {
		const user_unique_id: string = req.USER_UNIQUE_ID;

		const queryParams: IPagination = req.query;

		const acl_details = await ACL.findOne({
			attributes: { exclude: ['id'] },
			where: {
				user_unique_id: user_unique_id,
				[Op.and]: [
					{ module_unique_id: queryParams.module_unique_id },
					{
						...(queryParams.sub_module_unique_id ? {
							sub_module_unique_id: queryParams.sub_module_unique_id
						} : {})
					}
				],
				acl_expiring: { 
					[Op.or]: [
						{ [Op.gte]: timestamp_str_alt(new Date().setHours(0, 0, 0, 0)) },
						{ [Op.eq]: null }
					]
				},
				status: default_status
			}
		});

		if (!acl_details) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized access to record" }, null);
		} 
		
		if (!acl_details.view) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized access to view record content" }, null);
		}

		const total_records = await RAW_MATERIAL_STOCK_LOG.count({
			where: {
				[Op.or]: [
					{
						source_module: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					},
					{
						movement_type: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					}
				]
			}
		});
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await RAW_MATERIAL_STOCK_LOG.findAndCountAll({
				attributes: { exclude: ['id'] },
				where: {
					[Op.or]: [
						{
							source_module: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
						},
						{
							movement_type: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
						}
					]
				}, 
				include: [
					{
						model: RAW_MATERIAL,
						attributes: ['unique_id', 'reference', 'name', 'type', 'unit_of_measure', 'current_quantity', 'reorder_level'], 
					}, 
					{
						model: USER,
						attributes: ['unique_id', 'firstname', 'middlename', 'lastname', 'username', 'email'], 
						include: [
							{
								model: ROLE,
								attributes: ['unique_id', 'name', 'stripped']
							}
						]
					},
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Raw Material Stock Logs", user_unique_id, "Searched Raw Material Stock Logs", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Raw Material Stock Logs Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Raw Material Stock Logs loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getRawMaterialStockLogsSpecifically(req: IGetAuthTypesRequest, res: Response) {
		const user_unique_id: string = req.USER_UNIQUE_ID;

		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: user_unique_id, text: "Validation Error Occured" }, errors.array())
		}

		const queryParams: IPagination = req.query;

		const acl_details = await ACL.findOne({
			attributes: { exclude: ['id'] },
			where: {
				user_unique_id: user_unique_id,
				[Op.and]: [
					{ module_unique_id: queryParams.module_unique_id },
					{
						...(queryParams.sub_module_unique_id ? {
							sub_module_unique_id: queryParams.sub_module_unique_id
						} : {})
					}
				],
				acl_expiring: { 
					[Op.or]: [
						{ [Op.gte]: timestamp_str_alt(new Date().setHours(0, 0, 0, 0)) },
						{ [Op.eq]: null }
					]
				},
				status: default_status
			}
		});

		if (!acl_details) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized access to record" }, null);
		} 
		
		if (!acl_details.view) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized access to view record content" }, null);
		}

		const total_records = await RAW_MATERIAL_STOCK_LOG.count({ where: dynamicWhere(queryParams) });
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await RAW_MATERIAL_STOCK_LOG.findAndCountAll({
				attributes: { exclude: ['id'] },
				where: dynamicWhere(queryParams), 
				include: [
					{
						model: RAW_MATERIAL,
						attributes: ['unique_id', 'reference', 'name', 'type', 'unit_of_measure', 'current_quantity', 'reorder_level'], 
					}, 
					{
						model: USER,
						attributes: ['unique_id', 'firstname', 'middlename', 'lastname', 'username', 'email'], 
						include: [
							{
								model: ROLE,
								attributes: ['unique_id', 'name', 'stripped']
							}
						]
					},
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Raw Material Stock Logs", user_unique_id, "Queried Raw Material Stock Logs specifically", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Raw Material Stock Logs Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Raw Material Stock Logs loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async filterRawMaterialStockLogsSpecifically(req: IGetAuthTypesRequest, res: Response) {
		const user_unique_id: string = req.USER_UNIQUE_ID;

		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: user_unique_id, text: "Validation Error Occured" }, errors.array())
		}

		const queryParams: IPagination = req.query;

		const acl_details = await ACL.findOne({
			attributes: { exclude: ['id'] },
			where: {
				user_unique_id: user_unique_id,
				[Op.and]: [
					{ module_unique_id: queryParams.module_unique_id },
					{
						...(queryParams.sub_module_unique_id ? {
							sub_module_unique_id: queryParams.sub_module_unique_id
						} : {})
					}
				],
				acl_expiring: { 
					[Op.or]: [
						{ [Op.gte]: timestamp_str_alt(new Date().setHours(0, 0, 0, 0)) },
						{ [Op.eq]: null }
					]
				},
				status: default_status
			}
		});

		if (!acl_details) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized access to record" }, null);
		} 
		
		if (!acl_details.view) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized access to view record content" }, null);
		}

		const total_records = await RAW_MATERIAL_STOCK_LOG.count({
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
			const response = await RAW_MATERIAL_STOCK_LOG.findAndCountAll({
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
						model: RAW_MATERIAL,
						attributes: ['unique_id', 'reference', 'name', 'type', 'unit_of_measure', 'current_quantity', 'reorder_level'], 
					}, 
					{
						model: USER,
						attributes: ['unique_id', 'firstname', 'middlename', 'lastname', 'username', 'email'], 
						include: [
							{
								model: ROLE,
								attributes: ['unique_id', 'name', 'stripped']
							}
						]
					},
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Raw Material Stock Logs", user_unique_id, "Filtered Raw Material Stock Logs specifically", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Raw Material Stock Logs Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Raw Material Stock Logs loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async publicGetRawMaterialStockLogs(req: IGetAuthTypesRequest, res: Response) {
		const queryParams: IPagination = req.query;

		const total_records = await RAW_MATERIAL_STOCK_LOG.count({ where: { status: default_status } });
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await RAW_MATERIAL_STOCK_LOG.findAndCountAll({
				attributes: { exclude: ['id', 'status'] },
				where: { status: default_status },
				include: [
					{
						model: RAW_MATERIAL,
						attributes: ['unique_id', 'reference', 'name', 'type', 'unit_of_measure', 'current_quantity', 'reorder_level'], 
					}, 
				], 
				order: [
					[orderBy, sortBy]
				],
				// offset: pagination.start,
				// limit: pagination.limit
			});

			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: anonymous, text: "Raw Material Stock Logs Not found" }, []);
			} else {
				// return SuccessResponse(res, { unique_id: anonymous, text: "Raw Material Stock Logs loaded" }, { ...response, pages: pagination.pages });
				return SuccessResponse(res, { unique_id: anonymous, text: "Raw Material Stock Logs loaded" }, { ...response });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async publicGetRawMaterialStockLog(req: IGetAuthTypesRequest, res: Response) {
		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: anonymous, text: "Validation Error Occured" }, errors.array())
		}

		try {
			const response = await RAW_MATERIAL_STOCK_LOG.findOne({
				attributes: { exclude: ['id', 'status'] },
				where: { ...payload }, 
				include: [
					{
						model: RAW_MATERIAL,
						attributes: ['unique_id', 'reference', 'name', 'type', 'unit_of_measure', 'current_quantity', 'reorder_level'], 
					}, 
				], 
			});

			if (!response) {
				return SuccessResponse(res, { unique_id: anonymous, text: "Raw Material Stock Log Not found" }, null);
			} else {
				return SuccessResponse(res, { unique_id: anonymous, text: "Raw Material Stock Log loaded" }, response);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async publicSearchRawMaterialStockLogs(req: IGetAuthTypesRequest, res: Response) {
		const queryParams: IPagination = req.query;

		const total_records = await RAW_MATERIAL_STOCK_LOG.count({
			where: {
				[Op.or]: [
					{
						source_module: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					},
					{
						movement_type: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					}
				]
			}
		});
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await RAW_MATERIAL_STOCK_LOG.findAndCountAll({
				attributes: { exclude: ['id', 'status'] },
				where: {
					[Op.or]: [
						{
							source_module: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
						},
						{
							movement_type: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
						}
					]
				}, 
				include: [
					{
						model: RAW_MATERIAL,
						attributes: ['unique_id', 'reference', 'name', 'type', 'unit_of_measure', 'current_quantity', 'reorder_level'], 
					}, 
				], 
				order: [
					[orderBy, sortBy]
				],
				// offset: pagination.start,
				// limit: pagination.limit
			});

			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: anonymous, text: "Raw Material Stock Logs Not found" }, []);
			} else {
				// return SuccessResponse(res, { unique_id: anonymous, text: "Raw Material Stock Logs loaded" }, { ...response, pages: pagination.pages });
				return SuccessResponse(res, { unique_id: anonymous, text: "Raw Material Stock Logs loaded" }, { ...response });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async deleteRawMaterialStockLog(req: IGetAuthTypesRequest, res: Response) {
		const user_unique_id: string = req.USER_UNIQUE_ID;

		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: user_unique_id, text: "Validation Error Occured" }, errors.array())
		}

		const acl_details = await ACL.findOne({
			attributes: { exclude: ['id'] },
			where: {
				user_unique_id: user_unique_id,
				[Op.and]: [
					{ module_unique_id: req.query.module_unique_id },
					{
						...(req.query.sub_module_unique_id ? {
							sub_module_unique_id: req.query.sub_module_unique_id
						} : {})
					}
				],
				acl_expiring: { 
					[Op.or]: [
						{ [Op.gte]: timestamp_str_alt(new Date().setHours(0, 0, 0, 0)) },
						{ [Op.eq]: null }
					]
				},
				status: default_status
			}
		});

		if (!acl_details) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized access to record" }, null);
		} 
		
		if (!acl_details.delete) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized access to delete record content" }, null);
		}

		try {
			await RAW_MATERIAL_STOCK_LOG.sequelize?.transaction(async (transaction) => {
				const response = await RAW_MATERIAL_STOCK_LOG.destroy(
					{
						where: {
							unique_id: payload.unique_id,
							status: default_status
						},
						transaction
					}
				);

				addLog("Raw Material Stock Logs", user_unique_id, "Deleted Raw Material Stock Log", payload);
				if (response > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Raw Material Stock Log was deleted successfully!" }, null);
				} else {
					throw new Error("Error deleting record");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}
};
