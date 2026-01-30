import { Request, Response } from "express";
import { Op } from "sequelize";
import { validationResult, matchedData } from 'express-validator';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import MACHINE_MAINTENANCE_LOG, { IMachineMaintenanceLog } from "../models/machineMaintenanceLogs.model";
import VENDOR, { IVendor } from "../models/vendors.model";
import MACHINE, { IMachine } from "../models/machines.model";
import ACL, { IACL } from "../models/acls.model";
import MODULE, { IModule } from "../models/modules.model";
import SUB_MODULE, { ISubModule } from "../models/subModules.model";
import ROLE, { IRole } from "../models/roles.model";
import USER, { IUser } from "../models/users.model";
import { addLog } from "./logs.controller";
import { addExpense, deleteExpense } from "./expenses.controller";
import { IGetAuthTypesRequest } from "../middleware/checks";
import { ServerError, SuccessResponse, ValidationError, OtherSuccessResponse, NotFoundError, BadRequestError, logger, UnauthorizedError } from '../common/index';
import {
	IPagination, ISearch, default_status, paginate, return_all_letters_uppercase, anonymous, true_status, false_status, strip_text, timestamp_str_alt,
	dynamicWhere, zero, stock_log_movement_type,
} from '../config/config';
import { deleteImage } from '../middleware/uploads';

dotenv.config();

const { clouder_key, cloudy_name, cloudy_key, cloudy_secret } = process.env;

export default class MachineMaintenanceLogController {
	async getMachineMaintenanceLogs(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await MACHINE_MAINTENANCE_LOG.count();
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await MACHINE_MAINTENANCE_LOG.findAndCountAll({
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
						model: VENDOR,
						attributes: ['unique_id', 'reference', 'type', 'name', 'contact_person', 'email', 'phone_number', 'alt_phone_number', 'total_spend', 'profile_image']
					}, 
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Machine Maintenance Logs", user_unique_id, "Queried Machine Maintenance Logs", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Machine Maintenance Logs Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Machine Maintenance Logs loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getMachineMaintenanceLog(req: IGetAuthTypesRequest, res: Response) {
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
			const response = await MACHINE_MAINTENANCE_LOG.findOne({
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
						model: VENDOR,
						attributes: ['unique_id', 'reference', 'type', 'name', 'contact_person', 'email', 'phone_number', 'alt_phone_number', 'total_spend', 'profile_image']
					}, 
				], 
			});

			addLog("Machine Maintenance Logs", user_unique_id, "Queried Machine Maintenance Log", queryParams);
			if (!response) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Machine Maintenance Log Not found" }, null);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Machine Maintenance Log loaded" }, response);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async searchMachineMaintenanceLogs(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await MACHINE_MAINTENANCE_LOG.count({
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
			const response = await MACHINE_MAINTENANCE_LOG.findAndCountAll({
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
						model: VENDOR,
						attributes: ['unique_id', 'reference', 'type', 'name', 'contact_person', 'email', 'phone_number', 'alt_phone_number', 'total_spend', 'profile_image']
					}, 
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Machine Maintenance Logs", user_unique_id, "Searched Machine Maintenance Logs", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Machine Maintenance Logs Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Machine Maintenance Logs loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getMachineMaintenanceLogsSpecifically(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await MACHINE_MAINTENANCE_LOG.count({ where: dynamicWhere(queryParams) });
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await MACHINE_MAINTENANCE_LOG.findAndCountAll({
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
						model: VENDOR,
						attributes: ['unique_id', 'reference', 'type', 'name', 'contact_person', 'email', 'phone_number', 'alt_phone_number', 'total_spend', 'profile_image']
					}, 
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Machine Maintenance Logs", user_unique_id, "Queried Machine Maintenance Logs specifically", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Machine Maintenance Logs Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Machine Maintenance Logs loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async filterMachineMaintenanceLogsSpecifically(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await MACHINE_MAINTENANCE_LOG.count({
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
			const response = await MACHINE_MAINTENANCE_LOG.findAndCountAll({
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
						model: VENDOR,
						attributes: ['unique_id', 'reference', 'type', 'name', 'contact_person', 'email', 'phone_number', 'alt_phone_number', 'total_spend', 'profile_image']
					}, 
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Machine Maintenance Logs", user_unique_id, "Filtered Machine Maintenance Logs specifically", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Machine Maintenance Logs Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Machine Maintenance Logs loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async publicGetMachineMaintenanceLogs(req: IGetAuthTypesRequest, res: Response) {
		const queryParams: IPagination = req.query;

		const total_records = await MACHINE_MAINTENANCE_LOG.count({ where: { status: default_status } });
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await MACHINE_MAINTENANCE_LOG.findAndCountAll({
				attributes: { exclude: ['id', 'status'] },
				where: { status: default_status },
				include: [
					{
						model: MACHINE,
						attributes: ['unique_id', 'name', 'code', 'type', 'expected_blocks_per_day', 'fuel_type', 'installed_date', 'is_active']
					},
					{
						model: VENDOR,
						attributes: ['unique_id', 'reference', 'type', 'name', 'contact_person', 'email', 'phone_number', 'alt_phone_number', 'total_spend', 'profile_image']
					}, 
				], 
				order: [
					[orderBy, sortBy]
				],
				// offset: pagination.start,
				// limit: pagination.limit
			});

			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: anonymous, text: "Machine Maintenance Logs Not found" }, []);
			} else {
				// return SuccessResponse(res, { unique_id: anonymous, text: "Machine Maintenance Logs loaded" }, { ...response, pages: pagination.pages });
				return SuccessResponse(res, { unique_id: anonymous, text: "Machine Maintenance Logs loaded" }, { ...response });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async publicGetMachineMaintenanceLog(req: IGetAuthTypesRequest, res: Response) {
		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: anonymous, text: "Validation Error Occured" }, errors.array())
		}

		try {
			const response = await MACHINE_MAINTENANCE_LOG.findOne({
				attributes: { exclude: ['id', 'status'] },
				where: { ...payload }, 
				include: [
					{
						model: MACHINE,
						attributes: ['unique_id', 'name', 'code', 'type', 'expected_blocks_per_day', 'fuel_type', 'installed_date', 'is_active']
					},
					{
						model: VENDOR,
						attributes: ['unique_id', 'reference', 'type', 'name', 'contact_person', 'email', 'phone_number', 'alt_phone_number', 'total_spend', 'profile_image']
					}, 
				], 
			});

			if (!response) {
				return SuccessResponse(res, { unique_id: anonymous, text: "Machine Maintenance Log Not found" }, null);
			} else {
				return SuccessResponse(res, { unique_id: anonymous, text: "Machine Maintenance Log loaded" }, response);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async publicSearchMachineMaintenanceLogs(req: IGetAuthTypesRequest, res: Response) {
		const queryParams: IPagination = req.query;

		const total_records = await MACHINE_MAINTENANCE_LOG.count({
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
			const response = await MACHINE_MAINTENANCE_LOG.findAndCountAll({
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
						model: VENDOR,
						attributes: ['unique_id', 'reference', 'type', 'name', 'contact_person', 'email', 'phone_number', 'alt_phone_number', 'total_spend', 'profile_image']
					}, 
				], 
				order: [
					[orderBy, sortBy]
				],
				// offset: pagination.start,
				// limit: pagination.limit
			});

			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: anonymous, text: "Machine Maintenance Logs Not found" }, []);
			} else {
				// return SuccessResponse(res, { unique_id: anonymous, text: "Machine Maintenance Logs loaded" }, { ...response, pages: pagination.pages });
				return SuccessResponse(res, { unique_id: anonymous, text: "Machine Maintenance Logs loaded" }, { ...response });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async addMachineMaintenanceLog(req: IGetAuthTypesRequest, res: Response) {
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
			const machine_details = await MACHINE.findOne({
				attributes: { exclude: ['id'] },
				where: {
					unique_id: payload.machine_unique_id,
				}
			});

			if (!machine_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Machine not found" }, null);
			}

			if (!machine_details.is_active) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Machine is not active" }, null);
			}

			const machine_maintenance_log_unique_id = uuidv4();

			if (payload.vendor_unique_id) {
				const vendor_details = await VENDOR.findOne({
					attributes: { exclude: ['id'] },
					where: {
						unique_id: payload.vendor_unique_id,
					}
				});
	
				if (!vendor_details) {
					return BadRequestError(res, { unique_id: user_unique_id, text: "Vendor not found" }, null);
				}
	
				const new_vendor_total_spend = vendor_details.total_spend && vendor_details.total_spend >= 0 && parseInt(payload.cost) > 0 ? vendor_details.total_spend + parseInt(payload.cost) : vendor_details.total_spend;

				await MACHINE_MAINTENANCE_LOG.sequelize?.transaction(async (transaction) => {
					const productionBatchResponse = await MACHINE_MAINTENANCE_LOG.create({
						unique_id: machine_maintenance_log_unique_id,
						machine_unique_id: payload.machine_unique_id, 
						vendor_unique_id: payload.vendor_unique_id ? payload.vendor_unique_id : null, 
						service_date: payload.service_date,
						cost: parseInt(payload.cost),
						next_service_date: payload.next_service_date ? payload.next_service_date : null,
						notes: payload.notes,
						created_by: user_unique_id,
						status: default_status
					}, { transaction });
					const responseVendor = await VENDOR.update( { total_spend: new_vendor_total_spend }, { where: { unique_id: vendor_details.unique_id, status: default_status }, transaction } );
					
					addExpense({
						amount: parseInt(payload.cost),
						category: "Machine Maintenance Logs",
						created_by: user_unique_id,
						expense_date: payload.service_date,
						machine_maintenance_log_unique_id: machine_maintenance_log_unique_id,
						notes: payload.notes,
					}, user_unique_id);

					addLog("Machine Maintenance Logs", user_unique_id, "Added Machine Maintenance Log", payload);
					if (productionBatchResponse && responseVendor[0] > 0) {
						return SuccessResponse(res, { unique_id: user_unique_id, text: "Machine Maintenance Log created successfully!" }, { unique_id: machine_maintenance_log_unique_id });
					} else {
						throw new Error("Error adding production batch");
					}
				});
			} else {
				await MACHINE_MAINTENANCE_LOG.sequelize?.transaction(async (transaction) => {
					const productionBatchResponse = await MACHINE_MAINTENANCE_LOG.create({
						unique_id: machine_maintenance_log_unique_id,
						machine_unique_id: payload.machine_unique_id, 
						vendor_unique_id: payload.vendor_unique_id ? payload.vendor_unique_id : null, 
						service_date: payload.service_date,
						cost: parseInt(payload.cost),
						next_service_date: payload.next_service_date ? payload.next_service_date : null,
						notes: payload.notes,
						created_by: user_unique_id,
						status: default_status
					}, { transaction });

					addExpense({
						amount: parseInt(payload.cost),
						category: "Machine Maintenance Logs",
						created_by: user_unique_id,
						expense_date: payload.service_date,
						machine_maintenance_log_unique_id: machine_maintenance_log_unique_id,
						notes: payload.notes,
					}, user_unique_id);
					
					addLog("Machine Maintenance Logs", user_unique_id, "Added Machine Maintenance Log", payload);
					if (productionBatchResponse) {
						return SuccessResponse(res, { unique_id: user_unique_id, text: "Machine Maintenance Log created successfully!" }, { unique_id: machine_maintenance_log_unique_id });
					} else {
						throw new Error("Error adding production batch");
					}
				});
			}
			
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async deleteMachineMaintenanceLog(req: IGetAuthTypesRequest, res: Response) {
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
			await MACHINE_MAINTENANCE_LOG.sequelize?.transaction(async (transaction) => {
				const response = await MACHINE_MAINTENANCE_LOG.destroy(
					{
						where: {
							unique_id: payload.unique_id,
							status: default_status
						},
						transaction
					}
				);

				addLog("Machine Maintenance Logs", user_unique_id, "Deleted Machine Maintenance Log", payload);
				if (response > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Machine Maintenance Log was deleted successfully!" }, null);
				} else {
					throw new Error("Error deleting record");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}
};
