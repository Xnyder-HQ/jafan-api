import { Request, Response } from "express";
import { Op } from "sequelize";
import { validationResult, matchedData } from 'express-validator';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import SUPPLY_LOG, { ISupplyLog } from "../models/supplyLogs.model";
import FINISHED_GOOD, { IFinishedGood } from "../models/finishedGoods.model";
import SALES_ORDER, { ISalesOrder } from "../models/salesOrders.model";
import SALES_ORDER_ITEM, { ISalesOrderItem } from "../models/salesOrderItems.model";
import DELIVERY_ASSIGNMENT, { IDeliveryAssignment } from "../models/deliveryAssignments.model";
import CUSTOMER, { ICustomer } from "../models/customers.model";
import VEHICLE, { IVehicle } from "../models/vehicles.model";
import PRODUCT, { IProduct } from "../models/products.model";
import CATEGORY, { ICategory } from "../models/categories.model";
import FINISHED_GOOD_STOCK_LOG, { IFinishedGoodStockLog } from "../models/finishedGoodStockLogs.model";
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
} from '../config/config';
import { deleteImage } from '../middleware/uploads';

dotenv.config();

const { clouder_key, cloudy_name, cloudy_key, cloudy_secret } = process.env;

export default class SupplyLogController {
	async getSupplyLogs(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await SUPPLY_LOG.count();
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await SUPPLY_LOG.findAndCountAll({
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
						model: CUSTOMER,
						attributes: ['unique_id', 'reference', 'type', 'name', 'email', 'phone_number', 'alt_phone_number', 'balance', 'profile_image']
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
					}, 
					{
						model: SALES_ORDER_ITEM,
						attributes: ['unique_id', 'product_name', 'unit_price', 'quantity_ordered', 'quantity_supplied', 'total_price'], 
					}, 
					{
						model: SALES_ORDER,
						attributes: ['unique_id', 'reference', 'total_amount', 'discount_amount', 'outside_town', 'outside_town_location', 'estimated_trip_liters', 'outside_town_surcharge', 'amount_payable', 'total_items_ordered', 'total_items_dropped', 'order_status'], 
					},
					{
						model: VEHICLE,
						attributes: ['unique_id', 'reference', 'code', 'plate_number', 'type', 'capacity_unit', 'capacity_value', 'fuel_type', 'benchmark_fuel_liters', 'expected_trips_per_benchmark', 'purchase_date', 'availability_status', 'is_active']
					}, 
					{
						model: DELIVERY_ASSIGNMENT,
						attributes: ['unique_id', 'scheduled_date', 'assigned_at', 'auto_assigned', 'started_at', 'completed_at', 'assignment_status'], 
					}, 
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Supply Logs", user_unique_id, "Queried Supply Logs", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Supply Logs Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Supply Logs loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getSupplyLog(req: IGetAuthTypesRequest, res: Response) {
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
			const response = await SUPPLY_LOG.findOne({
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
						model: CUSTOMER,
						attributes: ['unique_id', 'reference', 'type', 'name', 'email', 'phone_number', 'alt_phone_number', 'balance', 'profile_image']
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
					}, 
					{
						model: SALES_ORDER_ITEM,
						attributes: ['unique_id', 'product_name', 'unit_price', 'quantity_ordered', 'quantity_supplied', 'total_price'], 
					}, 
					{
						model: SALES_ORDER,
						attributes: ['unique_id', 'reference', 'total_amount', 'discount_amount', 'outside_town', 'outside_town_location', 'estimated_trip_liters', 'outside_town_surcharge', 'amount_payable', 'total_items_ordered', 'total_items_dropped', 'order_status'], 
					},
					{
						model: VEHICLE,
						attributes: ['unique_id', 'reference', 'code', 'plate_number', 'type', 'capacity_unit', 'capacity_value', 'fuel_type', 'benchmark_fuel_liters', 'expected_trips_per_benchmark', 'purchase_date', 'availability_status', 'is_active']
					}, 
					{
						model: DELIVERY_ASSIGNMENT,
						attributes: ['unique_id', 'scheduled_date', 'assigned_at', 'auto_assigned', 'started_at', 'completed_at', 'assignment_status'], 
					},
				], 
			});

			addLog("Supply Logs", user_unique_id, "Queried Supply Log", queryParams);
			if (!response) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Supply Log Not found" }, null);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Supply Log loaded" }, response);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async searchSupplyLogs(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await SUPPLY_LOG.count({
			where: {
				[Op.or]: [
					{
						notes: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					},
					{
						site_address: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					}
				]
			}
		});
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await SUPPLY_LOG.findAndCountAll({
				attributes: { exclude: ['id'] },
				where: {
					[Op.or]: [
						{
							notes: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
						},
						{
							site_address: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
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
						model: CUSTOMER,
						attributes: ['unique_id', 'reference', 'type', 'name', 'email', 'phone_number', 'alt_phone_number', 'balance', 'profile_image']
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
					}, 
					{
						model: SALES_ORDER_ITEM,
						attributes: ['unique_id', 'product_name', 'unit_price', 'quantity_ordered', 'quantity_supplied', 'total_price'], 
					}, 
					{
						model: SALES_ORDER,
						attributes: ['unique_id', 'reference', 'total_amount', 'discount_amount', 'outside_town', 'outside_town_location', 'estimated_trip_liters', 'outside_town_surcharge', 'amount_payable', 'total_items_ordered', 'total_items_dropped', 'order_status'], 
					},
					{
						model: VEHICLE,
						attributes: ['unique_id', 'reference', 'code', 'plate_number', 'type', 'capacity_unit', 'capacity_value', 'fuel_type', 'benchmark_fuel_liters', 'expected_trips_per_benchmark', 'purchase_date', 'availability_status', 'is_active']
					}, 
					{
						model: DELIVERY_ASSIGNMENT,
						attributes: ['unique_id', 'scheduled_date', 'assigned_at', 'auto_assigned', 'started_at', 'completed_at', 'assignment_status'], 
					},
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Supply Logs", user_unique_id, "Searched Supply Logs", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Supply Logs Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Supply Logs loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getSupplyLogsSpecifically(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await SUPPLY_LOG.count({ where: dynamicWhere(queryParams) });
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await SUPPLY_LOG.findAndCountAll({
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
						model: CUSTOMER,
						attributes: ['unique_id', 'reference', 'type', 'name', 'email', 'phone_number', 'alt_phone_number', 'balance', 'profile_image']
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
					}, 
					{
						model: SALES_ORDER_ITEM,
						attributes: ['unique_id', 'product_name', 'unit_price', 'quantity_ordered', 'quantity_supplied', 'total_price'], 
					}, 
					{
						model: SALES_ORDER,
						attributes: ['unique_id', 'reference', 'total_amount', 'discount_amount', 'outside_town', 'outside_town_location', 'estimated_trip_liters', 'outside_town_surcharge', 'amount_payable', 'total_items_ordered', 'total_items_dropped', 'order_status'], 
					},
					{
						model: VEHICLE,
						attributes: ['unique_id', 'reference', 'code', 'plate_number', 'type', 'capacity_unit', 'capacity_value', 'fuel_type', 'benchmark_fuel_liters', 'expected_trips_per_benchmark', 'purchase_date', 'availability_status', 'is_active']
					}, 
					{
						model: DELIVERY_ASSIGNMENT,
						attributes: ['unique_id', 'scheduled_date', 'assigned_at', 'auto_assigned', 'started_at', 'completed_at', 'assignment_status'], 
					},
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Supply Logs", user_unique_id, "Queried Supply Logs specifically", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Supply Logs Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Supply Logs loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async filterSupplyLogsSpecifically(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await SUPPLY_LOG.count({
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
			const response = await SUPPLY_LOG.findAndCountAll({
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
						model: CUSTOMER,
						attributes: ['unique_id', 'reference', 'type', 'name', 'email', 'phone_number', 'alt_phone_number', 'balance', 'profile_image']
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
					}, 
					{
						model: SALES_ORDER_ITEM,
						attributes: ['unique_id', 'product_name', 'unit_price', 'quantity_ordered', 'quantity_supplied', 'total_price'], 
					}, 
					{
						model: SALES_ORDER,
						attributes: ['unique_id', 'reference', 'total_amount', 'discount_amount', 'outside_town', 'outside_town_location', 'estimated_trip_liters', 'outside_town_surcharge', 'amount_payable', 'total_items_ordered', 'total_items_dropped', 'order_status'], 
					},
					{
						model: VEHICLE,
						attributes: ['unique_id', 'reference', 'code', 'plate_number', 'type', 'capacity_unit', 'capacity_value', 'fuel_type', 'benchmark_fuel_liters', 'expected_trips_per_benchmark', 'purchase_date', 'availability_status', 'is_active']
					}, 
					{
						model: DELIVERY_ASSIGNMENT,
						attributes: ['unique_id', 'scheduled_date', 'assigned_at', 'auto_assigned', 'started_at', 'completed_at', 'assignment_status'], 
					},
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Supply Logs", user_unique_id, "Filtered Supply Logs specifically", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Supply Logs Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Supply Logs loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async publicGetSupplyLogs(req: IGetAuthTypesRequest, res: Response) {
		const queryParams: IPagination = req.query;

		const total_records = await SUPPLY_LOG.count({ where: { status: default_status } });
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await SUPPLY_LOG.findAndCountAll({
				attributes: { exclude: ['id', 'status'] },
				where: { status: default_status },
				include: [
					{
						model: CUSTOMER,
						attributes: ['unique_id', 'reference', 'type', 'name', 'email', 'phone_number', 'alt_phone_number', 'balance', 'profile_image']
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
					}, 
					{
						model: SALES_ORDER_ITEM,
						attributes: ['unique_id', 'product_name', 'unit_price', 'quantity_ordered', 'quantity_supplied', 'total_price'], 
					}, 
					{
						model: SALES_ORDER,
						attributes: ['unique_id', 'reference', 'total_amount', 'discount_amount', 'outside_town', 'outside_town_location', 'estimated_trip_liters', 'outside_town_surcharge', 'amount_payable', 'total_items_ordered', 'total_items_dropped', 'order_status'], 
					},
					{
						model: VEHICLE,
						attributes: ['unique_id', 'reference', 'code', 'plate_number', 'type', 'capacity_unit', 'capacity_value', 'fuel_type', 'benchmark_fuel_liters', 'expected_trips_per_benchmark', 'purchase_date', 'availability_status', 'is_active']
					}, 
					{
						model: DELIVERY_ASSIGNMENT,
						attributes: ['unique_id', 'scheduled_date', 'assigned_at', 'auto_assigned', 'started_at', 'completed_at', 'assignment_status'], 
					},
				], 
				order: [
					[orderBy, sortBy]
				],
				// offset: pagination.start,
				// limit: pagination.limit
			});

			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: anonymous, text: "Supply Logs Not found" }, []);
			} else {
				// return SuccessResponse(res, { unique_id: anonymous, text: "Supply Logs loaded" }, { ...response, pages: pagination.pages });
				return SuccessResponse(res, { unique_id: anonymous, text: "Supply Logs loaded" }, { ...response });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async publicGetSupplyLog(req: IGetAuthTypesRequest, res: Response) {
		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: anonymous, text: "Validation Error Occured" }, errors.array())
		}

		try {
			const response = await SUPPLY_LOG.findOne({
				attributes: { exclude: ['id', 'status'] },
				where: { ...payload }, 
				include: [
					{
						model: CUSTOMER,
						attributes: ['unique_id', 'reference', 'type', 'name', 'email', 'phone_number', 'alt_phone_number', 'balance', 'profile_image']
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
					}, 
					{
						model: SALES_ORDER_ITEM,
						attributes: ['unique_id', 'product_name', 'unit_price', 'quantity_ordered', 'quantity_supplied', 'total_price'], 
					}, 
					{
						model: SALES_ORDER,
						attributes: ['unique_id', 'reference', 'total_amount', 'discount_amount', 'outside_town', 'outside_town_location', 'estimated_trip_liters', 'outside_town_surcharge', 'amount_payable', 'total_items_ordered', 'total_items_dropped', 'order_status'], 
					},
					{
						model: VEHICLE,
						attributes: ['unique_id', 'reference', 'code', 'plate_number', 'type', 'capacity_unit', 'capacity_value', 'fuel_type', 'benchmark_fuel_liters', 'expected_trips_per_benchmark', 'purchase_date', 'availability_status', 'is_active']
					}, 
					{
						model: DELIVERY_ASSIGNMENT,
						attributes: ['unique_id', 'scheduled_date', 'assigned_at', 'auto_assigned', 'started_at', 'completed_at', 'assignment_status'], 
					},
				], 
			});

			if (!response) {
				return SuccessResponse(res, { unique_id: anonymous, text: "Supply Log Not found" }, null);
			} else {
				return SuccessResponse(res, { unique_id: anonymous, text: "Supply Log loaded" }, response);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async publicSearchSupplyLogs(req: IGetAuthTypesRequest, res: Response) {
		const queryParams: IPagination = req.query;

		const total_records = await SUPPLY_LOG.count({
			where: {
				[Op.or]: [
					{
						notes: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					},
					{
						site_address: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					}
				]
			}
		});
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await SUPPLY_LOG.findAndCountAll({
				attributes: { exclude: ['id', 'status'] },
				where: {
					[Op.or]: [
						{
							notes: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
						},
						{
							site_address: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
						}
					]
				}, 
				include: [
					{
						model: CUSTOMER,
						attributes: ['unique_id', 'reference', 'type', 'name', 'email', 'phone_number', 'alt_phone_number', 'balance', 'profile_image']
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
					}, 
					{
						model: SALES_ORDER_ITEM,
						attributes: ['unique_id', 'product_name', 'unit_price', 'quantity_ordered', 'quantity_supplied', 'total_price'], 
					}, 
					{
						model: SALES_ORDER,
						attributes: ['unique_id', 'reference', 'total_amount', 'discount_amount', 'outside_town', 'outside_town_location', 'estimated_trip_liters', 'outside_town_surcharge', 'amount_payable', 'total_items_ordered', 'total_items_dropped', 'order_status'], 
					},
					{
						model: VEHICLE,
						attributes: ['unique_id', 'reference', 'code', 'plate_number', 'type', 'capacity_unit', 'capacity_value', 'fuel_type', 'benchmark_fuel_liters', 'expected_trips_per_benchmark', 'purchase_date', 'availability_status', 'is_active']
					}, 
					{
						model: DELIVERY_ASSIGNMENT,
						attributes: ['unique_id', 'scheduled_date', 'assigned_at', 'auto_assigned', 'started_at', 'completed_at', 'assignment_status'], 
					},
				], 
				order: [
					[orderBy, sortBy]
				],
				// offset: pagination.start,
				// limit: pagination.limit
			});

			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: anonymous, text: "Supply Logs Not found" }, []);
			} else {
				// return SuccessResponse(res, { unique_id: anonymous, text: "Supply Logs loaded" }, { ...response, pages: pagination.pages });
				return SuccessResponse(res, { unique_id: anonymous, text: "Supply Logs loaded" }, { ...response });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async addSupplyLog(req: IGetAuthTypesRequest, res: Response) {
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
			const supply_log_details = await SUPPLY_LOG.findOne({
				attributes: { exclude: ['id'] },
				where: {
					sales_order_item_unique_id: payload.sales_order_item_unique_id,
				}
			});

			if (supply_log_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Supply Log for Sales Order Item already exists" }, null);
			}

			const sales_order_item_details = await SALES_ORDER_ITEM.findOne({
				attributes: { exclude: ['id'] },
				where: {
					unique_id: payload.sales_order_item_unique_id,
				}
			});

			if (!sales_order_item_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Sales Order Item not found" }, null);
			}

			const sales_order_details = await SALES_ORDER.findOne({
				attributes: { exclude: ['id'] },
				where: {
					unique_id: sales_order_item_details.sales_order_unique_id,
				}
			});

			if (!sales_order_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Sales Order Item - Sales Order not found" }, null);
			}

			const delivery_assignment_details = await DELIVERY_ASSIGNMENT.findOne({
				attributes: { exclude: ['id'] },
				where: {
					sales_order_unique_id: sales_order_details.unique_id,
				}
			});

			if (!delivery_assignment_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Delivery Assignment not found" }, null);
			}

			const product_details = await PRODUCT.findOne({
				attributes: { exclude: ['id'] },
				where: {
					unique_id: sales_order_item_details.product_unique_id,
				}
			});

			if (!product_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Sales Order Item - Product not found" }, null);
			}

			const finished_good_details = await FINISHED_GOOD.findOne({
				attributes: { exclude: ['id'] },
				where: { product_unique_id: product_details.unique_id }
			});

			if (!finished_good_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Sales Order Item - Product - Finished Good Not found" }, null);
			}

			const vehicle_details = await VEHICLE.findOne({
				attributes: { exclude: ['id'] },
				where: {
					unique_id: delivery_assignment_details.vehicle_unique_id,
				}
			});

			if (!vehicle_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Delivery Assignment - Vehicle not found" }, null);
			}

			// Do for employee / driver here

			const customer_details = await CUSTOMER.findOne({
				attributes: { exclude: ['id'] },
				where: {
					unique_id: sales_order_details.customer_unique_id,
				}
			});

			if (!customer_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Sales Order - Customer not found" }, null);
			}

			const new_product_quantity = product_details.quantity && product_details.quantity > 0 && parseInt(payload.blocks_loaded) > 0 ? product_details.quantity - parseInt(payload.blocks_loaded) : product_details.quantity;
			const new_finished_good_current_quantity = finished_good_details.current_quantity && finished_good_details.current_quantity >= 0 && parseInt(payload.blocks_loaded) > 0 ? finished_good_details.current_quantity - parseInt(payload.blocks_loaded) : finished_good_details.current_quantity;
			
			const total_items_dropped = sales_order_details.total_items_dropped && sales_order_details.total_items_dropped >= 0 ? sales_order_details.total_items_dropped + parseInt(payload.blocks_dropped) : sales_order_details.total_items_dropped;
			
			const supply_log_unique_id = uuidv4();

			await SUPPLY_LOG.sequelize?.transaction(async (transaction) => {
				const supplyLogResponse = await SUPPLY_LOG.create({
					unique_id: supply_log_unique_id,
					finished_good_unique_id: finished_good_details.unique_id, 
					delivery_assignment_unique_id: delivery_assignment_details.unique_id,
					sales_order_unique_id: sales_order_details.unique_id,
					sales_order_item_unique_id: sales_order_item_details.unique_id,
					customer_unique_id: customer_details.unique_id,
					product_unique_id: product_details.unique_id,
					vehicle_unique_id: vehicle_details.unique_id,
					// driver_unique_id: driver_details.unique_id, // Uncomment when you implement employee module
					site_address: payload.site_address,
					delivery_date: payload.delivery_date,
					blocks_loaded: parseInt(payload.blocks_loaded),
					blocks_dropped: parseInt(payload.blocks_dropped),
					blocks_returned: parseInt(payload.blocks_returned),
					breakage_quantity: parseInt(payload.breakage_quantity),
					notes: payload.notes ? payload.notes : null,
					created_by: user_unique_id,
					status: default_status
				}, { transaction });

				const responseSalesOrderItem = await SALES_ORDER_ITEM.update( { quantity_supplied: parseInt(payload.blocks_dropped) }, { where: { unique_id: sales_order_item_details.unique_id, status: default_status }, transaction } );
				const responseSalesOrder = await SALES_ORDER.update( { total_items_dropped }, { where: { unique_id: sales_order_details.unique_id, status: default_status }, transaction } );
				const responseProduct = await PRODUCT.update( { quantity: new_product_quantity }, { where: { unique_id: product_details.unique_id, status: default_status }, transaction } );
				const responseFinishedGood = await FINISHED_GOOD.update( { current_quantity: new_finished_good_current_quantity }, { where: { unique_id: finished_good_details.unique_id, status: default_status }, transaction } );
				const responseFinishedGoodStockLogOut = await FINISHED_GOOD_STOCK_LOG.create({
					unique_id: uuidv4(),
					finished_good_unique_id: finished_good_details.unique_id,
					movement_type: stock_log_movement_type.out,
					quantity: parseInt(payload.blocks_dropped),
					unit_cost: finished_good_details.unit_cost,
					quantity_after: new_finished_good_current_quantity,
					source_module: "Supply Logs",
					reference: supply_log_unique_id,
					created_by: user_unique_id,
					status: default_status
				}, { transaction });
				const responseFinishedGoodStockLogBreakage = await FINISHED_GOOD_STOCK_LOG.create({
					unique_id: uuidv4(),
					finished_good_unique_id: finished_good_details.unique_id,
					movement_type: stock_log_movement_type.breakage,
					quantity: parseInt(payload.breakage_quantity),
					unit_cost: finished_good_details.unit_cost,
					quantity_after: new_finished_good_current_quantity,
					source_module: "Supply Logs",
					reference: supply_log_unique_id,
					created_by: user_unique_id,
					status: default_status
				}, { transaction });

				addLog("Supply Logs", user_unique_id, "Added Supply Log", payload);
				if (supplyLogResponse && responseSalesOrderItem[0] > 0 && responseSalesOrder[0] > 0 && responseProduct[0] > 0 && responseFinishedGood[0] > 0 && responseFinishedGoodStockLogBreakage && responseFinishedGoodStockLogOut) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Supply Log created successfully!" }, { unique_id: supply_log_unique_id });
				} else {
					throw new Error("Error adding supply log");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async deleteSupplyLog(req: IGetAuthTypesRequest, res: Response) {
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
			await SUPPLY_LOG.sequelize?.transaction(async (transaction) => {
				const response = await SUPPLY_LOG.destroy(
					{
						where: {
							unique_id: payload.unique_id,
							status: default_status
						},
						transaction
					}
				);

				addLog("Supply Logs", user_unique_id, "Deleted Supply Log", payload);
				if (response > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Supply Log was deleted successfully!" }, null);
				} else {
					throw new Error("Error deleting record");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}
};
