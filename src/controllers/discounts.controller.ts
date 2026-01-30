import { Request, Response } from "express";
import { Op } from "sequelize";
import { validationResult, matchedData } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import DISCOUNT, { IDiscount } from "../models/discounts.model";
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
	dynamicWhere, 
} from '../config/config';

export default class DiscountController {
	async getDiscounts(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await DISCOUNT.count();
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await DISCOUNT.findAndCountAll({
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
						model: INVOICE,
						attributes: ['unique_id', 'invoice_date', 'due_date', 'invoice_type', 'subtotal_amount', 'discount_amount', 'outside_town_surcharge', 'total_amount', 'amount_paid', 'balance_due', 'notes', 'invoice_status']
					}, 
					{
						model: SALES_ORDER,
						attributes: ['unique_id', 'reference', 'total_amount', 'discount_amount', 'outside_town', 'outside_town_location', 'estimated_trip_liters', 'outside_town_surcharge', 'amount_payable', 'total_items_ordered', 'total_items_dropped', 'order_status'], 
						include: [
							{
								model: CUSTOMER,
								attributes: ['unique_id', 'reference', 'type', 'name', 'email', 'phone_number', 'alt_phone_number', 'balance', 'profile_image']
							}, 	
						]
					}
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Discounts", user_unique_id, "Queried Discounts", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Discounts Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Discounts loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getDiscount(req: IGetAuthTypesRequest, res: Response) {
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
			const response = await DISCOUNT.findOne({
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
						model: INVOICE,
						attributes: ['unique_id', 'invoice_date', 'due_date', 'invoice_type', 'subtotal_amount', 'discount_amount', 'outside_town_surcharge', 'total_amount', 'amount_paid', 'balance_due', 'notes', 'invoice_status']
					}, 
					{
						model: SALES_ORDER,
						attributes: ['unique_id', 'reference', 'total_amount', 'discount_amount', 'outside_town', 'outside_town_location', 'estimated_trip_liters', 'outside_town_surcharge', 'amount_payable', 'total_items_ordered', 'total_items_dropped', 'order_status'], 
						include: [
							{
								model: CUSTOMER,
								attributes: ['unique_id', 'reference', 'type', 'name', 'email', 'phone_number', 'alt_phone_number', 'balance', 'profile_image']
							}, 	
						]
					}
				], 
			});

			addLog("Discounts", user_unique_id, "Queried Discount", queryParams);
			if (!response) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Discount Not found" }, null);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Discount loaded" }, response);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async searchDiscounts(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await DISCOUNT.count({
			where: {
				[Op.or]: [
					{
						reason: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					}
				]
			}
		});
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await DISCOUNT.findAndCountAll({
				attributes: { exclude: ['id'] },
				where: {
					[Op.or]: [
						{
							reason: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
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
						model: INVOICE,
						attributes: ['unique_id', 'invoice_date', 'due_date', 'invoice_type', 'subtotal_amount', 'discount_amount', 'outside_town_surcharge', 'total_amount', 'amount_paid', 'balance_due', 'notes', 'invoice_status']
					}, 
					{
						model: SALES_ORDER,
						attributes: ['unique_id', 'reference', 'total_amount', 'discount_amount', 'outside_town', 'outside_town_location', 'estimated_trip_liters', 'outside_town_surcharge', 'amount_payable', 'total_items_ordered', 'total_items_dropped', 'order_status'], 
						include: [
							{
								model: CUSTOMER,
								attributes: ['unique_id', 'reference', 'type', 'name', 'email', 'phone_number', 'alt_phone_number', 'balance', 'profile_image']
							}, 	
						]
					}
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Discounts", user_unique_id, "Searched Discounts", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Discounts Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Discounts loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getDiscountsSpecifically(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await DISCOUNT.count({ where: dynamicWhere(queryParams) });
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await DISCOUNT.findAndCountAll({
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
						model: INVOICE,
						attributes: ['unique_id', 'invoice_date', 'due_date', 'invoice_type', 'subtotal_amount', 'discount_amount', 'outside_town_surcharge', 'total_amount', 'amount_paid', 'balance_due', 'notes', 'invoice_status']
					}, 
					{
						model: SALES_ORDER,
						attributes: ['unique_id', 'reference', 'total_amount', 'discount_amount', 'outside_town', 'outside_town_location', 'estimated_trip_liters', 'outside_town_surcharge', 'amount_payable', 'total_items_ordered', 'total_items_dropped', 'order_status'], 
						include: [
							{
								model: CUSTOMER,
								attributes: ['unique_id', 'reference', 'type', 'name', 'email', 'phone_number', 'alt_phone_number', 'balance', 'profile_image']
							}, 	
						]
					}
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Discounts", user_unique_id, "Queried Discounts specifically", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Discounts Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Discounts loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async filterDiscountsSpecifically(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await DISCOUNT.count({
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
			const response = await DISCOUNT.findAndCountAll({
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
						model: INVOICE,
						attributes: ['unique_id', 'invoice_date', 'due_date', 'invoice_type', 'subtotal_amount', 'discount_amount', 'outside_town_surcharge', 'total_amount', 'amount_paid', 'balance_due', 'notes', 'invoice_status']
					}, 
					{
						model: SALES_ORDER,
						attributes: ['unique_id', 'reference', 'total_amount', 'discount_amount', 'outside_town', 'outside_town_location', 'estimated_trip_liters', 'outside_town_surcharge', 'amount_payable', 'total_items_ordered', 'total_items_dropped', 'order_status'], 
						include: [
							{
								model: CUSTOMER,
								attributes: ['unique_id', 'reference', 'type', 'name', 'email', 'phone_number', 'alt_phone_number', 'balance', 'profile_image']
							}, 	
						]
					}
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Discounts", user_unique_id, "Filtered Discounts specifically", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Discounts Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Discounts loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async publicGetDiscounts(req: IGetAuthTypesRequest, res: Response) {
		const queryParams: IPagination = req.query;

		const total_records = await DISCOUNT.count({ where: { status: default_status } });
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await DISCOUNT.findAndCountAll({
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
						model: INVOICE,
						attributes: ['unique_id', 'invoice_date', 'due_date', 'invoice_type', 'subtotal_amount', 'discount_amount', 'outside_town_surcharge', 'total_amount', 'amount_paid', 'balance_due', 'notes', 'invoice_status']
					}, 
					{
						model: SALES_ORDER,
						attributes: ['unique_id', 'reference', 'total_amount', 'discount_amount', 'outside_town', 'outside_town_location', 'estimated_trip_liters', 'outside_town_surcharge', 'amount_payable', 'total_items_ordered', 'total_items_dropped', 'order_status'], 
						include: [
							{
								model: CUSTOMER,
								attributes: ['unique_id', 'reference', 'type', 'name', 'email', 'phone_number', 'alt_phone_number', 'balance', 'profile_image']
							}, 	
						]
					}
				], 
				order: [
					[orderBy, sortBy]
				],
				// offset: pagination.start,
				// limit: pagination.limit
			});

			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: anonymous, text: "Discounts Not found" }, []);
			} else {
				// return SuccessResponse(res, { unique_id: anonymous, text: "Discounts loaded" }, { ...response, pages: pagination.pages });
				return SuccessResponse(res, { unique_id: anonymous, text: "Discounts loaded" }, { ...response });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async publicGetDiscount(req: IGetAuthTypesRequest, res: Response) {
		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: anonymous, text: "Validation Error Occured" }, errors.array())
		}

		try {
			const response = await DISCOUNT.findOne({
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
						model: INVOICE,
						attributes: ['unique_id', 'invoice_date', 'due_date', 'invoice_type', 'subtotal_amount', 'discount_amount', 'outside_town_surcharge', 'total_amount', 'amount_paid', 'balance_due', 'notes', 'invoice_status']
					}, 
					{
						model: SALES_ORDER,
						attributes: ['unique_id', 'reference', 'total_amount', 'discount_amount', 'outside_town', 'outside_town_location', 'estimated_trip_liters', 'outside_town_surcharge', 'amount_payable', 'total_items_ordered', 'total_items_dropped', 'order_status'], 
						include: [
							{
								model: CUSTOMER,
								attributes: ['unique_id', 'reference', 'type', 'name', 'email', 'phone_number', 'alt_phone_number', 'balance', 'profile_image']
							}, 	
						]
					}
				], 
			});

			if (!response) {
				return SuccessResponse(res, { unique_id: anonymous, text: "Discount Not found" }, null);
			} else {
				return SuccessResponse(res, { unique_id: anonymous, text: "Discount loaded" }, response);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async publicSearchDiscounts(req: IGetAuthTypesRequest, res: Response) {
		const queryParams: IPagination = req.query;

		const total_records = await DISCOUNT.count({
			where: {
				[Op.or]: [
					{
						reason: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					}
				]
			}
		});
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await DISCOUNT.findAndCountAll({
				attributes: { exclude: ['id', 'status'] },
				where: {
					[Op.or]: [
						{
							reason: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
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
						model: INVOICE,
						attributes: ['unique_id', 'invoice_date', 'due_date', 'invoice_type', 'subtotal_amount', 'discount_amount', 'outside_town_surcharge', 'total_amount', 'amount_paid', 'balance_due', 'notes', 'invoice_status']
					}, 
					{
						model: SALES_ORDER,
						attributes: ['unique_id', 'reference', 'total_amount', 'discount_amount', 'outside_town', 'outside_town_location', 'estimated_trip_liters', 'outside_town_surcharge', 'amount_payable', 'total_items_ordered', 'total_items_dropped', 'order_status'], 
						include: [
							{
								model: CUSTOMER,
								attributes: ['unique_id', 'reference', 'type', 'name', 'email', 'phone_number', 'alt_phone_number', 'balance', 'profile_image']
							}, 	
						]
					}
				], 
				order: [
					[orderBy, sortBy]
				],
				// offset: pagination.start,
				// limit: pagination.limit
			});

			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: anonymous, text: "Discounts Not found" }, []);
			} else {
				// return SuccessResponse(res, { unique_id: anonymous, text: "Discounts loaded" }, { ...response, pages: pagination.pages });
				return SuccessResponse(res, { unique_id: anonymous, text: "Discounts loaded" }, { ...response });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async addDiscount(req: IGetAuthTypesRequest, res: Response) {
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

			if (sales_order_details.discount_amount && sales_order_details.discount_amount > 0) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Discount already added to sales order" }, null);
			}

			const invoice_details = await INVOICE.findOne({
				attributes: { exclude: ['id'] },
				where: {
					sales_order_unique_id: payload.sales_order_unique_id,
					status: default_status
				}
			});

			const discount_unique_id = uuidv4();

			await DISCOUNT.sequelize?.transaction(async (transaction) => {
				const discountResponse = await DISCOUNT.create({
					unique_id: discount_unique_id,
					sales_order_unique_id: payload.sales_order_unique_id,
					invoice_unique_id: invoice_details ? invoice_details.unique_id : null, 
					discount_amount: parseInt(payload.discount_amount),
					reason: payload.reason ? payload.reason : null,
					created_by: user_unique_id,
					approved_by: null,
					status: default_status
				}, { transaction });

				addLog("Discounts", user_unique_id, "Added Discount", payload);
				if (discountResponse) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Discount created successfully!" }, { unique_id: discount_unique_id });
				} else {
					throw new Error("Error adding discount");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async updateDiscount(req: IGetAuthTypesRequest, res: Response) {
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
			const discount_details = await DISCOUNT.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!discount_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Discount Not found" }, null);
			}

			if (discount_details.approved_by !== null) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Discount already approved, update disabled" }, null);
			}

			const discount_amount = payload.discount_amount ? parseInt(payload.discount_amount) : 0;
			
			await DISCOUNT.sequelize?.transaction(async (transaction) => {
				const response = await DISCOUNT.update(
					{
						discount_amount: discount_amount,
						reason: payload.reason ? payload.reason : null,
					}, {
						where: {
							unique_id: payload.unique_id,
							status: default_status
						},
						transaction
					}
				);

				addLog("Discounts", user_unique_id, "Updated Discount", payload);
				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
				} else {
					throw new Error("Discount not found");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async approveDiscount(req: IGetAuthTypesRequest, res: Response) {
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
			const discount_details = await DISCOUNT.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!discount_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Discount Not found" }, null);
			}

			if (discount_details.approved_by !== null) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Discount already approved, update disabled" }, null);
			}

			const sales_order_details = await SALES_ORDER.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: discount_details.sales_order_unique_id }
			});

			if (!sales_order_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Sales Order Not found" }, null);
			}

			const discount_amount = discount_details.discount_amount ? discount_details.discount_amount : 0;
			const new_amount_payable = sales_order_details.total_amount && discount_amount > 0 ? sales_order_details.total_amount - discount_amount : sales_order_details.total_amount;
			
			const invoice_details = await INVOICE.findOne({
				attributes: { exclude: ['id'] },
				where: {
					sales_order_unique_id: discount_details.sales_order_unique_id,
					status: default_status
				}
			});
			
			if (invoice_details) {
				const new_total_amount = invoice_details.subtotal_amount && discount_amount > 0 ? invoice_details.subtotal_amount - discount_amount : invoice_details.subtotal_amount;
				
				await DISCOUNT.sequelize?.transaction(async (transaction) => {
					const response = await DISCOUNT.update( { approved_by: user_unique_id, invoice_unique_id: invoice_details.unique_id }, { where: { unique_id: payload.unique_id, status: default_status }, transaction } );
					// const responseSalesOrder = await SALES_ORDER.update( { discount_unique_id: discount_details.unique_id, discount_amount: discount_details.discount_amount, discount_reason: discount_details.reason, amount_payable: new_amount_payable }, { where: { unique_id: sales_order_details.unique_id, status: default_status }, transaction } );
					const responseSalesOrder = await SALES_ORDER.update( { discount_amount: discount_details.discount_amount, discount_reason: discount_details.reason, amount_payable: new_amount_payable }, { where: { unique_id: sales_order_details.unique_id, status: default_status }, transaction } );
					const responseInvoice = await INVOICE.update( { total_amount: new_total_amount, discount_amount: discount_amount }, { where: { unique_id: invoice_details.unique_id, status: default_status }, transaction } );
	
					addLog("Discounts", user_unique_id, "Approved Discount", payload);
					if (response[0] > 0 && responseSalesOrder[0] > 0 && responseInvoice[0] > 0) {
						return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
					} else {
						throw new Error("Discount not found");
					}
				});
			} else {
				await DISCOUNT.sequelize?.transaction(async (transaction) => {
					const response = await DISCOUNT.update( { approved_by: user_unique_id, }, { where: { unique_id: payload.unique_id, status: default_status }, transaction } );
					// const responseSalesOrder = await SALES_ORDER.update( { discount_unique_id: discount_details.unique_id, discount_amount: discount_details.discount_amount, discount_reason: discount_details.reason, amount_payable: new_amount_payable }, { where: { unique_id: sales_order_details.unique_id, status: default_status }, transaction } );
					const responseSalesOrder = await SALES_ORDER.update( { discount_amount: discount_details.discount_amount, discount_reason: discount_details.reason, amount_payable: new_amount_payable }, { where: { unique_id: sales_order_details.unique_id, status: default_status }, transaction } );

					addLog("Discounts", user_unique_id, "Approved Discount", payload);
					if (response[0] > 0 && responseSalesOrder[0] > 0) {
						return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
					} else {
						throw new Error("Discount not found");
					}
				});
			}

		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async deleteDiscount(req: IGetAuthTypesRequest, res: Response) {
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
			const discount_details = await DISCOUNT.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!discount_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Discount Not found" }, null);
			}

			if (discount_details.approved_by !== null) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Discount already approved, update disabled" }, null);
			}

			await DISCOUNT.sequelize?.transaction(async (transaction) => {
				const response = await DISCOUNT.destroy(
					{
						where: {
							unique_id: payload.unique_id,
							status: default_status
						},
						transaction
					}
				);

				addLog("Discounts", user_unique_id, "Deleted Discount", payload);
				if (response > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Discount was deleted successfully!" }, null);
				} else {
					throw new Error("Error deleting record");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}
};
