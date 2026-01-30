import { Request, Response } from "express";
import { Op } from "sequelize";
import { validationResult, matchedData } from 'express-validator';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import PURCHASE_ORDER, { IPurchaseOrder } from "../models/purchaseOrders.model";
import RAW_MATERIAL, { IRawMaterial } from "../models/rawMaterials.model";
import RAW_MATERIAL_STOCK_LOG, { IRawMaterialStockLog } from "../models/rawMaterialStockLogs.model";
import VENDOR_PAYMENT, { IVendorPayment } from "../models/vendorPayments.model";
import VENDOR, { IVendor } from "../models/vendors.model";
import USER, { IUser } from "../models/users.model";
import ACL, { IACL } from "../models/acls.model";
import MODULE, { IModule } from "../models/modules.model";
import SUB_MODULE, { ISubModule } from "../models/subModules.model";
import ROLE, { IRole } from "../models/roles.model";
import { addLog } from "./logs.controller";
import { addExpense, deleteExpense } from "./expenses.controller";
import { IGetAuthTypesRequest } from "../middleware/checks";
import { ServerError, SuccessResponse, ValidationError, OtherSuccessResponse, NotFoundError, BadRequestError, logger, UnauthorizedError } from '../common/index';
import {
	IPagination, ISearch, default_status, paginate, return_all_letters_uppercase, anonymous, true_status, false_status, strip_text, timestamp_str_alt,
	dynamicWhere, zero, vendor_payment_method, processing, approved, po_payment_status, po_delivery_status,
	stock_log_movement_type, 
} from '../config/config';
import { deleteImage } from '../middleware/uploads';

dotenv.config();

const { clouder_key, cloudy_name, cloudy_key, cloudy_secret } = process.env;

export default class VendorPaymentController {
	async getVendorPayments(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await VENDOR_PAYMENT.count();
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await VENDOR_PAYMENT.findAndCountAll({
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
						as: "Facilitator",
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
						model: PURCHASE_ORDER,
						attributes: ['unique_id', 'reference', 'po_type', 'total_amount', 'amount_paid', 'balance_due', 'quantity', 'order_date', 'expected_delivery_date', 'payment_status', 'delivery_status', 'order_status'], 
					}
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Vendor Payments", user_unique_id, "Queried Vendor Payments", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Vendor Payments Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Vendor Payments loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getVendorPayment(req: IGetAuthTypesRequest, res: Response) {
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
			const response = await VENDOR_PAYMENT.findOne({
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
						as: "Facilitator",
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
						model: PURCHASE_ORDER,
						attributes: ['unique_id', 'reference', 'po_type', 'total_amount', 'amount_paid', 'balance_due', 'quantity', 'order_date', 'expected_delivery_date', 'payment_status', 'delivery_status', 'order_status'], 
					}
				], 
			});

			addLog("Vendor Payments", user_unique_id, "Queried Vendor Payment", queryParams);
			if (!response) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Vendor Payment Not found" }, null);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Vendor Payment loaded" }, response);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async searchVendorPayments(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await VENDOR_PAYMENT.count({
			where: {
				[Op.or]: [
					{
						notes: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					},
					{
						receipt_reference: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					}
				]
			}
		});
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await VENDOR_PAYMENT.findAndCountAll({
				attributes: { exclude: ['id'] },
				where: {
					[Op.or]: [
						{
							notes: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
						}, 
						{
							receipt_reference: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
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
						as: "Facilitator",
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
						model: PURCHASE_ORDER,
						attributes: ['unique_id', 'reference', 'po_type', 'total_amount', 'amount_paid', 'balance_due', 'quantity', 'order_date', 'expected_delivery_date', 'payment_status', 'delivery_status', 'order_status'], 
					}
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Vendor Payments", user_unique_id, "Searched Vendor Payments", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Vendor Payments Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Vendor Payments loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getVendorPaymentsSpecifically(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await VENDOR_PAYMENT.count({ where: dynamicWhere(queryParams) });
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await VENDOR_PAYMENT.findAndCountAll({
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
						as: "Facilitator",
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
						model: PURCHASE_ORDER,
						attributes: ['unique_id', 'reference', 'po_type', 'total_amount', 'amount_paid', 'balance_due', 'quantity', 'order_date', 'expected_delivery_date', 'payment_status', 'delivery_status', 'order_status'], 
					}
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Vendor Payments", user_unique_id, "Queried Vendor Payments specifically", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Vendor Payments Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Vendor Payments loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async filterVendorPaymentsSpecifically(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await VENDOR_PAYMENT.count({ 
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
			const response = await VENDOR_PAYMENT.findAndCountAll({
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
						as: "Facilitator",
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
						model: PURCHASE_ORDER,
						attributes: ['unique_id', 'reference', 'po_type', 'total_amount', 'amount_paid', 'balance_due', 'quantity', 'order_date', 'expected_delivery_date', 'payment_status', 'delivery_status', 'order_status'], 
					}
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Vendor Payments", user_unique_id, "Filtered Vendor Payments specifically", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Vendor Payments Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Vendor Payments loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async publicGetVendorPayments(req: IGetAuthTypesRequest, res: Response) {
		const queryParams: IPagination = req.query;

		const total_records = await VENDOR_PAYMENT.count({ where: { status: default_status } });
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await VENDOR_PAYMENT.findAndCountAll({
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
						as: "Facilitator",
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
						model: PURCHASE_ORDER,
						attributes: ['unique_id', 'reference', 'po_type', 'total_amount', 'amount_paid', 'balance_due', 'quantity', 'order_date', 'expected_delivery_date', 'payment_status', 'delivery_status', 'order_status'], 
					}
				], 
				order: [
					[orderBy, sortBy]
				],
				// offset: pagination.start,
				// limit: pagination.limit
			});

			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: anonymous, text: "Vendor Payments Not found" }, []);
			} else {
				// return SuccessResponse(res, { unique_id: anonymous, text: "Vendor Payments loaded" }, { ...response, pages: pagination.pages });
				return SuccessResponse(res, { unique_id: anonymous, text: "Vendor Payments loaded" }, { ...response });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async publicGetVendorPayment(req: IGetAuthTypesRequest, res: Response) {
		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: anonymous, text: "Validation Error Occured" }, errors.array())
		}

		try {
			const response = await VENDOR_PAYMENT.findOne({
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
						as: "Facilitator",
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
						model: PURCHASE_ORDER,
						attributes: ['unique_id', 'reference', 'po_type', 'total_amount', 'amount_paid', 'balance_due', 'quantity', 'order_date', 'expected_delivery_date', 'payment_status', 'delivery_status', 'order_status'], 
					}
				], 
			});

			if (!response) {
				return SuccessResponse(res, { unique_id: anonymous, text: "Vendor Payment Not found" }, null);
			} else {
				return SuccessResponse(res, { unique_id: anonymous, text: "Vendor Payment loaded" }, response);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async publicSearchVendorPayments(req: IGetAuthTypesRequest, res: Response) {
		const queryParams: IPagination = req.query;

		const total_records = await VENDOR_PAYMENT.count({
			where: {
				[Op.or]: [
					{
						notes: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					},
					{
						receipt_reference: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					}
				]
			}
		});
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await VENDOR_PAYMENT.findAndCountAll({
				attributes: { exclude: ['id', 'status'] },
				where: {
					[Op.or]: [
						{
							notes: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
						}, 
						{
							receipt_reference: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
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
						as: "Facilitator",
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
						model: PURCHASE_ORDER,
						attributes: ['unique_id', 'reference', 'po_type', 'total_amount', 'amount_paid', 'balance_due', 'quantity', 'order_date', 'expected_delivery_date', 'payment_status', 'delivery_status', 'order_status'], 
					}
				], 
				order: [
					[orderBy, sortBy]
				],
				// offset: pagination.start,
				// limit: pagination.limit
			});

			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: anonymous, text: "Vendor Payments Not found" }, []);
			} else {
				// return SuccessResponse(res, { unique_id: anonymous, text: "Vendor Payments loaded" }, { ...response, pages: pagination.pages });
				return SuccessResponse(res, { unique_id: anonymous, text: "Vendor Payments loaded" }, { ...response });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async addVendorPayment(req: IGetAuthTypesRequest, res: Response) {
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
			const vendor_details = await VENDOR.findOne({
				attributes: { exclude: ['id'] },
				where: {
					unique_id: payload.vendor_unique_id,
					status: default_status
				}
			});

			if (!vendor_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Vendor not found" }, null);
			}

			const vendor_payment_unique_id = uuidv4();
			const amount_paid = parseInt(payload.amount_paid);
			const new_vendor_total_spend = vendor_details.total_spend && vendor_details.total_spend >= 0 ? vendor_details.total_spend + amount_paid : amount_paid;

			if (payload.purchase_order_unique_id) {
				const purchase_order_details = await PURCHASE_ORDER.findOne({
					attributes: { exclude: ['id'] },
					where: {
						unique_id: payload.purchase_order_unique_id,
					}
				});
	
				if (!purchase_order_details) {
					return BadRequestError(res, { unique_id: user_unique_id, text: "Purchase order not found" }, null);
				}

				if (purchase_order_details.payment_status === po_payment_status.paid) {
					return BadRequestError(res, { unique_id: user_unique_id, text: `Unable to add payment, purchase order payment status - ${purchase_order_details.payment_status}` }, null);
				}

				const new_purchase_order_amount_paid = purchase_order_details.amount_paid && purchase_order_details.amount_paid >= 0 ? purchase_order_details.amount_paid + amount_paid : amount_paid;
				const new_purchase_order_balance_due = purchase_order_details.total_amount && purchase_order_details.total_amount >= 0 ? purchase_order_details.total_amount - new_purchase_order_amount_paid : purchase_order_details.balance_due;
				const new_purchase_order_payment_status = new_purchase_order_amount_paid === purchase_order_details.total_amount || new_purchase_order_balance_due === zero ? po_payment_status.paid : po_payment_status.partially_paid;

				// if (purchase_order_details.raw_material_unique_id) {
				// 	const raw_material_details = await RAW_MATERIAL.findOne({
				// 		attributes: { exclude: ['id'] },
				// 		where: {
				// 			unique_id: purchase_order_details.raw_material_unique_id,
				// 		}
				// 	});
		
				// 	if (!raw_material_details) {
				// 		return BadRequestError(res, { unique_id: user_unique_id, text: "Purchase Order - Raw Material not found" }, null);
				// 	}

				// 	const purchase_order_quantity = purchase_order_details.quantity ? purchase_order_details.quantity : 0;
				// 	const new_raw_material_current_quantity = raw_material_details.current_quantity && raw_material_details.current_quantity > 0 && purchase_order_quantity > 0 && (new_purchase_order_amount_paid === purchase_order_details.total_amount || new_purchase_order_balance_due === zero) ? raw_material_details.current_quantity + purchase_order_quantity : raw_material_details.current_quantity;
					
				// 	await VENDOR_PAYMENT.sequelize?.transaction(async (transaction) => {
				// 		const vendorPaymentResponse = await VENDOR_PAYMENT.create({
				// 			unique_id: vendor_payment_unique_id,
				// 			vendor_unique_id: vendor_details.unique_id,
				// 			purchase_order_unique_id: purchase_order_details.unique_id,
				// 			amount_paid: amount_paid,
				// 			payment_date: payload.payment_date,
				// 			payment_method: payload.payment_method,
				// 			receipt_reference: payload.receipt_reference ? payload.receipt_reference : null,
				// 			notes: payload.notes ? payload.notes : null,
				// 			receipt_image: payload.receipt_image ? payload.receipt_image : null,
				// 			receipt_image_public_id: payload.receipt_image_public_id ? payload.receipt_image_public_id : null,
				// 			created_by: user_unique_id,
				// 			facilitated_by: payload.facilitated_by ? payload.facilitated_by : user_unique_id,
				// 			status: default_status
				// 		}, { transaction });

				// 		const responseVendor = await VENDOR.update( { total_spend: new_vendor_total_spend }, { where: { unique_id: vendor_details.unique_id, status: default_status }, transaction } );
				// 		const responsePurchaseOrder = await PURCHASE_ORDER.update( { amount_paid: new_purchase_order_amount_paid, balance_due: new_purchase_order_balance_due, payment_status: new_purchase_order_payment_status, order_status: processing }, { where: { unique_id: purchase_order_details.unique_id, status: default_status }, transaction } );
				// 		const responseRawMaterial = await RAW_MATERIAL.update( { current_quantity: new_raw_material_current_quantity }, { where: { unique_id: raw_material_details.unique_id, status: default_status }, transaction } );
				// 		//  add raw material in stock log here
				// 		// if (raw_material_details.current_quantity && raw_material_details.current_quantity > 0 && purchase_order_quantity > 0 && (new_purchase_order_amount_paid === purchase_order_details.total_amount || new_purchase_order_balance_due === zero)) {

				// 		// }

				// 		addLog("Vendor Payments", user_unique_id, "Added Vendor Payment", payload);
				// 		if (vendorPaymentResponse && responsePurchaseOrder[0] > 0 && responseVendor[0] > 0 && responseRawMaterial[0] > 0) {
				// 			return SuccessResponse(res, { unique_id: user_unique_id, text: "Vendor Payment created successfully!" }, { unique_id: vendor_payment_unique_id });
				// 		} else {
				// 			throw new Error("Error adding vendor payment");
				// 		}
				// 	});
				// } else {
					await VENDOR_PAYMENT.sequelize?.transaction(async (transaction) => {
						const vendorPaymentResponse = await VENDOR_PAYMENT.create({
							unique_id: vendor_payment_unique_id,
							vendor_unique_id: vendor_details.unique_id,
							purchase_order_unique_id: purchase_order_details.unique_id,
							amount_paid: amount_paid,
							payment_date: payload.payment_date,
							payment_method: payload.payment_method,
							receipt_reference: payload.receipt_reference ? payload.receipt_reference : null,
							notes: payload.notes ? payload.notes : null,
							receipt_image: payload.receipt_image ? payload.receipt_image : null,
							receipt_image_public_id: payload.receipt_image_public_id ? payload.receipt_image_public_id : null,
							created_by: user_unique_id,
							facilitated_by: payload.facilitated_by ? payload.facilitated_by : user_unique_id,
							status: default_status
						}, { transaction });
	
						const responseVendor = await VENDOR.update( { total_spend: new_vendor_total_spend }, { where: { unique_id: vendor_details.unique_id, status: default_status }, transaction } );
						const responsePurchaseOrder = await PURCHASE_ORDER.update( { amount_paid: new_purchase_order_amount_paid, balance_due: new_purchase_order_balance_due, payment_status: new_purchase_order_payment_status, order_status: processing }, { where: { unique_id: purchase_order_details.unique_id, status: default_status }, transaction } );
						addExpense({
							amount: amount_paid,
							category: "Vendor Payments",
							created_by: user_unique_id || '',
							expense_date: payload.payment_date,
							purchase_order_unique_id: purchase_order_details.unique_id, 
							vendor_payment_unique_id: vendor_payment_unique_id,
							notes: payload.notes ? payload.notes : null,
							receipt_image: payload.receipt_image ? payload.receipt_image : null,
							receipt_image_public_id: payload.receipt_image_public_id ? payload.receipt_image_public_id : null,
						}, user_unique_id);

						addLog("Vendor Payments", user_unique_id, "Added Vendor Payment", payload);
						if (vendorPaymentResponse && responsePurchaseOrder[0] > 0 && responseVendor[0] > 0) {
							return SuccessResponse(res, { unique_id: user_unique_id, text: "Vendor Payment created successfully!" }, { unique_id: vendor_payment_unique_id });
						} else {
							throw new Error("Error adding vendor payment");
						}
					});
				// }
			} else {
				await VENDOR_PAYMENT.sequelize?.transaction(async (transaction) => {
					const vendorPaymentResponse = await VENDOR_PAYMENT.create({
						unique_id: vendor_payment_unique_id,
						vendor_unique_id: vendor_details.unique_id,
						purchase_order_unique_id: null,
						amount_paid: amount_paid,
						payment_date: payload.payment_date,
						payment_method: payload.payment_method,
						receipt_reference: payload.receipt_reference ? payload.receipt_reference : null,
						notes: payload.notes ? payload.notes : null,
						receipt_image: payload.receipt_image ? payload.receipt_image : null,
						receipt_image_public_id: payload.receipt_image_public_id ? payload.receipt_image_public_id : null,
						created_by: user_unique_id,
						facilitated_by: payload.facilitated_by ? payload.facilitated_by : user_unique_id,
						status: default_status
					}, { transaction });

					const responseVendor = await VENDOR.update( { total_spend: new_vendor_total_spend }, { where: { unique_id: vendor_details.unique_id, status: default_status }, transaction } );
					
					addLog("Vendor Payments", user_unique_id, "Added Vendor Payment", payload);
					if (vendorPaymentResponse && responseVendor[0] > 0) {
						return SuccessResponse(res, { unique_id: user_unique_id, text: "Vendor Payment created successfully!" }, { unique_id: vendor_payment_unique_id });
					} else {
						throw new Error("Error adding vendor payment");
					}
				});
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async updateVendorPaymentReceiptReference(req: IGetAuthTypesRequest, res: Response) {
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
			const vendor_payment_details = await VENDOR_PAYMENT.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!vendor_payment_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Vendor Payment Not found" }, null);
			}

			await VENDOR_PAYMENT.sequelize?.transaction(async (transaction) => {
				const response = await VENDOR_PAYMENT.update(
					{
						receipt_reference: payload.receipt_reference ? payload.receipt_reference : null,
					}, {
						where: {
							unique_id: payload.unique_id,
							status: default_status
						},
						transaction
					}
				);

				addLog("Vendor Payments", user_unique_id, "Updated Vendor Payment Receipt Reference", payload);
				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
				} else {
					throw new Error("Vendor Payment not found");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async updateVendorPaymentNotes(req: IGetAuthTypesRequest, res: Response) {
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
			const vendor_details = await VENDOR_PAYMENT.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!vendor_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Vendor Payment Not found" }, null);
			}

			await VENDOR_PAYMENT.sequelize?.transaction(async (transaction) => {
				const response = await VENDOR_PAYMENT.update(
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

				addLog("Vendor Payments", user_unique_id, "Updated Vendor Payment Notes", payload);
				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
				} else {
					throw new Error("Vendor Payment not found");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async updateVendorPaymentReceiptImage(req: IGetAuthTypesRequest, res: Response) {
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
			const vendor_payment_details = await VENDOR_PAYMENT.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!vendor_payment_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Vendor Payment Not found" }, null);
			}

			await VENDOR_PAYMENT.sequelize?.transaction(async (transaction) => {
				const response = await VENDOR_PAYMENT.update(
					{
						receipt_image: payload.receipt_image ? payload.receipt_image : null,
						receipt_image_public_id: payload.receipt_image_public_id ? payload.receipt_image_public_id : null,
					}, {
						where: {
							unique_id: payload.unique_id,
							status: default_status
						},
						transaction
					}
				);

				addLog("Vendor Payments", user_unique_id, "Updated Vendor Payment Receipt Image", payload);
				if (response[0] > 0) {
					SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
					
					// Delete former image available
					if (vendor_payment_details.receipt_image_public_id !== null) {
						await deleteImage(clouder_key || '', { cloudinary_name: cloudy_name, cloudinary_key: cloudy_key, cloudinary_secret: cloudy_secret, public_id: vendor_payment_details.receipt_image_public_id });
					}
				} else {
					throw new Error("Vendor Payment not found");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async deleteVendorPayment(req: IGetAuthTypesRequest, res: Response) {
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
			const vendor_payment_details = await VENDOR_PAYMENT.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!vendor_payment_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Vendor Payment Not found" }, null);
			}

			const vendor_details = await VENDOR.findOne({
				attributes: { exclude: ['id'] },
				where: {
					unique_id: vendor_payment_details.vendor_unique_id,
					status: default_status
				}
			});

			if (!vendor_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Vendor not found" }, null);
			}

			const amount_paid = vendor_payment_details.amount_paid || 0;
			const new_vendor_total_spend = vendor_details.total_spend && vendor_details.total_spend > 0 ? vendor_details.total_spend - amount_paid : vendor_details.total_spend;

			if (vendor_payment_details.purchase_order_unique_id) {
				const purchase_order_details = await PURCHASE_ORDER.findOne({
					attributes: { exclude: ['id'] },
					where: {
						unique_id: vendor_payment_details.purchase_order_unique_id,
					}
				});
	
				if (!purchase_order_details) {
					return BadRequestError(res, { unique_id: user_unique_id, text: "Purchase order not found" }, null);
				}

				if (purchase_order_details.delivery_status !== po_delivery_status.pending) {
					return BadRequestError(res, { unique_id: user_unique_id, text: `Unable to delete payment, Purchase delivery status - ${purchase_order_details.delivery_status}` }, null);
				}

				const new_purchase_order_amount_paid = purchase_order_details.amount_paid && purchase_order_details.amount_paid > 0 ? purchase_order_details.amount_paid - amount_paid : amount_paid;
				const new_purchase_order_balance_due = purchase_order_details.total_amount && purchase_order_details.total_amount > 0 ? purchase_order_details.total_amount - new_purchase_order_amount_paid : purchase_order_details.balance_due;
				const new_purchase_order_payment_status = new_purchase_order_amount_paid === purchase_order_details.total_amount || new_purchase_order_balance_due === zero ? po_payment_status.paid : (new_purchase_order_amount_paid === zero || new_purchase_order_balance_due === purchase_order_details.total_amount ? po_payment_status.unpaid : po_payment_status.partially_paid);

				if (purchase_order_details.raw_material_unique_id) {
					const raw_material_details = await RAW_MATERIAL.findOne({
						attributes: { exclude: ['id'] },
						where: {
							unique_id: purchase_order_details.raw_material_unique_id,
						}
					});
		
					if (!raw_material_details) {
						return BadRequestError(res, { unique_id: user_unique_id, text: "Purchase Order - Raw Material not found" }, null);
					}

					const purchase_order_quantity = purchase_order_details.quantity && purchase_order_details.quantity >= 0 ? purchase_order_details.quantity : 0;
					
					// const new_raw_material_current_quantity = raw_material_details.current_quantity && raw_material_details.current_quantity >= 0 && purchase_order_quantity > 0 ? raw_material_details.current_quantity - purchase_order_quantity : raw_material_details.current_quantity;
					
					await VENDOR_PAYMENT.sequelize?.transaction(async (transaction) => {
						const response = await VENDOR_PAYMENT.destroy(
							{
								where: {
									unique_id: payload.unique_id,
									status: default_status
								},
								transaction
							}
						);

						const responseVendor = await VENDOR.update( { total_spend: new_vendor_total_spend }, { where: { unique_id: vendor_details.unique_id, status: default_status }, transaction } );
						const responsePurchaseOrder = await PURCHASE_ORDER.update( { amount_paid: new_purchase_order_amount_paid, balance_due: new_purchase_order_balance_due, payment_status: new_purchase_order_payment_status, order_status: new_purchase_order_payment_status === po_payment_status.unpaid ? approved : processing }, { where: { unique_id: purchase_order_details.unique_id, status: default_status }, transaction } );
						// const responseRawMaterial = await RAW_MATERIAL.update( { quantity: new_raw_material_current_quantity }, { where: { unique_id: raw_material_details.unique_id, status: default_status }, transaction } );
						// const responseRawMaterialStockLog = await RAW_MATERIAL_STOCK_LOG.create({
						// 	unique_id: uuidv4(),
						// 	raw_material_unique_id: raw_material_details.unique_id,
						// 	movement_type: stock_log_movement_type.adjustment,
						// 	quantity: purchase_order_details.quantity,
						// 	unit_cost: null,
						// 	quantity_after: new_raw_material_current_quantity,
						// 	source_module: "Procurement - Purchase Orders",
						// 	reference: purchase_order_details.reference,
						// 	created_by: user_unique_id,
						// 	status: default_status
						// }, { transaction });

						deleteExpense({ vendor_payment_unique_id: payload.unique_id }, user_unique_id);
						addLog("Vendor Payments", user_unique_id, "Deleted Vendor Payment", payload);
						if (response > 0 && responsePurchaseOrder[0] > 0 && responseVendor[0] > 0 
							// && responseRawMaterial[0] > 0 && responseRawMaterialStockLog
						) {
							SuccessResponse(res, { unique_id: user_unique_id, text: "Vendor Payment was deleted successfully!" }, null);
						
							// Delete former image available
							if (vendor_payment_details.receipt_image_public_id !== null) {
								await deleteImage(clouder_key || '', { cloudinary_name: cloudy_name, cloudinary_key: cloudy_key, cloudinary_secret: cloudy_secret, public_id: vendor_payment_details.receipt_image_public_id });
							}
						} else {
							throw new Error("Error deleting record");
						}
					});
				} else {
					await VENDOR_PAYMENT.sequelize?.transaction(async (transaction) => {
						const response = await VENDOR_PAYMENT.destroy(
							{
								where: {
									unique_id: payload.unique_id,
									status: default_status
								},
								transaction
							}
						);

						const responseVendor = await VENDOR.update( { total_spend: new_vendor_total_spend }, { where: { unique_id: vendor_details.unique_id, status: default_status }, transaction } );
						const responsePurchaseOrder = await PURCHASE_ORDER.update( { amount_paid: new_purchase_order_amount_paid, balance_due: new_purchase_order_balance_due, payment_status: new_purchase_order_payment_status, order_status: new_purchase_order_payment_status === po_payment_status.unpaid ? approved : processing }, { where: { unique_id: purchase_order_details.unique_id, status: default_status }, transaction } );
						deleteExpense({ vendor_payment_unique_id: payload.unique_id }, user_unique_id);
						addLog("Vendor Payments", user_unique_id, "Deleted Vendor Payment", payload);
						if (response > 0 && responsePurchaseOrder[0] > 0 && responseVendor[0] > 0) {
							SuccessResponse(res, { unique_id: user_unique_id, text: "Vendor Payment was deleted successfully!" }, null);
						
							// Delete former image available
							if (vendor_payment_details.receipt_image_public_id !== null) {
								await deleteImage(clouder_key || '', { cloudinary_name: cloudy_name, cloudinary_key: cloudy_key, cloudinary_secret: cloudy_secret, public_id: vendor_payment_details.receipt_image_public_id });
							}
						} else {
							throw new Error("Error deleting record");
						}
					});
				}
			} else {
				await VENDOR_PAYMENT.sequelize?.transaction(async (transaction) => {
					const response = await VENDOR_PAYMENT.destroy(
						{
							where: {
								unique_id: payload.unique_id,
								status: default_status
							},
							transaction
						}
					);

					const responseVendor = await VENDOR.update( { total_spend: new_vendor_total_spend }, { where: { unique_id: vendor_details.unique_id, status: default_status }, transaction } );
					
					addLog("Vendor Payments", user_unique_id, "Deleted Vendor Payment", payload);
					if (response > 0 && responseVendor[0] > 0) {
						SuccessResponse(res, { unique_id: user_unique_id, text: "Vendor Payment was deleted successfully!" }, null);
					
						// Delete former image available
						if (vendor_payment_details.receipt_image_public_id !== null) {
							await deleteImage(clouder_key || '', { cloudinary_name: cloudy_name, cloudinary_key: cloudy_key, cloudinary_secret: cloudy_secret, public_id: vendor_payment_details.receipt_image_public_id });
						}
					} else {
						throw new Error("Error deleting record");
					}
				});
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}
};
