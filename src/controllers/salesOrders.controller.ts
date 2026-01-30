import { Request, Response } from "express";
import { Op } from "sequelize";
import { validationResult, matchedData } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import SALES_ORDER, { ISalesOrder } from "../models/salesOrders.model";
import SALES_ORDER_ITEM, { ISalesOrderItem } from "../models/salesOrderItems.model";
import DELIVERY_ASSIGNMENT, { IDeliveryAssignment } from "../models/deliveryAssignments.model";
import SUPPLY_LOG, { ISupplyLog } from "../models/supplyLogs.model";
import VEHICLE, { IVehicle } from "../models/vehicles.model";
import PRODUCT, { IProduct } from "../models/products.model";
import CATEGORY, { ICategory } from "../models/categories.model";
import CUSTOMER, { ICustomer } from "../models/customers.model";
import BUSINESS_RULE, { IBusinessRule } from "../models/businessRules.model";
// import DISCOUNT, { IDiscount } from "../models/discounts.model";
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
	dynamicWhere, pending, approved, processing, completed, return_products_from_sale_order_items, return_bulk_sales_order_items_array, calculate_total_price_amount, 
	random_uuid, calculate_total_items_ordered, zero, business_rules, vehicle_availability_status, delivery_assignment_status
} from '../config/config';

export default class SalesOrderController {
	async getSalesOrders(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await SALES_ORDER.count();
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await SALES_ORDER.findAndCountAll({
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
						model: CUSTOMER,
						attributes: ['unique_id', 'reference', 'type', 'name', 'email', 'phone_number', 'alt_phone_number', 'balance', 'profile_image']
					}, 
					// {
					// 	model: DISCOUNT,
					// 	attributes: ['unique_id', 'discount_amount', 'reason']
					// }, 
					{
						model: SALES_ORDER_ITEM,
						attributes: ['unique_id', 'product_name', 'unit_price', 'quantity_ordered', 'quantity_supplied', 'total_price'], 
						include: [
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
						]
					}
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Sales Orders", user_unique_id, "Queried Sales Orders", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Sales Orders Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Sales Orders loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getSalesOrder(req: IGetAuthTypesRequest, res: Response) {
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
			const response = await SALES_ORDER.findOne({
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
						model: CUSTOMER,
						attributes: ['unique_id', 'reference', 'type', 'name', 'email', 'phone_number', 'alt_phone_number', 'balance', 'profile_image']
					}, 
					// {
					// 	model: DISCOUNT,
					// 	attributes: ['unique_id', 'discount_amount', 'reason']
					// }, 
					{
						model: SALES_ORDER_ITEM,
						attributes: ['unique_id', 'product_name', 'unit_price', 'quantity_ordered', 'quantity_supplied', 'total_price'], 
						include: [
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

	async searchSalesOrders(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await SALES_ORDER.count({
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
			const response = await SALES_ORDER.findAndCountAll({
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
						model: CUSTOMER,
						attributes: ['unique_id', 'reference', 'type', 'name', 'email', 'phone_number', 'alt_phone_number', 'balance', 'profile_image']
					}, 
					// {
					// 	model: DISCOUNT,
					// 	attributes: ['unique_id', 'discount_amount', 'reason']
					// }, 
					{
						model: SALES_ORDER_ITEM,
						attributes: ['unique_id', 'product_name', 'unit_price', 'quantity_ordered', 'quantity_supplied', 'total_price'], 
						include: [
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
						]
					}
				],
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Sales Orders", user_unique_id, "Searched Sales Orders", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Sales Orders Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Sales Orders loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getSalesOrdersSpecifically(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await SALES_ORDER.count({ where: dynamicWhere(queryParams) });
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await SALES_ORDER.findAndCountAll({
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
						model: CUSTOMER,
						attributes: ['unique_id', 'reference', 'type', 'name', 'email', 'phone_number', 'alt_phone_number', 'balance', 'profile_image']
					}, 
					// {
					// 	model: DISCOUNT,
					// 	attributes: ['unique_id', 'discount_amount', 'reason']
					// }, 
					{
						model: SALES_ORDER_ITEM,
						attributes: ['unique_id', 'product_name', 'unit_price', 'quantity_ordered', 'quantity_supplied', 'total_price'], 
						include: [
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
						]
					}
				],
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Sales Orders", user_unique_id, "Queried Sales Orders specifically", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Sales Orders Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Sales Orders loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async filterSalesOrdersSpecifically(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await SALES_ORDER.count({
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
			const response = await SALES_ORDER.findAndCountAll({
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
						model: CUSTOMER,
						attributes: ['unique_id', 'reference', 'type', 'name', 'email', 'phone_number', 'alt_phone_number', 'balance', 'profile_image']
					}, 
					// {
					// 	model: DISCOUNT,
					// 	attributes: ['unique_id', 'discount_amount', 'reason']
					// }, 
					{
						model: SALES_ORDER_ITEM,
						attributes: ['unique_id', 'product_name', 'unit_price', 'quantity_ordered', 'quantity_supplied', 'total_price'], 
						include: [
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
						]
					}
				],
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Sales Orders", user_unique_id, "Filtered Sales Orders specifically", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Sales Orders Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Sales Orders loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async publicGetSalesOrders(req: IGetAuthTypesRequest, res: Response) {
		const queryParams: IPagination = req.query;

		const total_records = await SALES_ORDER.count({ where: { status: default_status } });
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await SALES_ORDER.findAndCountAll({
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
						model: CUSTOMER,
						attributes: ['unique_id', 'reference', 'type', 'name', 'email', 'phone_number', 'alt_phone_number', 'balance', 'profile_image']
					}, 
					// {
					// 	model: DISCOUNT,
					// 	attributes: ['unique_id', 'discount_amount', 'reason']
					// }, 
					{
						model: SALES_ORDER_ITEM,
						attributes: ['unique_id', 'product_name', 'unit_price', 'quantity_ordered', 'quantity_supplied', 'total_price'], 
						include: [
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
				return SuccessResponse(res, { unique_id: anonymous, text: "Sales Orders Not found" }, []);
			} else {
				// return SuccessResponse(res, { unique_id: anonymous, text: "Sales Orders loaded" }, { ...response, pages: pagination.pages });
				return SuccessResponse(res, { unique_id: anonymous, text: "Sales Orders loaded" }, { ...response });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async publicGetSalesOrder(req: IGetAuthTypesRequest, res: Response) {
		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: anonymous, text: "Validation Error Occured" }, errors.array())
		}

		try {
			const response = await SALES_ORDER.findOne({
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
						model: CUSTOMER,
						attributes: ['unique_id', 'reference', 'type', 'name', 'email', 'phone_number', 'alt_phone_number', 'balance', 'profile_image']
					}, 
					// {
					// 	model: DISCOUNT,
					// 	attributes: ['unique_id', 'discount_amount', 'reason']
					// }, 
					{
						model: SALES_ORDER_ITEM,
						attributes: ['unique_id', 'product_name', 'unit_price', 'quantity_ordered', 'quantity_supplied', 'total_price'], 
						include: [
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

	async publicSearchSalesOrders(req: IGetAuthTypesRequest, res: Response) {
		const queryParams: IPagination = req.query;

		const total_records = await SALES_ORDER.count({
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
			const response = await SALES_ORDER.findAndCountAll({
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
						model: CUSTOMER,
						attributes: ['unique_id', 'reference', 'type', 'name', 'email', 'phone_number', 'alt_phone_number', 'balance', 'profile_image']
					}, 
					// {
					// 	model: DISCOUNT,
					// 	attributes: ['unique_id', 'discount_amount', 'reason']
					// }, 
					{
						model: SALES_ORDER_ITEM,
						attributes: ['unique_id', 'product_name', 'unit_price', 'quantity_ordered', 'quantity_supplied', 'total_price'], 
						include: [
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
				return SuccessResponse(res, { unique_id: anonymous, text: "Sales Orders Not found" }, []);
			} else {
				// return SuccessResponse(res, { unique_id: anonymous, text: "Sales Orders loaded" }, { ...response, pages: pagination.pages });
				return SuccessResponse(res, { unique_id: anonymous, text: "Sales Orders loaded" }, { ...response });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async addSalesOrder(req: IGetAuthTypesRequest, res: Response) {
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
			const products_alt = return_products_from_sale_order_items(payload.items);

			const product_details = await PRODUCT.findOne({
				attributes: { exclude: ['id'] },
				where: {
					unique_id: {
						[Op.in]: products_alt
					},
					status: default_status
				}
			});

			if (!product_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "One or more products not found" }, null);
			}

			const business_rule_details = await BUSINESS_RULE.findOne({
				attributes: { exclude: ['id'] },
				where: {
					rule_key: business_rules.OUTSIDE_TOWN_MARKUP_PERCENT
				}
			});

			const products = await PRODUCT.findAll({
				attributes: { exclude: ['id'] },
				where: {
					unique_id: {
						[Op.in]: products_alt
					},
					status: default_status
				}
			});

			const sales_order_unique_id = uuidv4();
			const reference = random_uuid(4);
			const data = { sales_order_unique_id };
			const bulkSalesItems = return_bulk_sales_order_items_array(products, payload.items, data) || [];
			const outside_town_surcharge = payload.outside_town && business_rule_details && business_rule_details.rule_value ? (calculate_total_price_amount(bulkSalesItems) * business_rule_details.rule_value) / 100  : 0;
			const total_amount = outside_town_surcharge > 0 ? outside_town_surcharge + calculate_total_price_amount(bulkSalesItems) : calculate_total_price_amount(bulkSalesItems);
			// const discount_amount = payload.discount_amount ? parseInt(payload.discount_amount) : 0;
			const discount_amount = 0;
			const amount_payable = discount_amount > 0 ? total_amount - discount_amount : total_amount;
			const total_items_ordered = calculate_total_items_ordered(bulkSalesItems);

			await SALES_ORDER.sequelize?.transaction(async (transaction) => {
				const salesOrderResponse = await SALES_ORDER.create({
					unique_id: sales_order_unique_id,
					customer_unique_id: payload.customer_unique_id,
					reference, 
					total_amount,
					discount_amount: discount_amount,
					// discount_reason: payload.discount_reason ? payload.discount_reason : null,
					discount_reason: null,
					outside_town: payload.outside_town,
					outside_town_location: payload.outside_town_location ? payload.outside_town_location : null,
					estimated_trip_liters: payload.estimated_trip_liters ? parseInt(payload.estimated_trip_liters) : null,
					outside_town_surcharge, 
					amount_payable, 
					total_items_ordered,
					total_items_dropped: zero,
					notes: payload.notes ? payload.notes : null,
					order_status: pending,
					created_by: user_unique_id,
					approved_by: null,
					status: default_status
				}, { transaction });

				const sales_order_items = await SALES_ORDER_ITEM.bulkCreate(bulkSalesItems, { transaction });

				addLog("Sales Orders", user_unique_id, "Added Sales Order", payload);
				if (salesOrderResponse && sales_order_items.length > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Sales Order created successfully!" }, { unique_id: sales_order_unique_id, reference });
				} else {
					throw new Error("Error adding sales order");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async updateSalesOrderDiscount(req: IGetAuthTypesRequest, res: Response) {
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
			const sales_order_details = await SALES_ORDER.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!sales_order_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Sales Order Not found" }, null);
			}

			const discount_amount = payload.discount_amount ? parseInt(payload.discount_amount) : 0;
			const new_amount_payable = sales_order_details.total_amount && discount_amount > 0 ? sales_order_details.total_amount - discount_amount : sales_order_details.total_amount;

			await SALES_ORDER.sequelize?.transaction(async (transaction) => {
				const response = await SALES_ORDER.update(
					{
						amount_payable: new_amount_payable,
						discount_amount: discount_amount,
						discount_reason: payload.discount_reason ? payload.discount_reason : null,
					}, {
						where: {
							unique_id: payload.unique_id,
							status: default_status
						},
						transaction
					}
				);

				addLog("Sales Orders", user_unique_id, "Updated Sales Order Discount", payload);
				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
				} else {
					throw new Error("Sales Order not found");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async updateSalesOrderEstimatedTripLiters(req: IGetAuthTypesRequest, res: Response) {
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
			const sales_order_details = await SALES_ORDER.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!sales_order_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Sales Order Not found" }, null);
			}

			await SALES_ORDER.sequelize?.transaction(async (transaction) => {
				const response = await SALES_ORDER.update(
					{
						estimated_trip_liters: payload.estimated_trip_liters ? payload.estimated_trip_liters : null,
					}, {
						where: {
							unique_id: payload.unique_id,
							status: default_status
						},
						transaction
					}
				);

				addLog("Sales Orders", user_unique_id, "Updated Sales Order Estimated Trip Liters", payload);
				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
				} else {
					throw new Error("Sales Order not found");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async updateSalesOrderOutsideTownDetails(req: IGetAuthTypesRequest, res: Response) {
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
			const sales_order_details = await SALES_ORDER.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!sales_order_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Sales Order Not found" }, null);
			}

			const business_rule_details = await BUSINESS_RULE.findOne({
				attributes: { exclude: ['id'] },
				where: {
					rule_key: business_rules.OUTSIDE_TOWN_MARKUP_PERCENT
				}
			});

			// const outside_town_surcharge = payload.outside_town_surcharge ? parseInt(payload.outside_town_surcharge) : 0;
			const old_total_amount = sales_order_details.total_amount && sales_order_details.outside_town_surcharge && sales_order_details.outside_town_surcharge > 0 ? sales_order_details.total_amount - sales_order_details.outside_town_surcharge : sales_order_details.total_amount;
			const outside_town_surcharge = payload.outside_town && business_rule_details && business_rule_details.rule_value ? ((old_total_amount || 0) * business_rule_details.rule_value) / 100  : 0;
			const new_total_amount = old_total_amount && outside_town_surcharge > 0 ? old_total_amount + outside_town_surcharge : old_total_amount;
			const new_amount_payable = new_total_amount && outside_town_surcharge > 0 && sales_order_details.discount_amount && sales_order_details.discount_amount > 0 ? new_total_amount - sales_order_details.discount_amount : sales_order_details.amount_payable;

			await SALES_ORDER.sequelize?.transaction(async (transaction) => {
				const response = await SALES_ORDER.update(
					{
						total_amount: new_total_amount,
						amount_payable: new_amount_payable,
						outside_town: payload.outside_town,
						outside_town_location: payload.outside_town_location ? payload.outside_town_location : null,
						outside_town_surcharge: outside_town_surcharge,
					}, {
						where: {
							unique_id: payload.unique_id,
							status: default_status
						},
						transaction
					}
				);

				addLog("Sales Orders", user_unique_id, "Updated Sales Order Outside Town Details", payload);
				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
				} else {
					throw new Error("Sales Order not found");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async updateSalesOrderNotes(req: IGetAuthTypesRequest, res: Response) {
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
			const sales_order_details = await SALES_ORDER.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!sales_order_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Sales Order Not found" }, null);
			}

			await SALES_ORDER.sequelize?.transaction(async (transaction) => {
				const response = await SALES_ORDER.update(
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

				addLog("Sales Orders", user_unique_id, "Updated Sales Order Notes", payload);
				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
				} else {
					throw new Error("Sales Order not found");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async updateSalesOrderTotalItemsDropped(req: IGetAuthTypesRequest, res: Response) {
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
			const sales_order_details = await SALES_ORDER.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!sales_order_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Sales Order Not found" }, null);
			}

			if (sales_order_details.order_status === completed) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Sales Order already completed" }, null);
			}

			const total_items_dropped = parseInt(payload.total_items_dropped);
			const order_status = sales_order_details.total_items_ordered === total_items_dropped ? completed : sales_order_details.order_status;

			await SALES_ORDER.sequelize?.transaction(async (transaction) => {
				const response = await SALES_ORDER.update(
					{
						total_items_dropped,
						order_status
					}, {
						where: {
							unique_id: payload.unique_id,
							status: default_status
						},
						transaction
					}
				);

				addLog("Sales Orders", user_unique_id, `Updated Sales Order Total Items Dropped | Order Status: ${order_status}`, payload);
				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
				} else {
					throw new Error("Sales Order not found");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async approveSalesOrder(req: IGetAuthTypesRequest, res: Response) {
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
			const sales_order_details = await SALES_ORDER.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!sales_order_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Sales Order Not found" }, null);
			}

			if (sales_order_details && sales_order_details.order_status !== pending) {
				return BadRequestError(res, { unique_id: user_unique_id, text: `Invalid Pending Sales Order, current status - ${sales_order_details.order_status}` }, null);
			}

			if (sales_order_details.approved_by !== null) {
				return BadRequestError(res, { unique_id: user_unique_id, text: `Sales Order approved already` }, null);
			}

			const available_vehicle_details = await VEHICLE.findOne({
				attributes: { exclude: ['id'] },
				where: { 
					benchmark_fuel_liters: {
						[Op.lte]: sales_order_details.estimated_trip_liters
					}, 
					availability_status: vehicle_availability_status.available, 
					is_active: true_status
				}
			});

			// Implement available employee here for driver as well (probably get it from the assigned driver when implemented in the vehicle model)

			const delivery_assignment_details = await DELIVERY_ASSIGNMENT.findOne({
				attributes: { exclude: ['id'] },
				where: { sales_order_unique_id: sales_order_details.unique_id, assignment_status: delivery_assignment_status.pending }
			});

			if (delivery_assignment_details) {
				await SALES_ORDER.sequelize?.transaction(async (transaction) => {
					const response = await SALES_ORDER.update(
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

					const deliveryAssignmentResponse = await DELIVERY_ASSIGNMENT.update(
						{
							vehicle_unique_id: available_vehicle_details ? available_vehicle_details.unique_id : null,
							// driver_unique_id: available_driver_details ? available_driver_details.unique_id : null,
							assigned_at: timestamp_str_alt(new Date()),
							auto_assigned: true_status,
							updated_by: user_unique_id,
						}, {
							where: {
								unique_id: delivery_assignment_details.unique_id,
								status: default_status
							},
							transaction
						}
					);

					const deliveryAssignmentCancelResponse = await DELIVERY_ASSIGNMENT.update(
						{
							assignment_status: delivery_assignment_status.cancelled,
							updated_by: user_unique_id,
						}, {
							where: {
								assignment_status: { 
									[Op.notIn]: [delivery_assignment_status.pending, delivery_assignment_status.completed]
								},
								sales_order_unique_id: sales_order_details.unique_id,
								status: default_status
							},
							transaction
						}
					);

					addLog("Sales Orders", user_unique_id, "Approved Sales Order", payload);
					if (response[0] > 0 && deliveryAssignmentResponse[0] > 0) {
						return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
					} else {
						throw new Error("Sales Order not found");
					}
				});
			} else {
				await SALES_ORDER.sequelize?.transaction(async (transaction) => {
					const response = await SALES_ORDER.update(
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

					const deliveryAssignmentCancelResponse = await DELIVERY_ASSIGNMENT.update(
						{
							assignment_status: delivery_assignment_status.cancelled,
							updated_by: user_unique_id,
						}, {
							where: {
								assignment_status: { 
									[Op.notIn]: [delivery_assignment_status.pending, delivery_assignment_status.completed]
								},
								sales_order_unique_id: sales_order_details.unique_id,
								status: default_status
							},
							transaction
						}
					);

					const deliveryAssignmentResponse = await DELIVERY_ASSIGNMENT.create({
						unique_id: uuidv4(),
						sales_order_unique_id: sales_order_details.unique_id,
						vehicle_unique_id: available_vehicle_details ? available_vehicle_details.unique_id : null,
						// driver_unique_id: available_driver_details ? available_driver_details.unique_id : null,
						scheduled_date: timestamp_str_alt(new Date()),
						assigned_at: timestamp_str_alt(new Date()),
						auto_assigned: true_status,
						notes: payload.notes ? payload.notes : null,
						assignment_status: delivery_assignment_status.pending,
						updated_by: user_unique_id,
						status: default_status
					}, { transaction });
	
					addLog("Sales Orders", user_unique_id, "Approved Sales Order", payload);
					if (response[0] > 0 && deliveryAssignmentResponse) {
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

	async completeSalesOrder(req: IGetAuthTypesRequest, res: Response) {
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

		// if (!acl_details.elevated_role) {
		// 	return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized elevated access to edit record content" }, null);
		// }

		try {
			const sales_order_details = await SALES_ORDER.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!sales_order_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Sales Order Not found" }, null);
			}

			if (sales_order_details && sales_order_details.order_status !== processing) {
				return BadRequestError(res, { unique_id: user_unique_id, text: `Invalid Processing Sales Order, current status - ${sales_order_details.order_status}` }, null);
			}
			
			// const sum_quantity_supplied = await SALES_ORDER_ITEM.sum("quantity_supplied", { where: { sales_order_unique_id: sales_order_details.unique_id } });
			
			// if (sales_order_details.total_items_ordered !== sales_order_details.total_items_dropped) {
			// 	return BadRequestError(res, { unique_id: user_unique_id, text: `Items dropped is not equal to items ordered (${sales_order_details.total_items_dropped}/${sales_order_details.total_items_ordered})` }, null);
			// }
			
			// if (sum_quantity_supplied !== sales_order_details.total_items_dropped) {
			// 	return BadRequestError(res, { unique_id: user_unique_id, text: `Items supplied is not equal to items dropped (${sum_quantity_supplied}/${sales_order_details.total_items_dropped})` }, null);
			// }

			const delivery_assignment_details = await DELIVERY_ASSIGNMENT.findOne({
				attributes: { exclude: ['id'] },
				where: { sales_order_unique_id: sales_order_details.unique_id, assignment_status: delivery_assignment_status.completed }
			});

			if (!delivery_assignment_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Unable to update sales order, No completed delivery for this sales order yet" }, null);
			}

			const supply_log_details = await SUPPLY_LOG.findOne({
				attributes: { exclude: ['id'] },
				where: { sales_order_unique_id: sales_order_details.unique_id }
			});

			if (!supply_log_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Unable to update sales order, No supply logs for this sales order yet" }, null);
			}
			
			await SALES_ORDER.sequelize?.transaction(async (transaction) => {
				const response = await SALES_ORDER.update(
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

				addLog("Sales Orders", user_unique_id, "Completed Sales Order", payload);
				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
				} else {
					throw new Error("Sales Order not found");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async deleteSalesOrder(req: IGetAuthTypesRequest, res: Response) {
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
			const sales_order_details = await SALES_ORDER.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!sales_order_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Sales Order Not found" }, null);
			}

			if (sales_order_details && sales_order_details.order_status !== pending) {
				return BadRequestError(res, { unique_id: user_unique_id, text: `Unable to delete sales order, current status - ${sales_order_details.order_status}` }, null);
			}

			await SALES_ORDER.sequelize?.transaction(async (transaction) => {
				const response = await SALES_ORDER.destroy(
					{
						where: {
							unique_id: payload.unique_id,
							status: default_status
						},
						transaction
					}
				);

				addLog("Sales Orders", user_unique_id, "Deleted Sales Order", payload);
				if (response > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Sales Order was deleted successfully!" }, null);
				} else {
					throw new Error("Error deleting record");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}
};
