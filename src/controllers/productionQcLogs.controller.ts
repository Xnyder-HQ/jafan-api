import { Request, Response } from "express";
import { Op } from "sequelize";
import { validationResult, matchedData } from 'express-validator';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import PRODUCTION_QC_LOG, { IProductionQcLog } from "../models/productionQcLogs.model";
import PRODUCTION_BATCH, { IProductionBatch } from "../models/productionBatches.model";
import PRODUCTION_TEAM, { IProductionTeam } from "../models/productionTeams.model";
import FINISHED_GOOD, { IFinishedGood } from "../models/finishedGoods.model";
import FINISHED_GOOD_STOCK_LOG, { IFinishedGoodStockLog } from "../models/finishedGoodStockLogs.model";
import MACHINE, { IMachine } from "../models/machines.model";
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
	dynamicWhere, zero, stock_log_movement_type,
} from '../config/config';
import { deleteImage } from '../middleware/uploads';

dotenv.config();

const { clouder_key, cloudy_name, cloudy_key, cloudy_secret } = process.env;

export default class ProductionQcLogController {
	async getProductionQcLogs(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await PRODUCTION_QC_LOG.count();
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await PRODUCTION_QC_LOG.findAndCountAll({
				attributes: { exclude: ['id'] },
				include: [
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
					{
						model: MACHINE,
						attributes: ['unique_id', 'name', 'code', 'type', 'expected_blocks_per_day', 'fuel_type', 'installed_date', 'is_active']
					},
					{
						model: PRODUCTION_TEAM,
						attributes: ['unique_id', 'name', 'is_active']
					}, 
					{
						model: PRODUCTION_BATCH,
						attributes: ['unique_id', 'quantity_produced', 'production_date', 'shift']
					}, 
					{
						model: FINISHED_GOOD,
						attributes: ['unique_id', 'reference', 'name', 'type', 'unit_of_measure', 'current_quantity', 'unit_cost', 'selling_price'], 
					}, 
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Production QC Logs", user_unique_id, "Queried Production QC Logs", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Production QC Logs Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Production QC Logs loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getProductionQcLog(req: IGetAuthTypesRequest, res: Response) {
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
			const response = await PRODUCTION_QC_LOG.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }, 
				include: [
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
					{
						model: MACHINE,
						attributes: ['unique_id', 'name', 'code', 'type', 'expected_blocks_per_day', 'fuel_type', 'installed_date', 'is_active']
					},
					{
						model: PRODUCTION_TEAM,
						attributes: ['unique_id', 'name', 'is_active']
					}, 
					{
						model: PRODUCTION_BATCH,
						attributes: ['unique_id', 'quantity_produced', 'production_date', 'shift']
					}, 
					{
						model: FINISHED_GOOD,
						attributes: ['unique_id', 'reference', 'name', 'type', 'unit_of_measure', 'current_quantity', 'unit_cost', 'selling_price'], 
					}, 
				], 
			});

			addLog("Production QC Logs", user_unique_id, "Queried Production QC Log", queryParams);
			if (!response) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Production QC Log Not found" }, null);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Production QC Log loaded" }, response);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async searchProductionQcLogs(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await PRODUCTION_QC_LOG.count({
			where: {
				[Op.or]: [
					{
						notes: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					}
				]
			}
		});
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await PRODUCTION_QC_LOG.findAndCountAll({
				attributes: { exclude: ['id'] },
				where: {
					[Op.or]: [
						{
							notes: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
						}
					]
				}, 
				include: [
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
					{
						model: MACHINE,
						attributes: ['unique_id', 'name', 'code', 'type', 'expected_blocks_per_day', 'fuel_type', 'installed_date', 'is_active']
					},
					{
						model: PRODUCTION_TEAM,
						attributes: ['unique_id', 'name', 'is_active']
					}, 
					{
						model: PRODUCTION_BATCH,
						attributes: ['unique_id', 'quantity_produced', 'production_date', 'shift']
					}, 
					{
						model: FINISHED_GOOD,
						attributes: ['unique_id', 'reference', 'name', 'type', 'unit_of_measure', 'current_quantity', 'unit_cost', 'selling_price'], 
					}, 
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Production QC Logs", user_unique_id, "Searched Production QC Logs", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Production QC Logs Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Production QC Logs loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getProductionQcLogsSpecifically(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await PRODUCTION_QC_LOG.count({ where: dynamicWhere(queryParams) });
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await PRODUCTION_QC_LOG.findAndCountAll({
				attributes: { exclude: ['id'] },
				where: dynamicWhere(queryParams), 
				include: [
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
					{
						model: MACHINE,
						attributes: ['unique_id', 'name', 'code', 'type', 'expected_blocks_per_day', 'fuel_type', 'installed_date', 'is_active']
					},
					{
						model: PRODUCTION_TEAM,
						attributes: ['unique_id', 'name', 'is_active']
					}, 
					{
						model: PRODUCTION_BATCH,
						attributes: ['unique_id', 'quantity_produced', 'production_date', 'shift']
					}, 
					{
						model: FINISHED_GOOD,
						attributes: ['unique_id', 'reference', 'name', 'type', 'unit_of_measure', 'current_quantity', 'unit_cost', 'selling_price'], 
					}, 
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Production QC Logs", user_unique_id, "Queried Production QC Logs specifically", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Production QC Logs Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Production QC Logs loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async filterProductionQcLogsSpecifically(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await PRODUCTION_QC_LOG.count({
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
			const response = await PRODUCTION_QC_LOG.findAndCountAll({
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
						model: USER,
						attributes: ['unique_id', 'firstname', 'middlename', 'lastname', 'username', 'email'], 
						include: [
							{
								model: ROLE,
								attributes: ['unique_id', 'name', 'stripped']
							}
						]
					},
					{
						model: MACHINE,
						attributes: ['unique_id', 'name', 'code', 'type', 'expected_blocks_per_day', 'fuel_type', 'installed_date', 'is_active']
					},
					{
						model: PRODUCTION_TEAM,
						attributes: ['unique_id', 'name', 'is_active']
					}, 
					{
						model: PRODUCTION_BATCH,
						attributes: ['unique_id', 'quantity_produced', 'production_date', 'shift']
					}, 
					{
						model: FINISHED_GOOD,
						attributes: ['unique_id', 'reference', 'name', 'type', 'unit_of_measure', 'current_quantity', 'unit_cost', 'selling_price'], 
					}, 
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Production QC Logs", user_unique_id, "Filtered Production QC Logs specifically", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Production QC Logs Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Production QC Logs loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async publicGetProductionQcLogs(req: IGetAuthTypesRequest, res: Response) {
		const queryParams: IPagination = req.query;

		const total_records = await PRODUCTION_QC_LOG.count({ where: { status: default_status } });
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await PRODUCTION_QC_LOG.findAndCountAll({
				attributes: { exclude: ['id', 'status'] },
				where: { status: default_status },
				include: [
					{
						model: MACHINE,
						attributes: ['unique_id', 'name', 'code', 'type', 'expected_blocks_per_day', 'fuel_type', 'installed_date', 'is_active']
					},
					{
						model: PRODUCTION_TEAM,
						attributes: ['unique_id', 'name', 'is_active']
					}, 
					{
						model: PRODUCTION_BATCH,
						attributes: ['unique_id', 'quantity_produced', 'production_date', 'shift']
					}, 
					{
						model: FINISHED_GOOD,
						attributes: ['unique_id', 'reference', 'name', 'type', 'unit_of_measure', 'current_quantity', 'unit_cost', 'selling_price'], 
					}, 
				], 
				order: [
					[orderBy, sortBy]
				],
				// offset: pagination.start,
				// limit: pagination.limit
			});

			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: anonymous, text: "Production QC Logs Not found" }, []);
			} else {
				// return SuccessResponse(res, { unique_id: anonymous, text: "Production QC Logs loaded" }, { ...response, pages: pagination.pages });
				return SuccessResponse(res, { unique_id: anonymous, text: "Production QC Logs loaded" }, { ...response });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async publicGetProductionQcLog(req: IGetAuthTypesRequest, res: Response) {
		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: anonymous, text: "Validation Error Occured" }, errors.array())
		}

		try {
			const response = await PRODUCTION_QC_LOG.findOne({
				attributes: { exclude: ['id', 'status'] },
				where: { ...payload }, 
				include: [
					{
						model: MACHINE,
						attributes: ['unique_id', 'name', 'code', 'type', 'expected_blocks_per_day', 'fuel_type', 'installed_date', 'is_active']
					},
					{
						model: PRODUCTION_TEAM,
						attributes: ['unique_id', 'name', 'is_active']
					}, 
					{
						model: PRODUCTION_BATCH,
						attributes: ['unique_id', 'quantity_produced', 'production_date', 'shift']
					}, 
					{
						model: FINISHED_GOOD,
						attributes: ['unique_id', 'reference', 'name', 'type', 'unit_of_measure', 'current_quantity', 'unit_cost', 'selling_price'], 
					}, 
				], 
			});

			if (!response) {
				return SuccessResponse(res, { unique_id: anonymous, text: "Production QC Log Not found" }, null);
			} else {
				return SuccessResponse(res, { unique_id: anonymous, text: "Production QC Log loaded" }, response);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async publicSearchProductionQcLogs(req: IGetAuthTypesRequest, res: Response) {
		const queryParams: IPagination = req.query;

		const total_records = await PRODUCTION_QC_LOG.count({
			where: {
				[Op.or]: [
					{
						notes: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					}
				]
			}
		});
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await PRODUCTION_QC_LOG.findAndCountAll({
				attributes: { exclude: ['id', 'status'] },
				where: {
					[Op.or]: [
						{
							notes: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
						}
					]
				}, 
				include: [
					{
						model: MACHINE,
						attributes: ['unique_id', 'name', 'code', 'type', 'expected_blocks_per_day', 'fuel_type', 'installed_date', 'is_active']
					},
					{
						model: PRODUCTION_TEAM,
						attributes: ['unique_id', 'name', 'is_active']
					}, 
					{
						model: PRODUCTION_BATCH,
						attributes: ['unique_id', 'quantity_produced', 'production_date', 'shift']
					}, 
					{
						model: FINISHED_GOOD,
						attributes: ['unique_id', 'reference', 'name', 'type', 'unit_of_measure', 'current_quantity', 'unit_cost', 'selling_price'], 
					}, 
				], 
				order: [
					[orderBy, sortBy]
				],
				// offset: pagination.start,
				// limit: pagination.limit
			});

			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: anonymous, text: "Production QC Logs Not found" }, []);
			} else {
				// return SuccessResponse(res, { unique_id: anonymous, text: "Production QC Logs loaded" }, { ...response, pages: pagination.pages });
				return SuccessResponse(res, { unique_id: anonymous, text: "Production QC Logs loaded" }, { ...response });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async addProductionQcLog(req: IGetAuthTypesRequest, res: Response) {
		const user_unique_id: string = req.USER_UNIQUE_ID;

		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: user_unique_id, text: "Validation Error Occured" }, errors.array());
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
		
		if (!acl_details.add) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized access to add record content" }, null);
		}

		try {
			const production_batch_details = await PRODUCTION_BATCH.findOne({
				attributes: { exclude: ['id'] },
				where: {
					unique_id: payload.production_batch_unique_id,
				}
			});

			if (!production_batch_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Production Batch not found" }, null);
			}

			if (production_batch_details.quantity_produced && parseInt(payload.defective_quantity) > production_batch_details.quantity_produced) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Defective Quantity cannot exceed Quantity Produced" }, null);
			}

			const machine_details = await MACHINE.findOne({
				attributes: { exclude: ['id'] },
				where: {
					unique_id: production_batch_details.machine_unique_id,
				}
			});

			if (!machine_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Machine not found" }, null);
			}

			const production_team_details = await PRODUCTION_TEAM.findOne({
				attributes: { exclude: ['id'] },
				where: {
					unique_id: production_batch_details.production_team_unique_id,
				}
			});

			if (!production_team_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Production Team not found" }, null);
			}

			const finished_good_details = await FINISHED_GOOD.findOne({
				attributes: { exclude: ['id'] },
				where: {
					unique_id: production_batch_details.finished_good_unique_id,
				}
			});

			if (!finished_good_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Finished Good not found" }, null);
			}

			const new_finished_good_current_quantity = finished_good_details.current_quantity && finished_good_details.current_quantity > 0 && parseInt(payload.defective_quantity) > 0 ? finished_good_details.current_quantity - parseInt(payload.defective_quantity) : finished_good_details.current_quantity;
			
			const production_qc_log_unique_id = uuidv4();

			await PRODUCTION_QC_LOG.sequelize?.transaction(async (transaction) => {
				const productionQcLogResponse = await PRODUCTION_QC_LOG.create({
					unique_id: production_qc_log_unique_id,
					machine_unique_id: production_batch_details.machine_unique_id, 
					production_batch_unique_id: payload.production_batch_unique_id, 
					production_team_unique_id: production_batch_details.production_team_unique_id, 
					finished_good_unique_id: production_batch_details.finished_good_unique_id, 
					defective_quantity: parseInt(payload.defective_quantity),
					qc_date: payload.qc_date,
					notes: payload.notes ? payload.notes : null,
					created_by: user_unique_id,
					status: default_status
				}, { transaction });
				const responseFinishedGoodStockLog = await FINISHED_GOOD_STOCK_LOG.create({
					unique_id: uuidv4(),
					finished_good_unique_id: finished_good_details.unique_id,
					movement_type: stock_log_movement_type.out,
					quantity: parseInt(payload.defective_quantity),
					unit_cost: null,
					quantity_after: new_finished_good_current_quantity,
					source_module: "Production - QC Logs",
					reference: production_qc_log_unique_id,
					created_by: user_unique_id,
					status: default_status
				}, { transaction });

				addLog("Production QC Logs", user_unique_id, "Added Production QC Log", payload);
				if (productionQcLogResponse && responseFinishedGoodStockLog) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Production QC Log created successfully!" }, { unique_id: production_qc_log_unique_id });
				} else {
					throw new Error("Error adding production qc log");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async deleteProductionQcLog(req: IGetAuthTypesRequest, res: Response) {
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
			await PRODUCTION_QC_LOG.sequelize?.transaction(async (transaction) => {
				const response = await PRODUCTION_QC_LOG.destroy(
					{
						where: {
							unique_id: payload.unique_id,
							status: default_status
						},
						transaction
					}
				);

				addLog("Production QC Logs", user_unique_id, "Deleted Production QC Log", payload);
				if (response > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Production QC Log was deleted successfully!" }, null);
				} else {
					throw new Error("Error deleting record");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}
};
