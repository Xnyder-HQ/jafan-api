import { Request, Response } from "express";
import { Op } from "sequelize";
import { validationResult, matchedData } from 'express-validator';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import LOGISTICS_FUEL_LOG, { ILogisticsFuelLog } from "../models/logisticsFuelLogs.model";
import VEHICLE, { IVehicle } from "../models/vehicles.model";
import RAW_MATERIAL, { IRawMaterial } from "../models/rawMaterials.model";
import RAW_MATERIAL_STOCK_LOG, { IRawMaterialStockLog } from "../models/rawMaterialStockLogs.model";
import FUEL_PURCHASE, { IFuelPurchase } from "../models/fuelPurchases.model";
import BUSINESS_RULE, { IBusinessRule } from "../models/businessRules.model";
// import EMPLOYEE, { IEmployee } from "../models/employees.model"; // Uncomment when you implement employee module
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
	dynamicWhere, zero, stock_log_movement_type, business_rules, completed,
	fuel_type,
} from '../config/config';
import { deleteImage } from '../middleware/uploads';

dotenv.config();

const { clouder_key, cloudy_name, cloudy_key, cloudy_secret } = process.env;

export default class LogisticsFuelLogController {
	async getLogisticsFuelLogs(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await LOGISTICS_FUEL_LOG.count();
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await LOGISTICS_FUEL_LOG.findAndCountAll({
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
						model: VEHICLE,
						attributes: ['unique_id', 'reference', 'code', 'plate_number', 'type', 'capacity_unit', 'capacity_value', 'fuel_type', 'benchmark_fuel_liters', 'expected_trips_per_benchmark', 'purchase_date', 'availability_status', 'is_active']
					},  
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Logistics Fuel Logs", user_unique_id, "Queried Logistics Fuel Logs", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Logistics Fuel Logs Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Logistics Fuel Logs loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getLogisticsFuelLog(req: IGetAuthTypesRequest, res: Response) {
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
			const response = await LOGISTICS_FUEL_LOG.findOne({
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
						model: VEHICLE,
						attributes: ['unique_id', 'reference', 'code', 'plate_number', 'type', 'capacity_unit', 'capacity_value', 'fuel_type', 'benchmark_fuel_liters', 'expected_trips_per_benchmark', 'purchase_date', 'availability_status', 'is_active']
					}, 
				], 
			});

			addLog("Logistics Fuel Logs", user_unique_id, "Queried Logistics Fuel Log", queryParams);
			if (!response) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Logistics Fuel Log Not found" }, null);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Logistics Fuel Log loaded" }, response);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async searchLogisticsFuelLogs(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await LOGISTICS_FUEL_LOG.count({
			where: {
				[Op.or]: [
					{
						notes: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					},
					{
						fuel_type: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					}
				]
			}
		});
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await LOGISTICS_FUEL_LOG.findAndCountAll({
				attributes: { exclude: ['id'] },
				where: {
					[Op.or]: [
						{
							notes: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
						},
						{
							fuel_type: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
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
						model: VEHICLE,
						attributes: ['unique_id', 'reference', 'code', 'plate_number', 'type', 'capacity_unit', 'capacity_value', 'fuel_type', 'benchmark_fuel_liters', 'expected_trips_per_benchmark', 'purchase_date', 'availability_status', 'is_active']
					}, 
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Logistics Fuel Logs", user_unique_id, "Searched Logistics Fuel Logs", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Logistics Fuel Logs Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Logistics Fuel Logs loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getLogisticsFuelLogsSpecifically(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await LOGISTICS_FUEL_LOG.count({ where: dynamicWhere(queryParams) });
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await LOGISTICS_FUEL_LOG.findAndCountAll({
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
						model: VEHICLE,
						attributes: ['unique_id', 'reference', 'code', 'plate_number', 'type', 'capacity_unit', 'capacity_value', 'fuel_type', 'benchmark_fuel_liters', 'expected_trips_per_benchmark', 'purchase_date', 'availability_status', 'is_active']
					}, 
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Logistics Fuel Logs", user_unique_id, "Queried Logistics Fuel Logs specifically", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Logistics Fuel Logs Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Logistics Fuel Logs loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async filterLogisticsFuelLogsSpecifically(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await LOGISTICS_FUEL_LOG.count({
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
			const response = await LOGISTICS_FUEL_LOG.findAndCountAll({
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
						model: VEHICLE,
						attributes: ['unique_id', 'reference', 'code', 'plate_number', 'type', 'capacity_unit', 'capacity_value', 'fuel_type', 'benchmark_fuel_liters', 'expected_trips_per_benchmark', 'purchase_date', 'availability_status', 'is_active']
					}, 
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Logistics Fuel Logs", user_unique_id, "Filtered Logistics Fuel Logs specifically", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Logistics Fuel Logs Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Logistics Fuel Logs loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async publicGetLogisticsFuelLogs(req: IGetAuthTypesRequest, res: Response) {
		const queryParams: IPagination = req.query;

		const total_records = await LOGISTICS_FUEL_LOG.count({ where: { status: default_status } });
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await LOGISTICS_FUEL_LOG.findAndCountAll({
				attributes: { exclude: ['id', 'status'] },
				where: { status: default_status },
				include: [
					{
						model: VEHICLE,
						attributes: ['unique_id', 'reference', 'code', 'plate_number', 'type', 'capacity_unit', 'capacity_value', 'fuel_type', 'benchmark_fuel_liters', 'expected_trips_per_benchmark', 'purchase_date', 'availability_status', 'is_active']
					}, 
				], 
				order: [
					[orderBy, sortBy]
				],
				// offset: pagination.start,
				// limit: pagination.limit
			});

			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: anonymous, text: "Logistics Fuel Logs Not found" }, []);
			} else {
				// return SuccessResponse(res, { unique_id: anonymous, text: "Logistics Fuel Logs loaded" }, { ...response, pages: pagination.pages });
				return SuccessResponse(res, { unique_id: anonymous, text: "Logistics Fuel Logs loaded" }, { ...response });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async publicGetLogisticsFuelLog(req: IGetAuthTypesRequest, res: Response) {
		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: anonymous, text: "Validation Error Occured" }, errors.array())
		}

		try {
			const response = await LOGISTICS_FUEL_LOG.findOne({
				attributes: { exclude: ['id', 'status'] },
				where: { ...payload }, 
				include: [
					{
						model: VEHICLE,
						attributes: ['unique_id', 'reference', 'code', 'plate_number', 'type', 'capacity_unit', 'capacity_value', 'fuel_type', 'benchmark_fuel_liters', 'expected_trips_per_benchmark', 'purchase_date', 'availability_status', 'is_active']
					}, 
				], 
			});

			if (!response) {
				return SuccessResponse(res, { unique_id: anonymous, text: "Logistics Fuel Log Not found" }, null);
			} else {
				return SuccessResponse(res, { unique_id: anonymous, text: "Logistics Fuel Log loaded" }, response);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async publicSearchLogisticsFuelLogs(req: IGetAuthTypesRequest, res: Response) {
		const queryParams: IPagination = req.query;

		const total_records = await LOGISTICS_FUEL_LOG.count({
			where: {
				[Op.or]: [
					{
						notes: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					},
					{
						fuel_type: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					}
				]
			}
		});
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await LOGISTICS_FUEL_LOG.findAndCountAll({
				attributes: { exclude: ['id', 'status'] },
				where: {
					[Op.or]: [
						{
							notes: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
						},
						{
							fuel_type: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
						}
					]
				}, 
				include: [
					{
						model: VEHICLE,
						attributes: ['unique_id', 'reference', 'code', 'plate_number', 'type', 'capacity_unit', 'capacity_value', 'fuel_type', 'benchmark_fuel_liters', 'expected_trips_per_benchmark', 'purchase_date', 'availability_status', 'is_active']
					}, 
				], 
				order: [
					[orderBy, sortBy]
				],
				// offset: pagination.start,
				// limit: pagination.limit
			});

			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: anonymous, text: "Logistics Fuel Logs Not found" }, []);
			} else {
				// return SuccessResponse(res, { unique_id: anonymous, text: "Logistics Fuel Logs loaded" }, { ...response, pages: pagination.pages });
				return SuccessResponse(res, { unique_id: anonymous, text: "Logistics Fuel Logs loaded" }, { ...response });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async addLogisticsFuelLog(req: IGetAuthTypesRequest, res: Response) {
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
			const vehicle_details = await VEHICLE.findOne({
				attributes: { exclude: ['id'] },
				where: {
					unique_id: payload.vehicle_unique_id,
				}
			});

			if (!vehicle_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Vehicle not found" }, null);
			}

			if (payload.fuel_type && payload.fuel_type !== vehicle_details.fuel_type) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Fuel Type not compatible with vehicle" }, null);
			}

			// Do for employee / driver here

			const raw_material_stock_log_details = await RAW_MATERIAL_STOCK_LOG.findOne({
				attributes: { exclude: ['id'] },
				where: {
					source_module: "Procurement - Fuel Purchases",
					movement_type: stock_log_movement_type.in,
				},
				order: [['createdAt', 'DESC']]
			});
			
			if (!raw_material_stock_log_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Raw Material Stock Log (IN) not found" }, null);
			}
			
			const fuel_purchase_details = await FUEL_PURCHASE.findOne({
				attributes: { exclude: ['id'] },
				where: { 
					[Op.or]: [
						{
							[Op.and]: {
								reference: raw_material_stock_log_details.reference, 
								fuel_type: payload.fuel_type ? payload.fuel_type : vehicle_details.fuel_type
							}
						}, 
						{
							fuel_type: payload.fuel_type ? payload.fuel_type : vehicle_details.fuel_type
						}
					]
				}
			});
			
			if (!fuel_purchase_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Fuel Purchase for Raw Material Stock Log (IN) not found" }, null);
			}

			const raw_material_details = await RAW_MATERIAL.findOne({
				attributes: { exclude: ['id'] },
				where: {
					unique_id: fuel_purchase_details.raw_material_unique_id,
				}
			});

			if (!raw_material_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Raw Material not found" }, null);
			}

			if (raw_material_details.current_quantity && parseInt(payload.liters_dispensed) > raw_material_details.current_quantity) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Liters Dispensed cannot exceed Current Quantity of Raw Material" }, null);
			}
			
			const new_raw_material_current_quantity = raw_material_details.current_quantity && raw_material_details.current_quantity > 0 && parseInt(payload.liters_dispensed) > 0 ? raw_material_details.current_quantity - parseInt(payload.liters_dispensed) : raw_material_details.current_quantity;

			if (payload.fuel_type && payload.fuel_type === fuel_type.diesel || vehicle_details.fuel_type === fuel_type.diesel) {
				const business_rule_fuel_type_details = await BUSINESS_RULE.findOne({
					attributes: { exclude: ['id'] },
					where: {
						rule_key: business_rules.DIESEL_PRICE_PER_LITER
					}
				});
				
				const price_per_liter = business_rule_fuel_type_details && business_rule_fuel_type_details.rule_value ? business_rule_fuel_type_details.rule_value : 0;
				const expected_trips = (parseInt(payload.liters_dispensed) / (vehicle_details && vehicle_details.benchmark_fuel_liters ? vehicle_details.benchmark_fuel_liters : 0)) * (vehicle_details && vehicle_details.expected_trips_per_benchmark ? vehicle_details.expected_trips_per_benchmark : 0);
				
				const logistics_fuel_log_unique_id = uuidv4();
	
				await LOGISTICS_FUEL_LOG.sequelize?.transaction(async (transaction) => {
					const logisticsFuelLogResponse = await LOGISTICS_FUEL_LOG.create({
						unique_id: logistics_fuel_log_unique_id,
						vehicle_unique_id: payload.vehicle_unique_id, 
						fuel_type: payload.fuel_type,
						liters_dispensed: parseInt(payload.liters_dispensed),
						price_per_liter,
						benchmark_liters: vehicle_details.benchmark_fuel_liters, 
						expected_trips, 
						actual_trips: parseInt(payload.actual_trips),
						dispense_date: payload.dispense_date,
						notes: payload.notes ? payload.notes : null,
						created_by: user_unique_id,
						status: default_status
					}, { transaction });
					const responseRawMaterial = await RAW_MATERIAL.update( { current_quantity: new_raw_material_current_quantity }, { where: { unique_id: raw_material_details.unique_id, status: default_status }, transaction } );
					const responseRawMaterialStockLog = await RAW_MATERIAL_STOCK_LOG.create({
						unique_id: uuidv4(),
						raw_material_unique_id: raw_material_details.unique_id,
						movement_type: stock_log_movement_type.out,
						quantity: parseInt(payload.liters_dispensed),
						unit_cost: null,
						quantity_after: new_raw_material_current_quantity,
						source_module: "Logistics Fuel Logs",
						reference: logistics_fuel_log_unique_id,
						created_by: user_unique_id,
						status: default_status
					}, { transaction });
	
					addLog("Logistics Fuel Logs", user_unique_id, "Added Logistics Fuel Log", payload);
					if (logisticsFuelLogResponse && responseRawMaterial[0] > 0 && responseRawMaterialStockLog) {
						return SuccessResponse(res, { unique_id: user_unique_id, text: "Logistics Fuel Log created successfully!" }, { unique_id: logistics_fuel_log_unique_id });
					} else {
						throw new Error("Error adding logistics fuel log");
					}
				});
			} else if (payload.fuel_type && payload.fuel_type === fuel_type.petrol || vehicle_details.fuel_type === fuel_type.petrol) {
				const business_rule_fuel_type_details = await BUSINESS_RULE.findOne({
					attributes: { exclude: ['id'] },
					where: {
						rule_key: business_rules.PETROL_PRICE_PER_LITER
					}
				});

				const price_per_liter = business_rule_fuel_type_details && business_rule_fuel_type_details.rule_value ? business_rule_fuel_type_details.rule_value : 0;
				const expected_trips = (parseInt(payload.liters_dispensed) / (vehicle_details && vehicle_details.benchmark_fuel_liters ? vehicle_details.benchmark_fuel_liters : 0)) * (vehicle_details && vehicle_details.expected_trips_per_benchmark ? vehicle_details.expected_trips_per_benchmark : 0);
				
				const logistics_fuel_log_unique_id = uuidv4();
	
				await LOGISTICS_FUEL_LOG.sequelize?.transaction(async (transaction) => {
					const logisticsFuelLogResponse = await LOGISTICS_FUEL_LOG.create({
						unique_id: logistics_fuel_log_unique_id,
						vehicle_unique_id: payload.vehicle_unique_id, 
						fuel_type: payload.fuel_type,
						liters_dispensed: parseInt(payload.liters_dispensed),
						price_per_liter,
						benchmark_liters: vehicle_details.benchmark_fuel_liters, 
						expected_trips, 
						actual_trips: parseInt(payload.actual_trips),
						dispense_date: payload.dispense_date,
						notes: payload.notes ? payload.notes : null,
						created_by: user_unique_id,
						status: default_status
					}, { transaction });
					const responseRawMaterial = await RAW_MATERIAL.update( { current_quantity: new_raw_material_current_quantity }, { where: { unique_id: raw_material_details.unique_id, status: default_status }, transaction } );
					const responseRawMaterialStockLog = await RAW_MATERIAL_STOCK_LOG.create({
						unique_id: uuidv4(),
						raw_material_unique_id: raw_material_details.unique_id,
						movement_type: stock_log_movement_type.out,
						quantity: parseInt(payload.liters_dispensed),
						unit_cost: null,
						quantity_after: new_raw_material_current_quantity,
						source_module: "Logistics Fuel Logs",
						reference: logistics_fuel_log_unique_id,
						created_by: user_unique_id,
						status: default_status
					}, { transaction });
	
					addLog("Logistics Fuel Logs", user_unique_id, "Added Logistics Fuel Log", payload);
					if (logisticsFuelLogResponse && responseRawMaterial[0] > 0 && responseRawMaterialStockLog) {
						return SuccessResponse(res, { unique_id: user_unique_id, text: "Logistics Fuel Log created successfully!" }, { unique_id: logistics_fuel_log_unique_id });
					} else {
						throw new Error("Error adding logistics fuel log");
					}
				});
			} else {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Invalid fuel type" }, null);
			}

		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async deleteLogisticsFuelLog(req: IGetAuthTypesRequest, res: Response) {
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
			await LOGISTICS_FUEL_LOG.sequelize?.transaction(async (transaction) => {
				const response = await LOGISTICS_FUEL_LOG.destroy(
					{
						where: {
							unique_id: payload.unique_id,
							status: default_status
						},
						transaction
					}
				);

				addLog("Logistics Fuel Logs", user_unique_id, "Deleted Logistics Fuel Log", payload);
				if (response > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Logistics Fuel Log was deleted successfully!" }, null);
				} else {
					throw new Error("Error deleting record");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}
};
