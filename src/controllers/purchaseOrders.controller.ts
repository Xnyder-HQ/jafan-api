import { Request, Response } from "express";
import { Op } from "sequelize";
import { validationResult, matchedData } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import PURCHASE_ORDER, { IPurchaseOrder } from "../models/purchaseOrders.model";
import VENDOR, { IVendor } from "../models/vendors.model";
import RAW_MATERIAL, { IRawMaterial } from "../models/rawMaterials.model";
import RAW_MATERIAL_STOCK_LOG, { IRawMaterialStockLog } from "../models/rawMaterialStockLogs.model";
import CATEGORY, { ICategory } from "../models/categories.model";
import USER, { IUser } from "../models/users.model";
import ACL, { IACL } from "../models/acls.model";
import MODULE, { IModule } from "../models/modules.model";
import SUB_MODULE, { ISubModule } from "../models/subModules.model";
import ROLE, { IRole } from "../models/roles.model";
import { addLog } from "./logs.controller";
import { IGetAuthTypesRequest } from "../middleware/checks";
import { ServerError, SuccessResponse, ValidationError, OtherSuccessResponse, NotFoundError, BadRequestError, logger, UnauthorizedError } from '../common/index';
import {
	IPagination, ISearch, default_status, paginate, return_all_letters_uppercase, anonymous, true_status, false_status, strip_text, timestamp_str_alt,
	dynamicWhere, pending, approved, processing, completed, random_uuid, zero, po_payment_status, po_delivery_status, stock_log_movement_type
} from '../config/config';

export default class PurchaseOrderController {
	async getPurchaseOrders(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await PURCHASE_ORDER.count();
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await PURCHASE_ORDER.findAndCountAll({
				attributes: { exclude: ['id'] },
				include: [
					{
						model: USER,
						attributes: ['unique_id', 'firstname', 'middlename', 'lastname', 'username', 'email', 'profile_image'], 
						as: "Creator",
						include: [
							{
								model: ROLE,
								attributes: ['unique_id', 'name', 'stripped']
							}
						]
					},
					{
						model: USER,
						attributes: ['unique_id', 'firstname', 'middlename', 'lastname', 'username', 'email', 'profile_image'], 
						as: "Approver",
						include: [
							{
								model: ROLE,
								attributes: ['unique_id', 'name', 'stripped']
							}
						]
					},
					{
						model: VENDOR,
						attributes: ['unique_id', 'reference', 'type', 'name', 'contact_person', 'email', 'phone_number', 'alt_phone_number', 'total_spend', 'profile_image']
					}, 
					{
						model: RAW_MATERIAL,
						attributes: ['unique_id', 'reference', 'name', 'type', 'unit_of_measure', 'current_quantity', 'reorder_level'], 
					}, 
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Purchase Orders", user_unique_id, "Queried Purchase Orders", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Purchase Orders Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Purchase Orders loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getPurchaseOrder(req: IGetAuthTypesRequest, res: Response) {
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
			const response = await PURCHASE_ORDER.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }, 
				include: [
					{
						model: USER,
						attributes: ['unique_id', 'firstname', 'middlename', 'lastname', 'username', 'email', 'profile_image'], 
						as: "Creator",
						include: [
							{
								model: ROLE,
								attributes: ['unique_id', 'name', 'stripped']
							}
						]
					},
					{
						model: USER,
						attributes: ['unique_id', 'firstname', 'middlename', 'lastname', 'username', 'email', 'profile_image'], 
						as: "Approver",
						include: [
							{
								model: ROLE,
								attributes: ['unique_id', 'name', 'stripped']
							}
						]
					},
					{
						model: VENDOR,
						attributes: ['unique_id', 'reference', 'type', 'name', 'contact_person', 'email', 'phone_number', 'alt_phone_number', 'total_spend', 'profile_image']
					}, 
					{
						model: RAW_MATERIAL,
						attributes: ['unique_id', 'reference', 'name', 'type', 'unit_of_measure', 'current_quantity', 'reorder_level'], 
					}, 
				],
			});

			addLog("Purchase Orders", user_unique_id, "Queried Purchase Order", queryParams);
			if (!response) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Purchase Order Not found" }, null);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Purchase Order loaded" }, response);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async searchPurchaseOrders(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await PURCHASE_ORDER.count({
			where: {
				[Op.or]: [
					{
						reference: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					}
				]
			}
		});
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await PURCHASE_ORDER.findAndCountAll({
				attributes: { exclude: ['id'] },
				where: {
					[Op.or]: [
						{
							reference: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
						}
					]
				}, 
				include: [
					{
						model: USER,
						attributes: ['unique_id', 'firstname', 'middlename', 'lastname', 'username', 'email', 'profile_image'], 
						as: "Creator",
						include: [
							{
								model: ROLE,
								attributes: ['unique_id', 'name', 'stripped']
							}
						]
					},
					{
						model: USER,
						attributes: ['unique_id', 'firstname', 'middlename', 'lastname', 'username', 'email', 'profile_image'], 
						as: "Approver",
						include: [
							{
								model: ROLE,
								attributes: ['unique_id', 'name', 'stripped']
							}
						]
					},
					{
						model: VENDOR,
						attributes: ['unique_id', 'reference', 'type', 'name', 'contact_person', 'email', 'phone_number', 'alt_phone_number', 'total_spend', 'profile_image']
					}, 
					{
						model: RAW_MATERIAL,
						attributes: ['unique_id', 'reference', 'name', 'type', 'unit_of_measure', 'current_quantity', 'reorder_level'], 
					}, 
				],
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Purchase Orders", user_unique_id, "Searched Purchase Orders", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Purchase Orders Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Purchase Orders loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getPurchaseOrdersSpecifically(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await PURCHASE_ORDER.count({ where: dynamicWhere(queryParams) });
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await PURCHASE_ORDER.findAndCountAll({
				attributes: { exclude: ['id'] },
				where: dynamicWhere(queryParams),
				include: [
					{
						model: USER,
						attributes: ['unique_id', 'firstname', 'middlename', 'lastname', 'username', 'email', 'profile_image'], 
						as: "Creator",
						include: [
							{
								model: ROLE,
								attributes: ['unique_id', 'name', 'stripped']
							}
						]
					},
					{
						model: USER,
						attributes: ['unique_id', 'firstname', 'middlename', 'lastname', 'username', 'email', 'profile_image'], 
						as: "Approver",
						include: [
							{
								model: ROLE,
								attributes: ['unique_id', 'name', 'stripped']
							}
						]
					},
					{
						model: VENDOR,
						attributes: ['unique_id', 'reference', 'type', 'name', 'contact_person', 'email', 'phone_number', 'alt_phone_number', 'total_spend', 'profile_image']
					}, 
					{
						model: RAW_MATERIAL,
						attributes: ['unique_id', 'reference', 'name', 'type', 'unit_of_measure', 'current_quantity', 'reorder_level'], 
					}, 
				],
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Purchase Orders", user_unique_id, "Queried Purchase Orders specifically", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Purchase Orders Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Purchase Orders loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async filterPurchaseOrdersSpecifically(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await PURCHASE_ORDER.count({
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
			const response = await PURCHASE_ORDER.findAndCountAll({
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
						attributes: ['unique_id', 'firstname', 'middlename', 'lastname', 'username', 'email', 'profile_image'], 
						as: "Creator",
						include: [
							{
								model: ROLE,
								attributes: ['unique_id', 'name', 'stripped']
							}
						]
					},
					{
						model: USER,
						attributes: ['unique_id', 'firstname', 'middlename', 'lastname', 'username', 'email', 'profile_image'], 
						as: "Approver",
						include: [
							{
								model: ROLE,
								attributes: ['unique_id', 'name', 'stripped']
							}
						]
					},
					{
						model: VENDOR,
						attributes: ['unique_id', 'reference', 'type', 'name', 'contact_person', 'email', 'phone_number', 'alt_phone_number', 'total_spend', 'profile_image']
					}, 
					{
						model: RAW_MATERIAL,
						attributes: ['unique_id', 'reference', 'name', 'type', 'unit_of_measure', 'current_quantity', 'reorder_level'], 
					}, 
				],
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Purchase Orders", user_unique_id, "Filtered Purchase Orders specifically", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Purchase Orders Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Purchase Orders loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async publicGetPurchaseOrders(req: IGetAuthTypesRequest, res: Response) {
		const queryParams: IPagination = req.query;

		const total_records = await PURCHASE_ORDER.count({ where: { status: default_status } });
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await PURCHASE_ORDER.findAndCountAll({
				attributes: { exclude: ['id', 'status'] },
				where: { status: default_status },
				include: [
					{
						model: USER,
						attributes: ['unique_id', 'firstname', 'middlename', 'lastname', 'username', 'email', 'profile_image'], 
						as: "Creator",
						include: [
							{
								model: ROLE,
								attributes: ['unique_id', 'name', 'stripped']
							}
						]
					},
					{
						model: USER,
						attributes: ['unique_id', 'firstname', 'middlename', 'lastname', 'username', 'email', 'profile_image'], 
						as: "Approver",
						include: [
							{
								model: ROLE,
								attributes: ['unique_id', 'name', 'stripped']
							}
						]
					},
					{
						model: VENDOR,
						attributes: ['unique_id', 'reference', 'type', 'name', 'contact_person', 'email', 'phone_number', 'alt_phone_number', 'total_spend', 'profile_image']
					}, 
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
				return SuccessResponse(res, { unique_id: anonymous, text: "Purchase Orders Not found" }, []);
			} else {
				// return SuccessResponse(res, { unique_id: anonymous, text: "Purchase Orders loaded" }, { ...response, pages: pagination.pages });
				return SuccessResponse(res, { unique_id: anonymous, text: "Purchase Orders loaded" }, { ...response });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async publicGetPurchaseOrder(req: IGetAuthTypesRequest, res: Response) {
		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: anonymous, text: "Validation Error Occured" }, errors.array())
		}

		try {
			const response = await PURCHASE_ORDER.findOne({
				attributes: { exclude: ['id', 'status'] },
				where: { ...payload }, 
				include: [
					{
						model: USER,
						attributes: ['unique_id', 'firstname', 'middlename', 'lastname', 'username', 'email', 'profile_image'], 
						as: "Creator",
						include: [
							{
								model: ROLE,
								attributes: ['unique_id', 'name', 'stripped']
							}
						]
					},
					{
						model: USER,
						attributes: ['unique_id', 'firstname', 'middlename', 'lastname', 'username', 'email', 'profile_image'], 
						as: "Approver",
						include: [
							{
								model: ROLE,
								attributes: ['unique_id', 'name', 'stripped']
							}
						]
					},
					{
						model: VENDOR,
						attributes: ['unique_id', 'reference', 'type', 'name', 'contact_person', 'email', 'phone_number', 'alt_phone_number', 'total_spend', 'profile_image']
					}, 
					{
						model: RAW_MATERIAL,
						attributes: ['unique_id', 'reference', 'name', 'type', 'unit_of_measure', 'current_quantity', 'reorder_level'], 
					}, 
				],
			});

			if (!response) {
				return SuccessResponse(res, { unique_id: anonymous, text: "Purchase Order Not found" }, null);
			} else {
				return SuccessResponse(res, { unique_id: anonymous, text: "Purchase Order loaded" }, response);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async publicSearchPurchaseOrders(req: IGetAuthTypesRequest, res: Response) {
		const queryParams: IPagination = req.query;

		const total_records = await PURCHASE_ORDER.count({
			where: {
				[Op.or]: [
					{
						reference: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					}
				]
			}
		});
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await PURCHASE_ORDER.findAndCountAll({
				attributes: { exclude: ['id', 'status'] },
				where: {
					[Op.or]: [
						{
							reference: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
						}
					]
				}, 
				include: [
					{
						model: USER,
						attributes: ['unique_id', 'firstname', 'middlename', 'lastname', 'username', 'email', 'profile_image'], 
						as: "Creator",
						include: [
							{
								model: ROLE,
								attributes: ['unique_id', 'name', 'stripped']
							}
						]
					},
					{
						model: USER,
						attributes: ['unique_id', 'firstname', 'middlename', 'lastname', 'username', 'email', 'profile_image'], 
						as: "Approver",
						include: [
							{
								model: ROLE,
								attributes: ['unique_id', 'name', 'stripped']
							}
						]
					},
					{
						model: VENDOR,
						attributes: ['unique_id', 'reference', 'type', 'name', 'contact_person', 'email', 'phone_number', 'alt_phone_number', 'total_spend', 'profile_image']
					}, 
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
				return SuccessResponse(res, { unique_id: anonymous, text: "Purchase Orders Not found" }, []);
			} else {
				// return SuccessResponse(res, { unique_id: anonymous, text: "Purchase Orders loaded" }, { ...response, pages: pagination.pages });
				return SuccessResponse(res, { unique_id: anonymous, text: "Purchase Orders loaded" }, { ...response });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async addPurchaseOrder(req: IGetAuthTypesRequest, res: Response) {
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
			const purchase_order_unique_id = uuidv4();
			const reference = random_uuid(4);

			await PURCHASE_ORDER.sequelize?.transaction(async (transaction) => {
				const purchaseOrderResponse = await PURCHASE_ORDER.create({
					unique_id: purchase_order_unique_id,
					vendor_unique_id: payload.vendor_unique_id,
					raw_material_unique_id: payload.raw_material_unique_id ? payload.raw_material_unique_id : null,
					reference, 
					po_type: payload.po_type,
					total_amount: parseInt(payload.total_amount),
					amount_paid: zero,
					balance_due: parseInt(payload.total_amount),
					quantity: payload.quantity ? parseInt(payload.quantity) : null,
					order_date: payload.order_date,
					expected_delivery_date: payload.expected_delivery_date ? payload.expected_delivery_date : null,
					notes: payload.notes ? payload.notes : null,
					payment_status: po_payment_status.unpaid,
					delivery_status: po_delivery_status.pending,
					order_status: pending,
					created_by: user_unique_id,
					approved_by: null,
					status: default_status
				}, { transaction });

				addLog("Purchase Orders", user_unique_id, "Added Purchase Order", payload);
				if (purchaseOrderResponse) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Purchase Order created successfully!" }, { unique_id: purchase_order_unique_id, reference });
				} else {
					throw new Error("Error adding purchase order");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async updatePurchaseOrderPOType(req: IGetAuthTypesRequest, res: Response) {
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
		
		if (!acl_details.edit) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized access to edit record content" }, null);
		}

		try {
			const purchase_order_details = await PURCHASE_ORDER.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!purchase_order_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Purchase Order Not found" }, null);
			}

			if (purchase_order_details.payment_status !== po_payment_status.unpaid) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Invalid Unpaid Purchase Order" }, null);
			}

			if (purchase_order_details.delivery_status !== po_delivery_status.pending) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Invalid Pending Purchase Order" }, null);
			}

			await PURCHASE_ORDER.sequelize?.transaction(async (transaction) => {
				const response = await PURCHASE_ORDER.update(
					{
						po_type: payload.po_type,
					}, {
						where: {
							unique_id: payload.unique_id,
							status: default_status
						},
						transaction
					}
				);

				addLog("Purchase Orders", user_unique_id, "Updated Purchase Order PO Type", payload);
				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
				} else {
					throw new Error("Purchase Order not found");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async updatePurchaseOrderDates(req: IGetAuthTypesRequest, res: Response) {
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
		
		if (!acl_details.edit) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized access to edit record content" }, null);
		}

		try {
			const purchase_order_details = await PURCHASE_ORDER.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!purchase_order_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Purchase Order Not found" }, null);
			}

			if (purchase_order_details.delivery_status === po_delivery_status.delivered) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Purchase Order already delivered" }, null);
			}

			if (purchase_order_details.order_status === completed) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Purchase Order already completed" }, null);
			}

			await PURCHASE_ORDER.sequelize?.transaction(async (transaction) => {
				const response = await PURCHASE_ORDER.update(
					{
						order_date: payload.order_date,
						expected_delivery_date: payload.expected_delivery_date ? payload.expected_delivery_date : null,
					}, {
						where: {
							unique_id: payload.unique_id,
							status: default_status
						},
						transaction
					}
				);

				addLog("Purchase Orders", user_unique_id, "Updated Purchase Order Dates", payload);
				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
				} else {
					throw new Error("Purchase Order not found");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async updatePurchaseOrderTotalAmount(req: IGetAuthTypesRequest, res: Response) {
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
		
		if (!acl_details.edit) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized access to edit record content" }, null);
		}

		try {
			const purchase_order_details = await PURCHASE_ORDER.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!purchase_order_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Purchase Order Not found" }, null);
			}

			if (purchase_order_details.payment_status !== po_payment_status.unpaid) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Invalid Unpaid Purchase Order" }, null);
			}

			if (purchase_order_details.delivery_status !== po_delivery_status.pending) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Invalid Pending Purchase Order" }, null);
			}

			await PURCHASE_ORDER.sequelize?.transaction(async (transaction) => {
				const response = await PURCHASE_ORDER.update(
					{
						total_amount: parseInt(payload.total_amount),
						amount_paid: zero,
						balance_due: parseInt(payload.total_amount),
					}, {
						where: {
							unique_id: payload.unique_id,
							status: default_status
						},
						transaction
					}
				);

				addLog("Purchase Orders", user_unique_id, "Updated Purchase Order Total Amount", payload);
				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
				} else {
					throw new Error("Purchase Order not found");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async updatePurchaseOrderRawMaterial(req: IGetAuthTypesRequest, res: Response) {
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
		
		if (!acl_details.edit) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized access to edit record content" }, null);
		}

		try {
			const purchase_order_details = await PURCHASE_ORDER.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!purchase_order_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Purchase Order Not found" }, null);
			}

			if (purchase_order_details.delivery_status === po_delivery_status.delivered) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Purchase Order already delivered" }, null);
			}

			if (purchase_order_details.order_status === completed) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Purchase Order already completed" }, null);
			}

			await PURCHASE_ORDER.sequelize?.transaction(async (transaction) => {
				const response = await PURCHASE_ORDER.update(
					{
						raw_material_unique_id: payload.raw_material_unique_id ? payload.raw_material_unique_id : null,
						quantity: payload.quantity ? parseInt(payload.quantity) : null,
					}, {
						where: {
							unique_id: payload.unique_id,
							status: default_status
						},
						transaction
					}
				);

				addLog("Purchase Orders", user_unique_id, "Updated Purchase Order Raw Material", payload);
				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
				} else {
					throw new Error("Purchase Order not found");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async updatePurchaseOrderNotes(req: IGetAuthTypesRequest, res: Response) {
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
		
		if (!acl_details.edit) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized access to edit record content" }, null);
		}

		try {
			const purchase_order_details = await PURCHASE_ORDER.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!purchase_order_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Purchase Order Not found" }, null);
			}

			await PURCHASE_ORDER.sequelize?.transaction(async (transaction) => {
				const response = await PURCHASE_ORDER.update(
					{
						notes: payload.notes ? payload.notes : null,
					}, {
						where: {
							unique_id: payload.unique_id,
							status: default_status
						},
						transaction
					}
				);

				addLog("Purchase Orders", user_unique_id, "Updated Purchase Order Notes", payload);
				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
				} else {
					throw new Error("Purchase Order not found");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async updatePurchaseOrderDeliveryStatus(req: IGetAuthTypesRequest, res: Response) {
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
		
		if (!acl_details.edit) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized access to edit record content" }, null);
		}

		try {
			const purchase_order_details = await PURCHASE_ORDER.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!purchase_order_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Purchase Order Not found" }, null);
			}

			if (purchase_order_details.payment_status === po_payment_status.unpaid) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Purchase Order is unpaid" }, null);
			}

			if (purchase_order_details.delivery_status === po_delivery_status.delivered) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Purchase Order already delivered" }, null);
			}

			const raw_material_details = await RAW_MATERIAL.findOne({
				attributes: { exclude: ['id'] },
				where: {
					unique_id: purchase_order_details.raw_material_unique_id,
				}
			});

			if (!raw_material_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Purchase Order - Raw Material not found" }, null);
			}

			const new_raw_material_current_quantity = raw_material_details.current_quantity && purchase_order_details.quantity && raw_material_details.current_quantity > 0 && purchase_order_details.quantity > 0 ? raw_material_details.current_quantity + purchase_order_details.quantity : raw_material_details.current_quantity;

			if (payload.delivery_status === po_delivery_status.delivered) {
				await PURCHASE_ORDER.sequelize?.transaction(async (transaction) => {
					const response = await PURCHASE_ORDER.update( { delivery_status: payload.delivery_status, }, { where: { unique_id: payload.unique_id, status: default_status }, transaction } );
					const responseRawMaterial = await RAW_MATERIAL.update( { current_quantity: new_raw_material_current_quantity }, { where: { unique_id: raw_material_details.unique_id, status: default_status }, transaction } );
					const responseRawMaterialStockLog = await RAW_MATERIAL_STOCK_LOG.create({
						unique_id: uuidv4(),
						raw_material_unique_id: raw_material_details.unique_id,
						movement_type: stock_log_movement_type.in,
						quantity: purchase_order_details.quantity,
						unit_cost: null,
						quantity_after: new_raw_material_current_quantity,
						source_module: "Procurement - Purchase Orders",
						reference: purchase_order_details.reference,
						created_by: user_unique_id,
						status: default_status
					}, { transaction });
	
					addLog("Purchase Orders", user_unique_id, "Updated Purchase Order Delivery Status", payload);
					if (response[0] > 0 && responseRawMaterial[0] > 0 && responseRawMaterialStockLog) {
						return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
					} else {
						throw new Error("Purchase Order not found");
					}
				});
			} else {
				await PURCHASE_ORDER.sequelize?.transaction(async (transaction) => {
					const response = await PURCHASE_ORDER.update(
						{
							delivery_status: payload.delivery_status,
						}, {
							where: {
								unique_id: payload.unique_id,
								status: default_status
							},
							transaction
						}
					);

					addLog("Purchase Orders", user_unique_id, "Updated Purchase Order Delivery Status", payload);
					if (response[0] > 0) {
						return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
					} else {
						throw new Error("Purchase Order not found");
					}
				});
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async approvePurchaseOrder(req: IGetAuthTypesRequest, res: Response) {
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
		
		if (!acl_details.edit) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized access to edit record content" }, null);
		}

		if (!acl_details.elevated_role) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized elevated access to edit record content" }, null);
		}

		try {
			const purchase_order_details = await PURCHASE_ORDER.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!purchase_order_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Purchase Order Not found" }, null);
			}

			if (purchase_order_details && purchase_order_details.order_status !== pending) {
				return BadRequestError(res, { unique_id: user_unique_id, text: `Invalid Pending Purchase Order, current status - ${purchase_order_details.order_status}` }, null);
			}

			if (purchase_order_details.approved_by !== null) {
				return BadRequestError(res, { unique_id: user_unique_id, text: `Purchase Order approved already` }, null);
			}

			await PURCHASE_ORDER.sequelize?.transaction(async (transaction) => {
				const response = await PURCHASE_ORDER.update(
					{
						order_status: approved,
						approved_by: user_unique_id,
					}, {
						where: {
							unique_id: payload.unique_id,
							status: default_status
						},
						transaction
					}
				);

				addLog("Purchase Orders", user_unique_id, "Approved Purchase Order", payload);
				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
				} else {
					throw new Error("Purchase Order not found");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async completePurchaseOrder(req: IGetAuthTypesRequest, res: Response) {
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
		
		if (!acl_details.edit) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized access to edit record content" }, null);
		}

		if (!acl_details.elevated_role) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized elevated access to edit record content" }, null);
		}

		try {
			const purchase_order_details = await PURCHASE_ORDER.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!purchase_order_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Purchase Order Not found" }, null);
			}

			if (purchase_order_details && purchase_order_details.order_status !== processing) {
				return BadRequestError(res, { unique_id: user_unique_id, text: `Invalid Processing Purchase Order, current status - ${purchase_order_details.order_status}` }, null);
			}
			
			if (purchase_order_details.delivery_status !== po_delivery_status.delivered) {
				return BadRequestError(res, { unique_id: user_unique_id, text: `Purchase Order not delivered completely` }, null);
			}
			
			if (purchase_order_details.payment_status !== po_payment_status.paid || (purchase_order_details.balance_due !== zero || purchase_order_details.total_amount !== purchase_order_details.amount_paid)) {
				return BadRequestError(res, { unique_id: user_unique_id, text: `Purchase Order not paid completely` }, null);
			}
			
			await PURCHASE_ORDER.sequelize?.transaction(async (transaction) => {
				const response = await PURCHASE_ORDER.update(
					{
						order_status: completed,
					}, {
						where: {
							unique_id: payload.unique_id,
							status: default_status
						},
						transaction
					}
				);

				addLog("Purchase Orders", user_unique_id, "Completed Purchase Order", payload);
				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
				} else {
					throw new Error("Purchase Order not found");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async deletePurchaseOrder(req: IGetAuthTypesRequest, res: Response) {
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
			const purchase_order_details = await PURCHASE_ORDER.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!purchase_order_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Purchase Order Not found" }, null);
			}

			if (purchase_order_details && purchase_order_details.order_status !== pending) {
				return BadRequestError(res, { unique_id: user_unique_id, text: `Unable to delete purchase order, current status - ${purchase_order_details.order_status}` }, null);
			}

			await PURCHASE_ORDER.sequelize?.transaction(async (transaction) => {
				const response = await PURCHASE_ORDER.destroy(
					{
						where: {
							unique_id: payload.unique_id,
							status: default_status
						},
						transaction
					}
				);

				addLog("Purchase Orders", user_unique_id, "Deleted Purchase Order", payload);
				if (response > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Purchase Order was deleted successfully!" }, null);
				} else {
					throw new Error("Error deleting record");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}
};
