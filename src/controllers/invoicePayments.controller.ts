import { Request, Response } from "express";
import { Op } from "sequelize";
import { validationResult, matchedData } from 'express-validator';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import SALES_ORDER, { ISalesOrder } from "../models/salesOrders.model";
import INVOICE, { IInvoice } from "../models/invoices.model";
import INVOICE_PAYMENT, { IInvoicePayment } from "../models/invoicePayments.model";
import CUSTOMER, { ICustomer } from "../models/customers.model";
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
	dynamicWhere, zero, invoice_status, invoice_payment_method, processing, approved, 
} from '../config/config';
import { deleteImage } from '../middleware/uploads';

dotenv.config();

const { clouder_key, cloudy_name, cloudy_key, cloudy_secret } = process.env;

export default class InvoicePaymentController {
	async getInvoicePayments(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await INVOICE_PAYMENT.count();
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await INVOICE_PAYMENT.findAndCountAll({
				attributes: { exclude: ['id'] },
				include: [
					{
						model: USER,
						attributes: ['unique_id', 'firstname', 'middlename', 'lastname', 'username', 'email', 'profile_image'], 
						include: [
							{
								model: ROLE,
								attributes: ['unique_id', 'name', 'stripped']
							}
						]
					},
					{
						model: CUSTOMER,
						attributes: ['unique_id', 'reference', 'type', 'name', 'email', 'phone_number', 'alt_phone_number', 'balance', 'profile_image']
					}, 
					{
						model: INVOICE,
						attributes: ['unique_id', 'invoice_date', 'due_date', 'invoice_type', 'subtotal_amount', 'discount_amount', 'outside_town_surcharge', 'total_amount', 'amount_paid', 'balance_due', 'invoice_status'], 
					}
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Invoice Payments", user_unique_id, "Queried Invoice Payments", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Invoice Payments Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Invoice Payments loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getInvoicePayment(req: IGetAuthTypesRequest, res: Response) {
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
			const response = await INVOICE_PAYMENT.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }, 
				include: [
					{
						model: USER,
						attributes: ['unique_id', 'firstname', 'middlename', 'lastname', 'username', 'email', 'profile_image'], 
						include: [
							{
								model: ROLE,
								attributes: ['unique_id', 'name', 'stripped']
							}
						]
					},
					{
						model: CUSTOMER,
						attributes: ['unique_id', 'reference', 'type', 'name', 'email', 'phone_number', 'alt_phone_number', 'balance', 'profile_image']
					}, 
					{
						model: INVOICE,
						attributes: ['unique_id', 'invoice_date', 'due_date', 'invoice_type', 'subtotal_amount', 'discount_amount', 'outside_town_surcharge', 'total_amount', 'amount_paid', 'balance_due', 'invoice_status'], 
					}
				], 
			});

			addLog("Invoice Payments", user_unique_id, "Queried Invoice Payment", queryParams);
			if (!response) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Invoice Payment Not found" }, null);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Invoice Payment loaded" }, response);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async searchInvoicePayments(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await INVOICE_PAYMENT.count({
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
			const response = await INVOICE_PAYMENT.findAndCountAll({
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
						include: [
							{
								model: ROLE,
								attributes: ['unique_id', 'name', 'stripped']
							}
						]
					},
					{
						model: CUSTOMER,
						attributes: ['unique_id', 'reference', 'type', 'name', 'email', 'phone_number', 'alt_phone_number', 'balance', 'profile_image']
					}, 
					{
						model: INVOICE,
						attributes: ['unique_id', 'invoice_date', 'due_date', 'invoice_type', 'subtotal_amount', 'discount_amount', 'outside_town_surcharge', 'total_amount', 'amount_paid', 'balance_due', 'invoice_status'], 
					}
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Invoice Payments", user_unique_id, "Searched Invoice Payments", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Invoice Payments Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Invoice Payments loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getInvoicePaymentsSpecifically(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await INVOICE_PAYMENT.count({ where: dynamicWhere(queryParams) });
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await INVOICE_PAYMENT.findAndCountAll({
				attributes: { exclude: ['id'] },
				where: dynamicWhere(queryParams),
				include: [
					{
						model: USER,
						attributes: ['unique_id', 'firstname', 'middlename', 'lastname', 'username', 'email', 'profile_image'], 
						include: [
							{
								model: ROLE,
								attributes: ['unique_id', 'name', 'stripped']
							}
						]
					},
					{
						model: CUSTOMER,
						attributes: ['unique_id', 'reference', 'type', 'name', 'email', 'phone_number', 'alt_phone_number', 'balance', 'profile_image']
					}, 
					{
						model: INVOICE,
						attributes: ['unique_id', 'invoice_date', 'due_date', 'invoice_type', 'subtotal_amount', 'discount_amount', 'outside_town_surcharge', 'total_amount', 'amount_paid', 'balance_due', 'invoice_status'], 
					}
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Invoice Payments", user_unique_id, "Queried Invoice Payments specifically", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Invoice Payments Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Invoice Payments loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async filterInvoicePaymentsSpecifically(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await INVOICE_PAYMENT.count({ 
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
			const response = await INVOICE_PAYMENT.findAndCountAll({
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
						include: [
							{
								model: ROLE,
								attributes: ['unique_id', 'name', 'stripped']
							}
						]
					},
					{
						model: CUSTOMER,
						attributes: ['unique_id', 'reference', 'type', 'name', 'email', 'phone_number', 'alt_phone_number', 'balance', 'profile_image']
					}, 
					{
						model: INVOICE,
						attributes: ['unique_id', 'invoice_date', 'due_date', 'invoice_type', 'subtotal_amount', 'discount_amount', 'outside_town_surcharge', 'total_amount', 'amount_paid', 'balance_due', 'invoice_status'], 
					}
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Invoice Payments", user_unique_id, "Filtered Invoice Payments specifically", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Invoice Payments Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Invoice Payments loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async publicGetInvoicePayments(req: IGetAuthTypesRequest, res: Response) {
		const queryParams: IPagination = req.query;

		const total_records = await INVOICE_PAYMENT.count({ where: { status: default_status } });
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await INVOICE_PAYMENT.findAndCountAll({
				attributes: { exclude: ['id', 'status'] },
				where: { status: default_status },
				include: [
					{
						model: USER,
						attributes: ['unique_id', 'firstname', 'middlename', 'lastname', 'username', 'email', 'profile_image'], 
						include: [
							{
								model: ROLE,
								attributes: ['unique_id', 'name', 'stripped']
							}
						]
					},
					{
						model: CUSTOMER,
						attributes: ['unique_id', 'reference', 'type', 'name', 'email', 'phone_number', 'alt_phone_number', 'balance', 'profile_image']
					}, 
					{
						model: INVOICE,
						attributes: ['unique_id', 'invoice_date', 'due_date', 'invoice_type', 'subtotal_amount', 'discount_amount', 'outside_town_surcharge', 'total_amount', 'amount_paid', 'balance_due', 'invoice_status'], 
					}
				], 
				order: [
					[orderBy, sortBy]
				],
				// offset: pagination.start,
				// limit: pagination.limit
			});

			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: anonymous, text: "Invoice Payments Not found" }, []);
			} else {
				// return SuccessResponse(res, { unique_id: anonymous, text: "Invoice Payments loaded" }, { ...response, pages: pagination.pages });
				return SuccessResponse(res, { unique_id: anonymous, text: "Invoice Payments loaded" }, { ...response });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async publicGetInvoicePayment(req: IGetAuthTypesRequest, res: Response) {
		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: anonymous, text: "Validation Error Occured" }, errors.array())
		}

		try {
			const response = await INVOICE_PAYMENT.findOne({
				attributes: { exclude: ['id', 'status'] },
				where: { ...payload }, 
				include: [
					{
						model: USER,
						attributes: ['unique_id', 'firstname', 'middlename', 'lastname', 'username', 'email', 'profile_image'], 
						include: [
							{
								model: ROLE,
								attributes: ['unique_id', 'name', 'stripped']
							}
						]
					},
					{
						model: CUSTOMER,
						attributes: ['unique_id', 'reference', 'type', 'name', 'email', 'phone_number', 'alt_phone_number', 'balance', 'profile_image']
					}, 
					{
						model: INVOICE,
						attributes: ['unique_id', 'invoice_date', 'due_date', 'invoice_type', 'subtotal_amount', 'discount_amount', 'outside_town_surcharge', 'total_amount', 'amount_paid', 'balance_due', 'invoice_status'], 
					}
				], 
			});

			if (!response) {
				return SuccessResponse(res, { unique_id: anonymous, text: "Invoice Payment Not found" }, null);
			} else {
				return SuccessResponse(res, { unique_id: anonymous, text: "Invoice Payment loaded" }, response);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async publicSearchInvoicePayments(req: IGetAuthTypesRequest, res: Response) {
		const queryParams: IPagination = req.query;

		const total_records = await INVOICE_PAYMENT.count({
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
			const response = await INVOICE_PAYMENT.findAndCountAll({
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
						include: [
							{
								model: ROLE,
								attributes: ['unique_id', 'name', 'stripped']
							}
						]
					},
					{
						model: CUSTOMER,
						attributes: ['unique_id', 'reference', 'type', 'name', 'email', 'phone_number', 'alt_phone_number', 'balance', 'profile_image']
					}, 
					{
						model: INVOICE,
						attributes: ['unique_id', 'invoice_date', 'due_date', 'invoice_type', 'subtotal_amount', 'discount_amount', 'outside_town_surcharge', 'total_amount', 'amount_paid', 'balance_due', 'invoice_status'], 
					}
				], 
				order: [
					[orderBy, sortBy]
				],
				// offset: pagination.start,
				// limit: pagination.limit
			});

			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: anonymous, text: "Invoice Payments Not found" }, []);
			} else {
				// return SuccessResponse(res, { unique_id: anonymous, text: "Invoice Payments loaded" }, { ...response, pages: pagination.pages });
				return SuccessResponse(res, { unique_id: anonymous, text: "Invoice Payments loaded" }, { ...response });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async addInvoicePayment(req: IGetAuthTypesRequest, res: Response) {
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
			
			const invoice_details = await INVOICE.findOne({
				attributes: { exclude: ['id'] },
				where: {
					unique_id: payload.invoice_unique_id,
					status: default_status
				}
			});

			if (!invoice_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Invoice not found" }, null);
			}

			const sales_order_details = await SALES_ORDER.findOne({
				attributes: { exclude: ['id'] },
				where: {
					unique_id: invoice_details.sales_order_unique_id,
				}
			});

			if (!sales_order_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Sales order not found" }, null);
			}

			const customer_details = await CUSTOMER.findOne({
				attributes: { exclude: ['id'] },
				where: {
					unique_id: invoice_details.customer_unique_id,
				}
			});

			if (!customer_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Customer not found" }, null);
			}

			if (invoice_details.invoice_status === invoice_status.paid || invoice_details.invoice_status === invoice_status.cancelled) {
				return BadRequestError(res, { unique_id: user_unique_id, text: `Unable to add payment, invoice status - ${invoice_details.invoice_status}` }, null);
			}

			const amount_paid = parseInt(payload.amount_paid);

			if (payload.payment_method === invoice_payment_method.account_balance) {
				if (customer_details.balance && customer_details.balance > amount_paid) {
					const new_customer_balance = customer_details.balance - amount_paid;

					const invoice_payment_unique_id = uuidv4();
					const new_invoice_amount_paid = invoice_details.amount_paid && invoice_details.amount_paid >= 0 ? invoice_details.amount_paid + amount_paid : amount_paid;
					const new_invoice_balance_due = invoice_details.total_amount && invoice_details.total_amount > 0 ? invoice_details.total_amount - new_invoice_amount_paid : invoice_details.balance_due;
					const new_invoice_status = new_invoice_amount_paid === invoice_details.total_amount || new_invoice_balance_due === zero ? invoice_status.paid : invoice_status.partially_paid;

					await INVOICE_PAYMENT.sequelize?.transaction(async (transaction) => {
						const invoicePaymentResponse = await INVOICE_PAYMENT.create({
							unique_id: invoice_payment_unique_id,
							invoice_unique_id: invoice_details.unique_id,
							customer_unique_id: invoice_details.customer_unique_id,
							payment_date: payload.payment_date,
							payment_method: payload.payment_method,
							amount_paid: amount_paid,
							receipt_reference: payload.receipt_reference ? payload.receipt_reference : null,
							notes: payload.notes ? payload.notes : null,
							receipt_image: payload.receipt_image ? payload.receipt_image : null,
							receipt_image_public_id: payload.receipt_image_public_id ? payload.receipt_image_public_id : null,
							received_by: payload.received_by ? payload.received_by : user_unique_id,
							status: default_status
						}, { transaction });

						const responseInvoice = await INVOICE.update( { amount_paid: new_invoice_amount_paid, balance_due: new_invoice_balance_due, invoice_status: new_invoice_status, }, { where: { unique_id: invoice_details.unique_id, status: default_status }, transaction } );
						const responseSalesOrder = await SALES_ORDER.update( { order_status: processing }, { where: { unique_id: sales_order_details.unique_id, status: default_status }, transaction } );
						const responseCustomer = await CUSTOMER.update( { balance: new_customer_balance }, { where: { unique_id: customer_details.unique_id, status: default_status }, transaction } );

						addLog("Invoice Payments", user_unique_id, "Added Invoice Payment", payload);
						if (invoicePaymentResponse && responseSalesOrder[0] > 0 && responseInvoice[0] > 0 && responseCustomer[0] > 0) {
							return SuccessResponse(res, { unique_id: user_unique_id, text: "Invoice Payment created successfully!" }, { unique_id: invoice_payment_unique_id });
						} else {
							throw new Error("Error adding invoice payment");
						}
					});
				} else {
					return BadRequestError(res, { unique_id: user_unique_id, text: "Insufficient customer balance" }, null);
				}
			} else {
				const invoice_payment_unique_id = uuidv4();
				const new_invoice_amount_paid = invoice_details.amount_paid && invoice_details.amount_paid >= 0 ? invoice_details.amount_paid + amount_paid : amount_paid;
				const new_invoice_balance_due = invoice_details.total_amount && invoice_details.total_amount > 0 ? invoice_details.total_amount - new_invoice_amount_paid : invoice_details.balance_due;
				const new_invoice_status = new_invoice_amount_paid === invoice_details.total_amount || new_invoice_balance_due === zero ? invoice_status.paid : invoice_status.partially_paid;
	
				await INVOICE_PAYMENT.sequelize?.transaction(async (transaction) => {
					const invoicePaymentResponse = await INVOICE_PAYMENT.create({
						unique_id: invoice_payment_unique_id,
						invoice_unique_id: invoice_details.unique_id,
						customer_unique_id: invoice_details.customer_unique_id,
						payment_date: payload.payment_date,
						payment_method: payload.payment_method,
						amount_paid: amount_paid,
						receipt_reference: payload.receipt_reference ? payload.receipt_reference : null,
						notes: payload.notes ? payload.notes : null,
						receipt_image: payload.receipt_image ? payload.receipt_image : null,
						receipt_image_public_id: payload.receipt_image_public_id ? payload.receipt_image_public_id : null,
						received_by: payload.received_by ? payload.received_by : user_unique_id,
						status: default_status
					}, { transaction });
	
					const responseInvoice = await INVOICE.update( { amount_paid: new_invoice_amount_paid, balance_due: new_invoice_balance_due, invoice_status: new_invoice_status, }, { where: { unique_id: invoice_details.unique_id, status: default_status }, transaction } );
					const responseSalesOrder = await SALES_ORDER.update( { order_status: processing }, { where: { unique_id: sales_order_details.unique_id, status: default_status }, transaction } );
	
					addLog("Invoice Payments", user_unique_id, "Added Invoice Payment", payload);
					if (invoicePaymentResponse && responseSalesOrder[0] > 0 && responseInvoice[0] > 0) {
						return SuccessResponse(res, { unique_id: user_unique_id, text: "Invoice Payment created successfully!" }, { unique_id: invoice_payment_unique_id });
					} else {
						throw new Error("Error adding invoice payment");
					}
				});
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async updateInvoicePaymentReceiptReference(req: IGetAuthTypesRequest, res: Response) {
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
			const invoice_payment_details = await INVOICE_PAYMENT.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!invoice_payment_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Invoice Payment Not found" }, null);
			}

			await INVOICE_PAYMENT.sequelize?.transaction(async (transaction) => {
				const response = await INVOICE_PAYMENT.update(
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

				addLog("Invoice Payments", user_unique_id, "Updated Invoice Payment Receipt Reference", payload);
				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
				} else {
					throw new Error("Invoice Payment not found");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async updateInvoicePaymentNotes(req: IGetAuthTypesRequest, res: Response) {
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
			const invoice_details = await INVOICE_PAYMENT.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!invoice_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Invoice Payment Not found" }, null);
			}

			await INVOICE_PAYMENT.sequelize?.transaction(async (transaction) => {
				const response = await INVOICE_PAYMENT.update(
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

				addLog("Invoice Payments", user_unique_id, "Updated Invoice Payment Notes", payload);
				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
				} else {
					throw new Error("Invoice Payment not found");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async updateInvoicePaymentReceiptImage(req: IGetAuthTypesRequest, res: Response) {
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
			const invoice_payment_details = await INVOICE_PAYMENT.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!invoice_payment_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Invoice Payment Not found" }, null);
			}

			await INVOICE_PAYMENT.sequelize?.transaction(async (transaction) => {
				const response = await INVOICE_PAYMENT.update(
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

				addLog("Invoice Payments", user_unique_id, "Updated Invoice Payment Receipt Image", payload);
				if (response[0] > 0) {
					SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
					
					// Delete former image available
					if (invoice_payment_details.receipt_image_public_id !== null) {
						await deleteImage(clouder_key || '', { cloudinary_name: cloudy_name, cloudinary_key: cloudy_key, cloudinary_secret: cloudy_secret, public_id: invoice_payment_details.receipt_image_public_id });
					}
				} else {
					throw new Error("Invoice Payment not found");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async deleteInvoicePayment(req: IGetAuthTypesRequest, res: Response) {
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
			const invoice_payment_details = await INVOICE_PAYMENT.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!invoice_payment_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Invoice Payment Not found" }, null);
			}

			const invoice_details = await INVOICE.findOne({
				attributes: { exclude: ['id'] },
				where: {
					unique_id: invoice_payment_details.invoice_unique_id,
					status: default_status
				}
			});

			if (!invoice_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Invoice not found" }, null);
			}

			const sales_order_details = await SALES_ORDER.findOne({
				attributes: { exclude: ['id'] },
				where: {
					unique_id: invoice_details.sales_order_unique_id,
				}
			});

			if (!sales_order_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Sales order not found" }, null);
			}

			const customer_details = await CUSTOMER.findOne({
				attributes: { exclude: ['id'] },
				where: {
					unique_id: invoice_details.customer_unique_id,
				}
			});

			if (!customer_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Customer not found" }, null);
			}

			const amount_paid = invoice_payment_details.amount_paid || 0;

			if (invoice_payment_details.payment_method === invoice_payment_method.account_balance && customer_details.balance) {
				const new_customer_balance = customer_details.balance + amount_paid;

				const new_invoice_amount_paid = invoice_details.amount_paid && invoice_details.amount_paid > 0 ? invoice_details.amount_paid - amount_paid : amount_paid;
				const new_invoice_balance_due = invoice_details.total_amount && invoice_details.total_amount > 0 ? invoice_details.total_amount - new_invoice_amount_paid : invoice_details.balance_due;
				const new_invoice_status = new_invoice_amount_paid === invoice_details.total_amount || new_invoice_balance_due === zero ? invoice_status.paid : (new_invoice_amount_paid === zero || new_invoice_balance_due === invoice_details.total_amount ? invoice_status.unpaid : invoice_status.partially_paid);

				await INVOICE_PAYMENT.sequelize?.transaction(async (transaction) => {
					const response = await INVOICE_PAYMENT.destroy(
						{
							where: {
								unique_id: payload.unique_id,
								status: default_status
							},
							transaction
						}
					);

					const responseInvoice = await INVOICE.update( { amount_paid: new_invoice_amount_paid, balance_due: new_invoice_balance_due, invoice_status: new_invoice_status, }, { where: { unique_id: invoice_details.unique_id, status: default_status }, transaction } );
					const responseSalesOrder = await SALES_ORDER.update( { order_status: new_invoice_status === invoice_status.unpaid ? approved : processing }, { where: { unique_id: sales_order_details.unique_id, status: default_status }, transaction } );
					const responseCustomer = await CUSTOMER.update( { balance: new_customer_balance }, { where: { unique_id: customer_details.unique_id, status: default_status }, transaction } );

					addLog("Invoice Payments", user_unique_id, "Deleted Invoice Payment", payload);
					if (response > 0 && responseSalesOrder[0] > 0 && responseInvoice[0] > 0 && responseCustomer[0] > 0) {
						SuccessResponse(res, { unique_id: user_unique_id, text: "Invoice Payment was deleted successfully!" }, null);
						
						// Delete former image available
						if (invoice_payment_details.receipt_image_public_id !== null) {
							await deleteImage(clouder_key || '', { cloudinary_name: cloudy_name, cloudinary_key: cloudy_key, cloudinary_secret: cloudy_secret, public_id: invoice_payment_details.receipt_image_public_id });
						}
					} else {
						throw new Error("Error deleting record");
					}
				});
			} else {
				const new_invoice_amount_paid = invoice_details.amount_paid && invoice_details.amount_paid > 0 ? invoice_details.amount_paid - amount_paid : amount_paid;
				const new_invoice_balance_due = invoice_details.total_amount && invoice_details.total_amount > 0 ? invoice_details.total_amount - new_invoice_amount_paid : invoice_details.balance_due;
				const new_invoice_status = new_invoice_amount_paid === invoice_details.total_amount || new_invoice_balance_due === zero ? invoice_status.paid : (new_invoice_amount_paid === zero || new_invoice_balance_due === invoice_details.total_amount ? invoice_status.unpaid : invoice_status.partially_paid);
	
				await INVOICE_PAYMENT.sequelize?.transaction(async (transaction) => {
					const response = await INVOICE_PAYMENT.destroy(
						{
							where: {
								unique_id: payload.unique_id,
								status: default_status
							},
							transaction
						}
					);
	
					const responseInvoice = await INVOICE.update( { amount_paid: new_invoice_amount_paid, balance_due: new_invoice_balance_due, invoice_status: new_invoice_status, }, { where: { unique_id: invoice_details.unique_id, status: default_status }, transaction } );
					const responseSalesOrder = await SALES_ORDER.update( { order_status: new_invoice_status === invoice_status.unpaid ? approved : processing }, { where: { unique_id: sales_order_details.unique_id, status: default_status }, transaction } );
	
					addLog("Invoice Payments", user_unique_id, "Deleted Invoice Payment", payload);
					if (response > 0 && responseSalesOrder[0] > 0 && responseInvoice[0] > 0) {
						SuccessResponse(res, { unique_id: user_unique_id, text: "Invoice Payment was deleted successfully!" }, null);
						
						// Delete former image available
						if (invoice_payment_details.receipt_image_public_id !== null) {
							await deleteImage(clouder_key || '', { cloudinary_name: cloudy_name, cloudinary_key: cloudy_key, cloudinary_secret: cloudy_secret, public_id: invoice_payment_details.receipt_image_public_id });
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
