import { Request, Response } from "express";
import { Op } from "sequelize";
import { validationResult, matchedData } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import SALES_ORDER, { ISalesOrder } from "../models/salesOrders.model";
import DELIVERY_ASSIGNMENT, { IDeliveryAssignment } from "../models/deliveryAssignments.model";
import SUPPLY_LOG, { ISupplyLog } from "../models/supplyLogs.model";
import VEHICLE, { IVehicle } from "../models/vehicles.model";
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
	dynamicWhere, zero, delivery_assignment_status, approved, pending, vehicle_availability_status, 
} from '../config/config';

export default class DeliveryAssignmentController {
	async getDeliveryAssignments(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await DELIVERY_ASSIGNMENT.count();
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await DELIVERY_ASSIGNMENT.findAndCountAll({
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
						model: VEHICLE,
						attributes: ['unique_id', 'reference', 'code', 'plate_number', 'type', 'capacity_unit', 'capacity_value', 'fuel_type', 'benchmark_fuel_liters', 'expected_trips_per_benchmark', 'purchase_date', 'availability_status', 'is_active']
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

			addLog("Delivery Assignments", user_unique_id, "Queried Delivery Assignments", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Delivery Assignments Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Delivery Assignments loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getDeliveryAssignment(req: IGetAuthTypesRequest, res: Response) {
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
			const response = await DELIVERY_ASSIGNMENT.findOne({
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
						model: VEHICLE,
						attributes: ['unique_id', 'reference', 'code', 'plate_number', 'type', 'capacity_unit', 'capacity_value', 'fuel_type', 'benchmark_fuel_liters', 'expected_trips_per_benchmark', 'purchase_date', 'availability_status', 'is_active']
					}, 
					{
						model: SALES_ORDER,
						attributes: ['unique_id', 'reference', 'total_amount', 'discount_amount', 'outside_town', 'outside_town_location', 'estimated_trip_liters', 'outside_town_surcharge', 'amount_payable', 'total_items_ordered', 'total_items_dropped', 'order_status'], 
					}
				], 
			});

			addLog("Delivery Assignments", user_unique_id, "Queried Delivery Assignment", queryParams);
			if (!response) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Delivery Assignment Not found" }, null);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Delivery Assignment loaded" }, response);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async searchDeliveryAssignments(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await DELIVERY_ASSIGNMENT.count({
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
			const response = await DELIVERY_ASSIGNMENT.findAndCountAll({
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
						model: VEHICLE,
						attributes: ['unique_id', 'reference', 'code', 'plate_number', 'type', 'capacity_unit', 'capacity_value', 'fuel_type', 'benchmark_fuel_liters', 'expected_trips_per_benchmark', 'purchase_date', 'availability_status', 'is_active']
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

			addLog("Delivery Assignments", user_unique_id, "Searched Delivery Assignments", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Delivery Assignments Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Delivery Assignments loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getDeliveryAssignmentsSpecifically(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await DELIVERY_ASSIGNMENT.count({ where: dynamicWhere(queryParams) });
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await DELIVERY_ASSIGNMENT.findAndCountAll({
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
						model: VEHICLE,
						attributes: ['unique_id', 'reference', 'code', 'plate_number', 'type', 'capacity_unit', 'capacity_value', 'fuel_type', 'benchmark_fuel_liters', 'expected_trips_per_benchmark', 'purchase_date', 'availability_status', 'is_active']
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

			addLog("Delivery Assignments", user_unique_id, "Queried Delivery Assignments specifically", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Delivery Assignments Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Delivery Assignments loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async filterDeliveryAssignmentsSpecifically(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await DELIVERY_ASSIGNMENT.count({
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
			const response = await DELIVERY_ASSIGNMENT.findAndCountAll({
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
						model: VEHICLE,
						attributes: ['unique_id', 'reference', 'code', 'plate_number', 'type', 'capacity_unit', 'capacity_value', 'fuel_type', 'benchmark_fuel_liters', 'expected_trips_per_benchmark', 'purchase_date', 'availability_status', 'is_active']
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

			addLog("Delivery Assignments", user_unique_id, "Filtered Delivery Assignments specifically", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Delivery Assignments Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Delivery Assignments loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async publicGetDeliveryAssignments(req: IGetAuthTypesRequest, res: Response) {
		const queryParams: IPagination = req.query;

		const total_records = await DELIVERY_ASSIGNMENT.count({ where: { status: default_status } });
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await DELIVERY_ASSIGNMENT.findAndCountAll({
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
						model: VEHICLE,
						attributes: ['unique_id', 'reference', 'code', 'plate_number', 'type', 'capacity_unit', 'capacity_value', 'fuel_type', 'benchmark_fuel_liters', 'expected_trips_per_benchmark', 'purchase_date', 'availability_status', 'is_active']
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
				return SuccessResponse(res, { unique_id: anonymous, text: "Delivery Assignments Not found" }, []);
			} else {
				// return SuccessResponse(res, { unique_id: anonymous, text: "Delivery Assignments loaded" }, { ...response, pages: pagination.pages });
				return SuccessResponse(res, { unique_id: anonymous, text: "Delivery Assignments loaded" }, { ...response });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async publicGetDeliveryAssignment(req: IGetAuthTypesRequest, res: Response) {
		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: anonymous, text: "Validation Error Occured" }, errors.array())
		}

		try {
			const response = await DELIVERY_ASSIGNMENT.findOne({
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
						model: VEHICLE,
						attributes: ['unique_id', 'reference', 'code', 'plate_number', 'type', 'capacity_unit', 'capacity_value', 'fuel_type', 'benchmark_fuel_liters', 'expected_trips_per_benchmark', 'purchase_date', 'availability_status', 'is_active']
					}, 
					{
						model: SALES_ORDER,
						attributes: ['unique_id', 'reference', 'total_amount', 'discount_amount', 'outside_town', 'outside_town_location', 'estimated_trip_liters', 'outside_town_surcharge', 'amount_payable', 'total_items_ordered', 'total_items_dropped', 'order_status'], 
					}
				], 
			});

			if (!response) {
				return SuccessResponse(res, { unique_id: anonymous, text: "Delivery Assignment Not found" }, null);
			} else {
				return SuccessResponse(res, { unique_id: anonymous, text: "Delivery Assignment loaded" }, response);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async publicSearchDeliveryAssignments(req: IGetAuthTypesRequest, res: Response) {
		const queryParams: IPagination = req.query;

		const total_records = await DELIVERY_ASSIGNMENT.count({
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
			const response = await DELIVERY_ASSIGNMENT.findAndCountAll({
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
						model: VEHICLE,
						attributes: ['unique_id', 'reference', 'code', 'plate_number', 'type', 'capacity_unit', 'capacity_value', 'fuel_type', 'benchmark_fuel_liters', 'expected_trips_per_benchmark', 'purchase_date', 'availability_status', 'is_active']
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
				return SuccessResponse(res, { unique_id: anonymous, text: "Delivery Assignments Not found" }, []);
			} else {
				// return SuccessResponse(res, { unique_id: anonymous, text: "Delivery Assignments loaded" }, { ...response, pages: pagination.pages });
				return SuccessResponse(res, { unique_id: anonymous, text: "Delivery Assignments loaded" }, { ...response });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async updateDeliveryAssignmentScheduledDate(req: IGetAuthTypesRequest, res: Response) {
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
			const delivery_assignment_details = await DELIVERY_ASSIGNMENT.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!delivery_assignment_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Delivery Assignment Not found" }, null);
			}

			if (delivery_assignment_details.assignment_status !== delivery_assignment_status.pending) {
				return BadRequestError(res, { unique_id: user_unique_id, text: `Unable to update delivery assignment, current status - ${delivery_assignment_details.assignment_status}` }, null);
			}

			await DELIVERY_ASSIGNMENT.sequelize?.transaction(async (transaction) => {
				const response = await DELIVERY_ASSIGNMENT.update(
					{
						scheduled_date: payload.scheduled_date,
					}, {
						where: {
							unique_id: payload.unique_id,
							status: default_status
						},
						transaction
					}
				);

				addLog("Delivery Assignments", user_unique_id, "Updated Delivery Assignment Scheduled Date", payload);
				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
				} else {
					throw new Error("Delivery Assignment not found");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async reassignDeliveryAssignment(req: IGetAuthTypesRequest, res: Response) {
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
			const delivery_assignment_details = await DELIVERY_ASSIGNMENT.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!delivery_assignment_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Delivery Assignment Not found" }, null);
			}

			if (delivery_assignment_details.assignment_status !== delivery_assignment_status.pending) {
				return BadRequestError(res, { unique_id: user_unique_id, text: `Unable to update delivery assignment, current status - ${delivery_assignment_details.assignment_status}` }, null);
			}

			const sales_order_details = await SALES_ORDER.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: delivery_assignment_details.sales_order_unique_id }
			});

			if (!sales_order_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Sales Order Not found" }, null);
			}

			if (sales_order_details && sales_order_details.order_status !== approved) {
				return BadRequestError(res, { unique_id: user_unique_id, text: `Invalid Approved Sales Order, current status - ${sales_order_details.order_status}` }, null);
			}

			const available_vehicle_details = await VEHICLE.findOne({
				attributes: { exclude: ['id'] },
				where: { 
					unique_id: payload.vehicle_unique_id,
					benchmark_fuel_liters: {
						[Op.gte]: sales_order_details.estimated_trip_liters
					}, 
					availability_status: vehicle_availability_status.available, 
					is_active: true_status
				}
			});

			if (!available_vehicle_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Vehicle is not active or not compatible (benchmark fuel liters < estimated trip liters)" }, null);
			}

			// Implement available employee here for driver as well (probably get it from the assigned driver when implemented in the vehicle model)

			await DELIVERY_ASSIGNMENT.sequelize?.transaction(async (transaction) => {
				const response = await DELIVERY_ASSIGNMENT.update(
					{
						vehicle_unique_id: available_vehicle_details ? available_vehicle_details.unique_id : null,
						// driver_unique_id: available_driver_details ? available_driver_details.unique_id : null,
						assigned_at: timestamp_str_alt(new Date()),
						auto_assigned: false_status,
						updated_by: user_unique_id,
					}, {
						where: {
							unique_id: payload.unique_id,
							status: default_status
						},
						transaction
					}
				);

				addLog("Delivery Assignments", user_unique_id, "Reassigned Delivery Assignment", payload);
				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
				} else {
					throw new Error("Delivery Assignment not found");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async updateDeliveryAssignmentNotes(req: IGetAuthTypesRequest, res: Response) {
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
			const delivery_assignment_details = await DELIVERY_ASSIGNMENT.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!delivery_assignment_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Delivery Assignment Not found" }, null);
			}

			if (delivery_assignment_details.assignment_status !== delivery_assignment_status.pending) {
				return BadRequestError(res, { unique_id: user_unique_id, text: `Unable to update delivery assignment, current status - ${delivery_assignment_details.assignment_status}` }, null);
			}

			await DELIVERY_ASSIGNMENT.sequelize?.transaction(async (transaction) => {
				const response = await DELIVERY_ASSIGNMENT.update(
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

				addLog("Delivery Assignments", user_unique_id, "Updated Delivery Assignment Notes", payload);
				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
				} else {
					throw new Error("Delivery Assignment not found");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async cancelDeliveryAssignment(req: IGetAuthTypesRequest, res: Response) {
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
			const delivery_assignment_details = await DELIVERY_ASSIGNMENT.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!delivery_assignment_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Delivery Assignment Not found" }, null);
			}

			if (delivery_assignment_details.assignment_status !== delivery_assignment_status.pending) {
				return BadRequestError(res, { unique_id: user_unique_id, text: `Unable to update delivery assignment, current status - ${delivery_assignment_details.assignment_status}` }, null);
			}

			await DELIVERY_ASSIGNMENT.sequelize?.transaction(async (transaction) => {
				const response = await DELIVERY_ASSIGNMENT.update(
					{
						assignment_status: delivery_assignment_status.cancelled,
					}, {
						where: {
							unique_id: payload.unique_id,
							status: default_status
						},
						transaction
					}
				);

				addLog("Delivery Assignments", user_unique_id, "Cancelled Delivery Assignment", payload);
				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
				} else {
					throw new Error("Delivery Assignment not found");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async startDeliveryAssignment(req: IGetAuthTypesRequest, res: Response) {
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
			const delivery_assignment_details = await DELIVERY_ASSIGNMENT.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!delivery_assignment_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Delivery Assignment Not found" }, null);
			}

			if (delivery_assignment_details.assignment_status !== delivery_assignment_status.pending) {
				return BadRequestError(res, { unique_id: user_unique_id, text: `Unable to update delivery assignment, current status - ${delivery_assignment_details.assignment_status}` }, null);
			}

			if (!delivery_assignment_details.vehicle_unique_id) {
				return BadRequestError(res, { unique_id: user_unique_id, text: `Unable to update delivery assignment, vehicle not assigned yet` }, null);
			}

			await DELIVERY_ASSIGNMENT.sequelize?.transaction(async (transaction) => {
				const response = await DELIVERY_ASSIGNMENT.update(
					{
						assignment_status: delivery_assignment_status.in_transit,
						started_at: timestamp_str_alt(new Date())
					}, {
						where: {
							unique_id: payload.unique_id,
							status: default_status
						},
						transaction
					}
				);

				const vehicleResponse = await VEHICLE.update(
					{
						availability_status: vehicle_availability_status.on_delivery,
					}, {
						where: {
							unique_id: delivery_assignment_details.vehicle_unique_id,
							status: default_status
						},
						transaction
					}
				);

				addLog("Delivery Assignments", user_unique_id, "Started Delivery Assignment", payload);
				if (response[0] > 0 && vehicleResponse[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
				} else {
					throw new Error("Delivery Assignment not found");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async completeDeliveryAssignment(req: IGetAuthTypesRequest, res: Response) {
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
			const delivery_assignment_details = await DELIVERY_ASSIGNMENT.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!delivery_assignment_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Delivery Assignment Not found" }, null);
			}

			if (delivery_assignment_details.assignment_status !== delivery_assignment_status.in_transit) {
				return BadRequestError(res, { unique_id: user_unique_id, text: `Unable to update delivery assignment, current status - ${delivery_assignment_details.assignment_status}` }, null);
			}

			if (!delivery_assignment_details.vehicle_unique_id) {
				return BadRequestError(res, { unique_id: user_unique_id, text: `Unable to update delivery assignment, vehicle not assigned yet` }, null);
			}

			const supply_log_details = await SUPPLY_LOG.findOne({
				attributes: { exclude: ['id'] },
				where: { delivery_assignment_unique_id: delivery_assignment_details.unique_id }
			});

			if (!supply_log_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Unable to update delivery assignment, No supply logs for this delivery yet" }, null);
			}

			await DELIVERY_ASSIGNMENT.sequelize?.transaction(async (transaction) => {
				const response = await DELIVERY_ASSIGNMENT.update(
					{
						assignment_status: delivery_assignment_status.completed,
						completed_at: timestamp_str_alt(new Date())
					}, {
						where: {
							unique_id: payload.unique_id,
							status: default_status
						},
						transaction
					}
				);

				const vehicleResponse = await VEHICLE.update(
					{
						availability_status: vehicle_availability_status.available,
					}, {
						where: {
							unique_id: delivery_assignment_details.vehicle_unique_id,
							status: default_status
						},
						transaction
					}
				);

				addLog("Delivery Assignments", user_unique_id, "Completed Delivery Assignment", payload);
				if (response[0] > 0 && vehicleResponse[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
				} else {
					throw new Error("Delivery Assignment not found");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async deleteDeliveryAssignment(req: IGetAuthTypesRequest, res: Response) {
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
			const delivery_assignment_details = await DELIVERY_ASSIGNMENT.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!delivery_assignment_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Delivery Assignment Not found" }, null);
			}

			if (delivery_assignment_details.assignment_status !== delivery_assignment_status.pending) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Unable to delete, delivery assignment is active" }, null);
			}

			await DELIVERY_ASSIGNMENT.sequelize?.transaction(async (transaction) => {
				const response = await DELIVERY_ASSIGNMENT.destroy(
					{
						where: {
							unique_id: payload.unique_id,
							status: default_status
						},
						transaction
					}
				);

				addLog("Delivery Assignments", user_unique_id, "Deleted Delivery Assignment", payload);
				if (response > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Delivery Assignment was deleted successfully!" }, null);
				} else {
					throw new Error("Error deleting record");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}
};
