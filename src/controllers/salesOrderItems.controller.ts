import { Request, Response } from "express";
import { Op } from "sequelize";
import { validationResult, matchedData } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import SALES_ORDER, { ISalesOrder } from "../models/salesOrders.model";
import SALES_ORDER_ITEM, { ISalesOrderItem } from "../models/salesOrderItems.model";
import SUPPLY_LOG, { ISupplyLog } from "../models/supplyLogs.model";
import FINISHED_GOOD, { IFinishedGood } from "../models/finishedGoods.model";
import FINISHED_GOOD_STOCK_LOG, { IFinishedGoodStockLog } from "../models/finishedGoodStockLogs.model";
import PRODUCT, { IProduct } from "../models/products.model";
import CATEGORY, { ICategory } from "../models/categories.model";
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
	dynamicWhere, processing, approved, completed,
	stock_log_movement_type
} from '../config/config';

export default class SalesOrderItemController {
	async getSalesOrderItems(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await SALES_ORDER_ITEM.count();
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await SALES_ORDER_ITEM.findAndCountAll({
				attributes: { exclude: ['id'] },
				include: [
					{
						model: SALES_ORDER,
						attributes: ['unique_id', 'reference', 'total_amount', 'discount_amount', 'outside_town', 'outside_town_location', 'estimated_trip_liters', 'outside_town_surcharge', 'amount_payable', 'total_items_ordered', 'total_items_dropped', 'order_status'], 
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
								model: CUSTOMER,
								attributes: ['unique_id', 'reference', 'type', 'name', 'email', 'phone_number', 'alt_phone_number', 'balance', 'profile_image']
							}, 		
						]
					},
					{
						model: PRODUCT,
						attributes: ['unique_id', 'reference', 'name', 'type', 'unit_of_measure', 'quantity', 'total_quantity', 'price', 'cost_price', 'is_outside_town_eligible', 'is_inventory_tracked'], 
						include: [
							{
								model: CATEGORY,
								attributes: ['unique_id', 'name', 'stripped']
							}
						]
					}
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Sales Orders", user_unique_id, "Queried Sales Order Items", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Sales Order Items Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Sales Order Items loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getSalesOrderItem(req: IGetAuthTypesRequest, res: Response) {
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
			const response = await SALES_ORDER_ITEM.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }, 
				include: [
					{
						model: SALES_ORDER,
						attributes: ['unique_id', 'reference', 'total_amount', 'discount_amount', 'outside_town', 'outside_town_location', 'estimated_trip_liters', 'outside_town_surcharge', 'amount_payable', 'total_items_ordered', 'total_items_dropped', 'order_status'], 
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
								model: CUSTOMER,
								attributes: ['unique_id', 'reference', 'type', 'name', 'email', 'phone_number', 'alt_phone_number', 'balance', 'profile_image']
							}, 		
						]
					},
					{
						model: PRODUCT,
						attributes: ['unique_id', 'reference', 'name', 'type', 'unit_of_measure', 'quantity', 'total_quantity', 'price', 'cost_price', 'is_outside_town_eligible', 'is_inventory_tracked'], 
						include: [
							{
								model: CATEGORY,
								attributes: ['unique_id', 'name', 'stripped']
							}
						]
					}
				], 
			});

			addLog("Sales Orders", user_unique_id, "Queried Sales Order", queryParams);
			if (!response) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Sales Order Not found" }, null);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Sales Order loaded" }, response);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async searchSalesOrderItems(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await SALES_ORDER_ITEM.count({
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
			const response = await SALES_ORDER_ITEM.findAndCountAll({
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
						model: SALES_ORDER,
						attributes: ['unique_id', 'reference', 'total_amount', 'discount_amount', 'outside_town', 'outside_town_location', 'estimated_trip_liters', 'outside_town_surcharge', 'amount_payable', 'total_items_ordered', 'total_items_dropped', 'order_status'], 
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
								model: CUSTOMER,
								attributes: ['unique_id', 'reference', 'type', 'name', 'email', 'phone_number', 'alt_phone_number', 'balance', 'profile_image']
							}, 		
						]
					},
					{
						model: PRODUCT,
						attributes: ['unique_id', 'reference', 'name', 'type', 'unit_of_measure', 'quantity', 'total_quantity', 'price', 'cost_price', 'is_outside_town_eligible', 'is_inventory_tracked'], 
						include: [
							{
								model: CATEGORY,
								attributes: ['unique_id', 'name', 'stripped']
							}
						]
					}
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Sales Orders", user_unique_id, "Searched Sales Order Items", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Sales Order Items Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Sales Order Items loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getSalesOrderItemsSpecifically(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await SALES_ORDER_ITEM.count({ where: dynamicWhere(queryParams) });
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await SALES_ORDER_ITEM.findAndCountAll({
				attributes: { exclude: ['id'] },
				where: dynamicWhere(queryParams),
				include: [
					{
						model: SALES_ORDER,
						attributes: ['unique_id', 'reference', 'total_amount', 'discount_amount', 'outside_town', 'outside_town_location', 'estimated_trip_liters', 'outside_town_surcharge', 'amount_payable', 'total_items_ordered', 'total_items_dropped', 'order_status'], 
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
								model: CUSTOMER,
								attributes: ['unique_id', 'reference', 'type', 'name', 'email', 'phone_number', 'alt_phone_number', 'balance', 'profile_image']
							}, 		
						]
					},
					{
						model: PRODUCT,
						attributes: ['unique_id', 'reference', 'name', 'type', 'unit_of_measure', 'quantity', 'total_quantity', 'price', 'cost_price', 'is_outside_town_eligible', 'is_inventory_tracked'], 
						include: [
							{
								model: CATEGORY,
								attributes: ['unique_id', 'name', 'stripped']
							}
						]
					}
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Sales Orders", user_unique_id, "Queried Sales Order Items specifically", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Sales Order Items Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Sales Order Items loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async filterSalesOrderItemsSpecifically(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await SALES_ORDER_ITEM.count({
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
			const response = await SALES_ORDER_ITEM.findAndCountAll({
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
						model: SALES_ORDER,
						attributes: ['unique_id', 'reference', 'total_amount', 'discount_amount', 'outside_town', 'outside_town_location', 'estimated_trip_liters', 'outside_town_surcharge', 'amount_payable', 'total_items_ordered', 'total_items_dropped', 'order_status'], 
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
								model: CUSTOMER,
								attributes: ['unique_id', 'reference', 'type', 'name', 'email', 'phone_number', 'alt_phone_number', 'balance', 'profile_image']
							}, 		
						]
					},
					{
						model: PRODUCT,
						attributes: ['unique_id', 'reference', 'name', 'type', 'unit_of_measure', 'quantity', 'total_quantity', 'price', 'cost_price', 'is_outside_town_eligible', 'is_inventory_tracked'], 
						include: [
							{
								model: CATEGORY,
								attributes: ['unique_id', 'name', 'stripped']
							}
						]
					}
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Sales Orders", user_unique_id, "Filtered Sales Order Items specifically", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Sales Order Items Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Sales Order Items loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async publicGetSalesOrderItems(req: IGetAuthTypesRequest, res: Response) {
		const queryParams: IPagination = req.query;

		const total_records = await SALES_ORDER_ITEM.count({ where: { status: default_status } });
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await SALES_ORDER_ITEM.findAndCountAll({
				attributes: { exclude: ['id', 'status'] },
				where: { status: default_status },
				include: [
					{
						model: SALES_ORDER,
						attributes: ['unique_id', 'reference', 'total_amount', 'discount_amount', 'outside_town', 'outside_town_location', 'estimated_trip_liters', 'outside_town_surcharge', 'amount_payable', 'total_items_ordered', 'total_items_dropped', 'order_status'], 
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
								model: CUSTOMER,
								attributes: ['unique_id', 'reference', 'type', 'name', 'email', 'phone_number', 'alt_phone_number', 'balance', 'profile_image']
							}, 		
						]
					},
					{
						model: PRODUCT,
						attributes: ['unique_id', 'reference', 'name', 'type', 'unit_of_measure', 'quantity', 'total_quantity', 'price', 'cost_price', 'is_outside_town_eligible', 'is_inventory_tracked'], 
						include: [
							{
								model: CATEGORY,
								attributes: ['unique_id', 'name', 'stripped']
							}
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
				return SuccessResponse(res, { unique_id: anonymous, text: "Sales Order Items Not found" }, []);
			} else {
				// return SuccessResponse(res, { unique_id: anonymous, text: "Sales Order Items loaded" }, { ...response, pages: pagination.pages });
				return SuccessResponse(res, { unique_id: anonymous, text: "Sales Order Items loaded" }, { ...response });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async publicGetSalesOrderItem(req: IGetAuthTypesRequest, res: Response) {
		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: anonymous, text: "Validation Error Occured" }, errors.array())
		}

		try {
			const response = await SALES_ORDER_ITEM.findOne({
				attributes: { exclude: ['id', 'status'] },
				where: { ...payload }, 
				include: [
					{
						model: SALES_ORDER,
						attributes: ['unique_id', 'reference', 'total_amount', 'discount_amount', 'outside_town', 'outside_town_location', 'estimated_trip_liters', 'outside_town_surcharge', 'amount_payable', 'total_items_ordered', 'total_items_dropped', 'order_status'], 
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
								model: CUSTOMER,
								attributes: ['unique_id', 'reference', 'type', 'name', 'email', 'phone_number', 'alt_phone_number', 'balance', 'profile_image']
							}, 		
						]
					},
					{
						model: PRODUCT,
						attributes: ['unique_id', 'reference', 'name', 'type', 'unit_of_measure', 'quantity', 'total_quantity', 'price', 'cost_price', 'is_outside_town_eligible', 'is_inventory_tracked'], 
						include: [
							{
								model: CATEGORY,
								attributes: ['unique_id', 'name', 'stripped']
							}
						]
					}
				], 
			});

			if (!response) {
				return SuccessResponse(res, { unique_id: anonymous, text: "Sales Order Not found" }, null);
			} else {
				return SuccessResponse(res, { unique_id: anonymous, text: "Sales Order loaded" }, response);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async publicSearchSalesOrderItems(req: IGetAuthTypesRequest, res: Response) {
		const queryParams: IPagination = req.query;

		const total_records = await SALES_ORDER_ITEM.count({
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
			const response = await SALES_ORDER_ITEM.findAndCountAll({
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
						model: SALES_ORDER,
						attributes: ['unique_id', 'reference', 'total_amount', 'discount_amount', 'outside_town', 'outside_town_location', 'estimated_trip_liters', 'outside_town_surcharge', 'amount_payable', 'total_items_ordered', 'total_items_dropped', 'order_status'], 
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
								model: CUSTOMER,
								attributes: ['unique_id', 'reference', 'type', 'name', 'email', 'phone_number', 'alt_phone_number', 'balance', 'profile_image']
							}, 		
						]
					},
					{
						model: PRODUCT,
						attributes: ['unique_id', 'reference', 'name', 'type', 'unit_of_measure', 'quantity', 'total_quantity', 'price', 'cost_price', 'is_outside_town_eligible', 'is_inventory_tracked'], 
						include: [
							{
								model: CATEGORY,
								attributes: ['unique_id', 'name', 'stripped']
							}
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
				return SuccessResponse(res, { unique_id: anonymous, text: "Sales Order Items Not found" }, []);
			} else {
				// return SuccessResponse(res, { unique_id: anonymous, text: "Sales Order Items loaded" }, { ...response, pages: pagination.pages });
				return SuccessResponse(res, { unique_id: anonymous, text: "Sales Order Items loaded" }, { ...response });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async updateSalesOrderItemQuantitySupplied(req: IGetAuthTypesRequest, res: Response) {
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
			const sales_order_item_details = await SALES_ORDER_ITEM.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!sales_order_item_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Sales Order Item Not found" }, null);
			}

			const sales_order_details = await SALES_ORDER.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: sales_order_item_details.sales_order_unique_id }
			});

			if (!sales_order_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Sales Order Not found" }, null);
			}

			if (sales_order_details.order_status !== processing) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Sales Order is not in processing" }, null);
			} 

			const product_details = await PRODUCT.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: sales_order_item_details.sales_order_unique_id }
			});

			if (!product_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Sales Order - Product Not found" }, null);
			}

			const quantity_supplied = payload.quantity_supplied ? parseInt(payload.quantity_supplied) : 0;
			const total_items_dropped = sales_order_details.total_items_dropped && sales_order_item_details.quantity_ordered && sales_order_item_details.quantity_ordered === quantity_supplied ? sales_order_details.total_items_dropped + sales_order_item_details.quantity_ordered : sales_order_details.total_items_dropped;
			const order_status = sales_order_details.total_items_ordered === total_items_dropped ? completed : sales_order_details.order_status;

			if (sales_order_item_details.quantity_ordered === sales_order_item_details.quantity_supplied) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Quantity supplied is already equal to quantity ordered" }, null);
			}

			if (sales_order_item_details.quantity_ordered && quantity_supplied > sales_order_item_details.quantity_ordered) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Invalid quantity supplied, greater than quantity ordered" }, null);
			}

			if (product_details.is_inventory_tracked && sales_order_item_details.quantity_ordered === quantity_supplied) {
				const finished_good_details = await FINISHED_GOOD.findOne({
					attributes: { exclude: ['id'] },
					where: { product_unique_id: product_details.unique_id }
				});

				if (!finished_good_details) {
					return BadRequestError(res, { unique_id: user_unique_id, text: "Sales Order Item - Product - Finished Good Not found" }, null);
				}

				const new_product_quantity = product_details.quantity && product_details.quantity > 0 && sales_order_item_details.quantity_ordered > 0 ? product_details.quantity - sales_order_item_details.quantity_ordered : product_details.quantity;
				const new_finished_good_current_quantity = finished_good_details.current_quantity && finished_good_details.current_quantity > 0 && sales_order_item_details.quantity_ordered > 0 ? finished_good_details.current_quantity - sales_order_item_details.quantity_ordered : finished_good_details.current_quantity;

				await SALES_ORDER_ITEM.sequelize?.transaction(async (transaction) => {
					const response = await SALES_ORDER_ITEM.update(
						{
							quantity_supplied: quantity_supplied
						}, {
							where: {
								unique_id: payload.unique_id,
								status: default_status
							},
							transaction
						}
					);

					const responseSalesOrder = await SALES_ORDER.update(
						{
							total_items_dropped, 
							order_status
						}, {
							where: {
								unique_id: sales_order_item_details.sales_order_unique_id,
								status: default_status
							},
							transaction
						}
					);

					const responseProduct = await PRODUCT.update( { quantity: new_product_quantity }, { where: { unique_id: product_details.unique_id, status: default_status }, transaction } );
					const responseFinishedGood = await FINISHED_GOOD.update( { current_quantity: new_finished_good_current_quantity }, { where: { unique_id: finished_good_details.unique_id, status: default_status }, transaction } );
					const responseFinishedGoodStockLog = await FINISHED_GOOD_STOCK_LOG.create({
						unique_id: uuidv4(),
						finished_good_unique_id: finished_good_details.unique_id,
						movement_type: stock_log_movement_type.out,
						quantity: sales_order_item_details.quantity_ordered,
						unit_cost: null,
						quantity_after: new_finished_good_current_quantity,
						source_module: "Sales Order Item",
						reference: payload.unique_id,
						created_by: user_unique_id,
						status: default_status
					}, { transaction });

					addLog("Sales Orders", user_unique_id, "Updated Sales Order Item Quantity Supplied", payload);
					if (response[0] > 0 && responseSalesOrder[0] > 0 && responseProduct[0] > 0 && responseFinishedGood[0] > 0 && responseFinishedGoodStockLog) {
						return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
					} else {
						throw new Error("Sales Order not found");
					}
				});
			} else {
				await SALES_ORDER_ITEM.sequelize?.transaction(async (transaction) => {
					const response = await SALES_ORDER_ITEM.update(
						{
							quantity_supplied: quantity_supplied
						}, {
							where: {
								unique_id: payload.unique_id,
								status: default_status
							},
							transaction
						}
					);
	
					const responseSalesOrder = await SALES_ORDER.update(
						{
							total_items_dropped, 
							order_status
						}, {
							where: {
								unique_id: sales_order_item_details.sales_order_unique_id,
								status: default_status
							},
							transaction
						}
					);
	
					addLog("Sales Orders", user_unique_id, "Updated Sales Order Item Quantity Supplied", payload);
					if (response[0] > 0 && responseSalesOrder[0] > 0) {
						return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
					} else {
						throw new Error("Sales Order not found");
					}
				});
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async deleteSalesOrderItem(req: IGetAuthTypesRequest, res: Response) {
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
			const supply_log_details = await SUPPLY_LOG.findOne({
				attributes: { exclude: ['id'] },
				where: { sales_order_item_unique_id: payload.unique_id }
			});

			if (supply_log_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Unable to delete order item, already active in supply log" }, null);
			}

			await SALES_ORDER_ITEM.sequelize?.transaction(async (transaction) => {
				const response = await SALES_ORDER_ITEM.destroy(
					{
						where: {
							unique_id: payload.unique_id,
							status: default_status
						},
						transaction
					}
				);

				addLog("Sales Orders", user_unique_id, "Deleted Sales Order Item", payload);
				if (response > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Sales Order Item was deleted successfully!" }, null);
				} else {
					throw new Error("Error deleting record");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}
};
