import { Request, Response } from "express";
import { Op } from "sequelize";
import { validationResult, matchedData } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import SALES_ORDER, { ISalesOrder } from "../models/salesOrders.model";
import INVOICE, { IInvoice } from "../models/invoices.model";
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
	dynamicWhere, zero, invoice_status, 
} from '../config/config';

export default class InvoiceController {
	async getInvoices(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await INVOICE.count();
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await INVOICE.findAndCountAll({
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
						model: SALES_ORDER,
						attributes: ['unique_id', 'reference', 'total_amount', 'discount_amount', 'outside_town', 'outside_town_location', 'estimated_trip_liters', 'outside_town_surcharge', 'amount_payable', 'total_items_ordered', 'total_items_dropped', 'order_status'], 
					}
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Invoices", user_unique_id, "Queried Invoices", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Invoices Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Invoices loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getInvoice(req: IGetAuthTypesRequest, res: Response) {
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
			const response = await INVOICE.findOne({
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
						model: SALES_ORDER,
						attributes: ['unique_id', 'reference', 'total_amount', 'discount_amount', 'outside_town', 'outside_town_location', 'estimated_trip_liters', 'outside_town_surcharge', 'amount_payable', 'total_items_ordered', 'total_items_dropped', 'order_status'], 
					}
				], 
			});

			addLog("Invoices", user_unique_id, "Queried Invoice", queryParams);
			if (!response) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Invoice Not found" }, null);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Invoice loaded" }, response);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async searchInvoices(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await INVOICE.count({
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
			const response = await INVOICE.findAndCountAll({
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
						model: SALES_ORDER,
						attributes: ['unique_id', 'reference', 'total_amount', 'discount_amount', 'outside_town', 'outside_town_location', 'estimated_trip_liters', 'outside_town_surcharge', 'amount_payable', 'total_items_ordered', 'total_items_dropped', 'order_status'], 
					}
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Invoices", user_unique_id, "Searched Invoices", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Invoices Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Invoices loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getInvoicesSpecifically(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await INVOICE.count({ where: dynamicWhere(queryParams) });
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await INVOICE.findAndCountAll({
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
						model: SALES_ORDER,
						attributes: ['unique_id', 'reference', 'total_amount', 'discount_amount', 'outside_town', 'outside_town_location', 'estimated_trip_liters', 'outside_town_surcharge', 'amount_payable', 'total_items_ordered', 'total_items_dropped', 'order_status'], 
					}
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Invoices", user_unique_id, "Queried Invoices specifically", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Invoices Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Invoices loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async filterInvoicesSpecifically(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await INVOICE.count({
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
			const response = await INVOICE.findAndCountAll({
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
						model: SALES_ORDER,
						attributes: ['unique_id', 'reference', 'total_amount', 'discount_amount', 'outside_town', 'outside_town_location', 'estimated_trip_liters', 'outside_town_surcharge', 'amount_payable', 'total_items_ordered', 'total_items_dropped', 'order_status'], 
					}
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Invoices", user_unique_id, "Filtered Invoices specifically", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Invoices Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Invoices loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async publicGetInvoices(req: IGetAuthTypesRequest, res: Response) {
		const queryParams: IPagination = req.query;

		const total_records = await INVOICE.count({ where: { status: default_status } });
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await INVOICE.findAndCountAll({
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
						model: SALES_ORDER,
						attributes: ['unique_id', 'reference', 'total_amount', 'discount_amount', 'outside_town', 'outside_town_location', 'estimated_trip_liters', 'outside_town_surcharge', 'amount_payable', 'total_items_ordered', 'total_items_dropped', 'order_status'], 
					}
				], 
				order: [
					[orderBy, sortBy]
				],
				// offset: pagination.start,
				// limit: pagination.limit
			});

			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: anonymous, text: "Invoices Not found" }, []);
			} else {
				// return SuccessResponse(res, { unique_id: anonymous, text: "Invoices loaded" }, { ...response, pages: pagination.pages });
				return SuccessResponse(res, { unique_id: anonymous, text: "Invoices loaded" }, { ...response });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async publicGetInvoice(req: IGetAuthTypesRequest, res: Response) {
		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: anonymous, text: "Validation Error Occured" }, errors.array())
		}

		try {
			const response = await INVOICE.findOne({
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
						model: SALES_ORDER,
						attributes: ['unique_id', 'reference', 'total_amount', 'discount_amount', 'outside_town', 'outside_town_location', 'estimated_trip_liters', 'outside_town_surcharge', 'amount_payable', 'total_items_ordered', 'total_items_dropped', 'order_status'], 
					}
				], 
			});

			if (!response) {
				return SuccessResponse(res, { unique_id: anonymous, text: "Invoice Not found" }, null);
			} else {
				return SuccessResponse(res, { unique_id: anonymous, text: "Invoice loaded" }, response);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async publicSearchInvoices(req: IGetAuthTypesRequest, res: Response) {
		const queryParams: IPagination = req.query;

		const total_records = await INVOICE.count({
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
			const response = await INVOICE.findAndCountAll({
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
						model: SALES_ORDER,
						attributes: ['unique_id', 'reference', 'total_amount', 'discount_amount', 'outside_town', 'outside_town_location', 'estimated_trip_liters', 'outside_town_surcharge', 'amount_payable', 'total_items_ordered', 'total_items_dropped', 'order_status'], 
					}
				], 
				order: [
					[orderBy, sortBy]
				],
				// offset: pagination.start,
				// limit: pagination.limit
			});

			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: anonymous, text: "Invoices Not found" }, []);
			} else {
				// return SuccessResponse(res, { unique_id: anonymous, text: "Invoices loaded" }, { ...response, pages: pagination.pages });
				return SuccessResponse(res, { unique_id: anonymous, text: "Invoices loaded" }, { ...response });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async addInvoice(req: IGetAuthTypesRequest, res: Response) {
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
			
			const sales_order_details = await SALES_ORDER.findOne({
				attributes: { exclude: ['id'] },
				where: {
					unique_id: payload.sales_order_unique_id,
					status: default_status
				}
			});

			if (!sales_order_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Sales Order not found" }, null);
			}

			const invoice_details = await INVOICE.findOne({
				attributes: { exclude: ['id'] },
				where: {
					sales_order_unique_id: payload.sales_order_unique_id,
					invoice_status: {
						[Op.ne]: invoice_status.cancelled
					},
					status: default_status
				}
			});

			if (invoice_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Invoice already exists for sales order" }, null);
			}

			const invoice_unique_id = uuidv4();

			await INVOICE.sequelize?.transaction(async (transaction) => {
				const invoiceResponse = await INVOICE.create({
					unique_id: invoice_unique_id,
					sales_order_unique_id: sales_order_details.unique_id,
					customer_unique_id: sales_order_details.customer_unique_id,
					invoice_date: payload.invoice_date,
					due_date: payload.due_date,
					invoice_type: payload.invoice_type,
					subtotal_amount: sales_order_details.total_amount,
					discount_amount: sales_order_details.discount_amount,
					outside_town_surcharge: sales_order_details.outside_town_surcharge,
					total_amount: sales_order_details.amount_payable,
					amount_paid: zero,
					balance_due: sales_order_details.amount_payable,
					notes: payload.notes ? payload.notes : null,
					invoice_status: invoice_status.unpaid,
					created_by: user_unique_id,
					status: default_status
				}, { transaction });

				addLog("Invoices", user_unique_id, "Added Invoice", payload);
				if (invoiceResponse) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Invoice created successfully!" }, { unique_id: invoice_unique_id });
				} else {
					throw new Error("Error adding invoice");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async updateInvoiceDueDate(req: IGetAuthTypesRequest, res: Response) {
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
			const invoice_details = await INVOICE.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!invoice_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Invoice Not found" }, null);
			}

			// if (invoice_details.invoice_status !== invoice_status.unpaid) {
			// 	return BadRequestError(res, { unique_id: user_unique_id, text: `Unable to update invoice, current status - ${invoice_details.invoice_status}` }, null);
			// }

			await INVOICE.sequelize?.transaction(async (transaction) => {
				const response = await INVOICE.update(
					{
						due_date: payload.due_date,
					}, {
						where: {
							unique_id: payload.unique_id,
							status: default_status
						},
						transaction
					}
				);

				addLog("Invoices", user_unique_id, "Updated Invoice Due Date", payload);
				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
				} else {
					throw new Error("Invoice not found");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async updateInvoiceType(req: IGetAuthTypesRequest, res: Response) {
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
			const invoice_details = await INVOICE.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!invoice_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Invoice Not found" }, null);
			}

			// if (invoice_details.invoice_status !== invoice_status.unpaid) {
			// 	return BadRequestError(res, { unique_id: user_unique_id, text: `Unable to update invoice, current status - ${invoice_details.invoice_status}` }, null);
			// }

			await INVOICE.sequelize?.transaction(async (transaction) => {
				const response = await INVOICE.update(
					{
						invoice_type: payload.invoice_type,
					}, {
						where: {
							unique_id: payload.unique_id,
							status: default_status
						},
						transaction
					}
				);

				addLog("Invoices", user_unique_id, "Updated Invoice Type", payload);
				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
				} else {
					throw new Error("Invoice not found");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async updateInvoiceNotes(req: IGetAuthTypesRequest, res: Response) {
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
			const invoice_details = await INVOICE.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!invoice_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Invoice Not found" }, null);
			}

			// if (invoice_details.invoice_status !== invoice_status.unpaid) {
			// 	return BadRequestError(res, { unique_id: user_unique_id, text: `Unable to update invoice, current status - ${invoice_details.invoice_status}` }, null);
			// }

			await INVOICE.sequelize?.transaction(async (transaction) => {
				const response = await INVOICE.update(
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

				addLog("Invoices", user_unique_id, "Updated Invoice Notes", payload);
				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
				} else {
					throw new Error("Invoice not found");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async cancelInvoice(req: IGetAuthTypesRequest, res: Response) {
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
			const invoice_details = await INVOICE.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!invoice_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Invoice Not found" }, null);
			}

			if (invoice_details.invoice_status !== invoice_status.unpaid) {
				return BadRequestError(res, { unique_id: user_unique_id, text: `Unable to cancel invoice, current status - ${invoice_details.invoice_status}` }, null);
			}

			await INVOICE.sequelize?.transaction(async (transaction) => {
				const response = await INVOICE.update(
					{
						invoice_status: invoice_status.cancelled,
					}, {
						where: {
							unique_id: payload.unique_id,
							status: default_status
						},
						transaction
					}
				);

				addLog("Invoices", user_unique_id, "Cancelled Invoice", payload);
				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
				} else {
					throw new Error("Invoice not found");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async deleteInvoice(req: IGetAuthTypesRequest, res: Response) {
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
			const invoice_details = await INVOICE.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!invoice_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Invoice Not found" }, null);
			}

			if (invoice_details.invoice_status !== invoice_status.unpaid && invoice_details.invoice_status !== invoice_status.cancelled) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Unable to delete, invoice is active" }, null);
			}

			await INVOICE.sequelize?.transaction(async (transaction) => {
				const response = await INVOICE.destroy(
					{
						where: {
							unique_id: payload.unique_id,
							status: default_status
						},
						transaction
					}
				);

				addLog("Invoices", user_unique_id, "Deleted Invoice", payload);
				if (response > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Invoice was deleted successfully!" }, null);
				} else {
					throw new Error("Error deleting record");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}
};
