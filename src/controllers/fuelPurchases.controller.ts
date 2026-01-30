import { Request, Response } from "express";
import { Op } from "sequelize";
import { validationResult, matchedData } from 'express-validator';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import FUEL_PURCHASE, { IFuelPurchase } from "../models/fuelPurchases.model";
import RAW_MATERIAL, { IRawMaterial } from "../models/rawMaterials.model";
import RAW_MATERIAL_STOCK_LOG, { IRawMaterialStockLog } from "../models/rawMaterialStockLogs.model";
import BUSINESS_RULE, { IBusinessRule } from "../models/businessRules.model";
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
	dynamicWhere, paid, unpaid, random_uuid, zero, fuel_delivery_status, stock_log_movement_type, business_rules,
	fuel_type,
} from '../config/config';
import { deleteImage } from '../middleware/uploads';

dotenv.config();

const { clouder_key, cloudy_name, cloudy_key, cloudy_secret } = process.env;

export default class FuelPurchaseController {
	async getFuelPurchases(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await FUEL_PURCHASE.count();
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await FUEL_PURCHASE.findAndCountAll({
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

			addLog("Fuel Purchases", user_unique_id, "Queried Fuel Purchases", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Fuel Purchases Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Fuel Purchases loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getFuelPurchase(req: IGetAuthTypesRequest, res: Response) {
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
			const response = await FUEL_PURCHASE.findOne({
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
						model: VENDOR,
						attributes: ['unique_id', 'reference', 'type', 'name', 'contact_person', 'email', 'phone_number', 'alt_phone_number', 'total_spend', 'profile_image']
					}, 
				],
			});

			addLog("Fuel Purchases", user_unique_id, "Queried Fuel Purchase", queryParams);
			if (!response) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Fuel Purchase Not found" }, null);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Fuel Purchase loaded" }, response);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async searchFuelPurchases(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await FUEL_PURCHASE.count({
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
			const response = await FUEL_PURCHASE.findAndCountAll({
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
				],
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Fuel Purchases", user_unique_id, "Searched Fuel Purchases", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Fuel Purchases Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Fuel Purchases loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getFuelPurchasesSpecifically(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await FUEL_PURCHASE.count({ where: dynamicWhere(queryParams) });
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await FUEL_PURCHASE.findAndCountAll({
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

			addLog("Fuel Purchases", user_unique_id, "Queried Fuel Purchases specifically", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Fuel Purchases Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Fuel Purchases loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async filterFuelPurchasesSpecifically(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await FUEL_PURCHASE.count({
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
			const response = await FUEL_PURCHASE.findAndCountAll({
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

			addLog("Fuel Purchases", user_unique_id, "Filtered Fuel Purchases specifically", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Fuel Purchases Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Fuel Purchases loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async publicGetFuelPurchases(req: IGetAuthTypesRequest, res: Response) {
		const queryParams: IPagination = req.query;

		const total_records = await FUEL_PURCHASE.count({ where: { status: default_status } });
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await FUEL_PURCHASE.findAndCountAll({
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
				return SuccessResponse(res, { unique_id: anonymous, text: "Fuel Purchases Not found" }, []);
			} else {
				// return SuccessResponse(res, { unique_id: anonymous, text: "Fuel Purchases loaded" }, { ...response, pages: pagination.pages });
				return SuccessResponse(res, { unique_id: anonymous, text: "Fuel Purchases loaded" }, { ...response });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async publicGetFuelPurchase(req: IGetAuthTypesRequest, res: Response) {
		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: anonymous, text: "Validation Error Occured" }, errors.array())
		}

		try {
			const response = await FUEL_PURCHASE.findOne({
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
						model: VENDOR,
						attributes: ['unique_id', 'reference', 'type', 'name', 'contact_person', 'email', 'phone_number', 'alt_phone_number', 'total_spend', 'profile_image']
					}, 
				],
			});

			if (!response) {
				return SuccessResponse(res, { unique_id: anonymous, text: "Fuel Purchase Not found" }, null);
			} else {
				return SuccessResponse(res, { unique_id: anonymous, text: "Fuel Purchase loaded" }, response);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async publicSearchFuelPurchases(req: IGetAuthTypesRequest, res: Response) {
		const queryParams: IPagination = req.query;

		const total_records = await FUEL_PURCHASE.count({
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
			const response = await FUEL_PURCHASE.findAndCountAll({
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
				],
				order: [
					[orderBy, sortBy]
				],
				// offset: pagination.start,
				// limit: pagination.limit
			});

			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: anonymous, text: "Fuel Purchases Not found" }, []);
			} else {
				// return SuccessResponse(res, { unique_id: anonymous, text: "Fuel Purchases loaded" }, { ...response, pages: pagination.pages });
				return SuccessResponse(res, { unique_id: anonymous, text: "Fuel Purchases loaded" }, { ...response });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async addFuelPurchase(req: IGetAuthTypesRequest, res: Response) {
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
			const fuel_purchase_unique_id = uuidv4();
			const reference = random_uuid(4);

			if (payload.fuel_type === fuel_type.diesel) {
				const business_rule_diesel_details = await BUSINESS_RULE.findOne({
					attributes: { exclude: ['id'] },
					where: {
						rule_key: business_rules.DIESEL_PRICE_PER_LITER
					}
				});

				const price_per_liter = business_rule_diesel_details && business_rule_diesel_details.rule_value ? business_rule_diesel_details.rule_value : 0;
				const total_cost = parseInt(payload.liters_purchased) * price_per_liter;
				
				await FUEL_PURCHASE.sequelize?.transaction(async (transaction) => {
					const fuelPurchaseResponse = await FUEL_PURCHASE.create({
						unique_id: fuel_purchase_unique_id,
						vendor_unique_id: payload.vendor_unique_id,
						raw_material_unique_id: payload.raw_material_unique_id ? payload.raw_material_unique_id : null,
						reference, 
						fuel_type: payload.fuel_type,
						liters_purchased: parseInt(payload.liters_purchased),
						price_per_liter,
						total_cost,
						purchase_date: payload.purchase_date,
						notes: payload.notes ? payload.notes : null,
						receipt_image: payload.receipt_image ? payload.receipt_image : null,
						receipt_image_public_id: payload.receipt_image_public_id ? payload.receipt_image_public_id : null,
						payment_status: unpaid, 
						delivery_status: fuel_delivery_status.pending,
						created_by: user_unique_id,
						status: default_status
					}, { transaction });

					addLog("Fuel Purchases", user_unique_id, "Added Fuel Purchase", payload);
					if (fuelPurchaseResponse) {
						return SuccessResponse(res, { unique_id: user_unique_id, text: "Fuel Purchase created successfully!" }, { unique_id: fuel_purchase_unique_id, reference });
					} else {
						throw new Error("Error adding fuel purchase");
					}
				});
			} else if (payload.fuel_type === fuel_type.petrol) {
				const business_rule_petrol_details = await BUSINESS_RULE.findOne({
					attributes: { exclude: ['id'] },
					where: {
						rule_key: business_rules.PETROL_PRICE_PER_LITER
					}
				});

				const price_per_liter = business_rule_petrol_details && business_rule_petrol_details.rule_value ? business_rule_petrol_details.rule_value : 0;
				const total_cost = parseInt(payload.liters_purchased) * price_per_liter;

				await FUEL_PURCHASE.sequelize?.transaction(async (transaction) => {
					const fuelPurchaseResponse = await FUEL_PURCHASE.create({
						unique_id: fuel_purchase_unique_id,
						vendor_unique_id: payload.vendor_unique_id,
						raw_material_unique_id: payload.raw_material_unique_id ? payload.raw_material_unique_id : null,
						reference, 
						fuel_type: payload.fuel_type,
						liters_purchased: parseInt(payload.liters_purchased),
						price_per_liter,
						total_cost,
						purchase_date: payload.purchase_date,
						notes: payload.notes ? payload.notes : null,
						receipt_image: payload.receipt_image ? payload.receipt_image : null,
						receipt_image_public_id: payload.receipt_image_public_id ? payload.receipt_image_public_id : null,
						payment_status: unpaid, 
						delivery_status: fuel_delivery_status.pending,
						created_by: user_unique_id,
						status: default_status
					}, { transaction });

					addLog("Fuel Purchases", user_unique_id, "Added Fuel Purchase", payload);
					if (fuelPurchaseResponse) {
						return SuccessResponse(res, { unique_id: user_unique_id, text: "Fuel Purchase created successfully!" }, { unique_id: fuel_purchase_unique_id, reference });
					} else {
						throw new Error("Error adding fuel purchase");
					}
				});
			} else {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Invalid fuel type for purchase" }, null);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async updateFuelPurchaseFuelType(req: IGetAuthTypesRequest, res: Response) {
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
			const fuel_purchase_details = await FUEL_PURCHASE.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!fuel_purchase_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Fuel Purchase Not found" }, null);
			}

			if (fuel_purchase_details.payment_status !== unpaid) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Invalid Unpaid Fuel Purchase" }, null);
			}

			await FUEL_PURCHASE.sequelize?.transaction(async (transaction) => {
				const response = await FUEL_PURCHASE.update(
					{
						fuel_type: payload.fuel_type,
					}, {
						where: {
							unique_id: payload.unique_id,
							status: default_status
						},
						transaction
					}
				);

				addLog("Fuel Purchases", user_unique_id, "Updated Fuel Purchase Fuel Type", payload);
				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
				} else {
					throw new Error("Fuel Purchase not found");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async updateFuelPurchaseDate(req: IGetAuthTypesRequest, res: Response) {
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
			const fuel_purchase_details = await FUEL_PURCHASE.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!fuel_purchase_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Fuel Purchase Not found" }, null);
			}

			if (fuel_purchase_details.payment_status === paid) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Fuel Purchase already paid" }, null);
			}

			await FUEL_PURCHASE.sequelize?.transaction(async (transaction) => {
				const response = await FUEL_PURCHASE.update(
					{
						purchase_date: payload.purchase_date,
					}, {
						where: {
							unique_id: payload.unique_id,
							status: default_status
						},
						transaction
					}
				);

				addLog("Fuel Purchases", user_unique_id, "Updated Fuel Purchase Date", payload);
				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
				} else {
					throw new Error("Fuel Purchase not found");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async updateFuelPurchaseLiters(req: IGetAuthTypesRequest, res: Response) {
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
			const fuel_purchase_details = await FUEL_PURCHASE.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!fuel_purchase_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Fuel Purchase Not found" }, null);
			}

			if (fuel_purchase_details.payment_status !== unpaid) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Invalid Unpaid Fuel Purchase" }, null);
			}

			if (fuel_purchase_details.fuel_type === fuel_type.diesel) {
				const business_rule_diesel_details = await BUSINESS_RULE.findOne({
					attributes: { exclude: ['id'] },
					where: {
						rule_key: business_rules.DIESEL_PRICE_PER_LITER
					}
				});

				const price_per_liter = business_rule_diesel_details && business_rule_diesel_details.rule_value ? business_rule_diesel_details.rule_value : 0;
				const total_cost = parseInt(payload.liters_purchased) * price_per_liter;

				await FUEL_PURCHASE.sequelize?.transaction(async (transaction) => {
					const response = await FUEL_PURCHASE.update(
						{
							liters_purchased: parseInt(payload.liters_purchased),
							price_per_liter,
							total_cost,
						}, {
							where: {
								unique_id: payload.unique_id,
								status: default_status
							},
							transaction
						}
					);

					addLog("Fuel Purchases", user_unique_id, "Updated Fuel Purchase Liters", payload);
					if (response[0] > 0) {
						return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
					} else {
						throw new Error("Fuel Purchase not found");
					}
				});
			} else if (fuel_purchase_details.fuel_type === fuel_type.petrol) {
				const business_rule_petrol_details = await BUSINESS_RULE.findOne({
					attributes: { exclude: ['id'] },
					where: {
						rule_key: business_rules.PETROL_PRICE_PER_LITER
					}
				});

				const price_per_liter = business_rule_petrol_details && business_rule_petrol_details.rule_value ? business_rule_petrol_details.rule_value : 0;
				const total_cost = parseInt(payload.liters_purchased) * price_per_liter;

				await FUEL_PURCHASE.sequelize?.transaction(async (transaction) => {
					const response = await FUEL_PURCHASE.update(
						{
							liters_purchased: parseInt(payload.liters_purchased),
							price_per_liter,
							total_cost,
						}, {
							where: {
								unique_id: payload.unique_id,
								status: default_status
							},
							transaction
						}
					);

					addLog("Fuel Purchases", user_unique_id, "Updated Fuel Purchase Liters", payload);
					if (response[0] > 0) {
						return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
					} else {
						throw new Error("Fuel Purchase not found");
					}
				});
			} else {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Invalid fuel type for purchase" }, null);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async updateFuelPurchaseNotes(req: IGetAuthTypesRequest, res: Response) {
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
			const fuel_purchase_details = await FUEL_PURCHASE.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!fuel_purchase_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Fuel Purchase Not found" }, null);
			}

			await FUEL_PURCHASE.sequelize?.transaction(async (transaction) => {
				const response = await FUEL_PURCHASE.update(
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

				addLog("Fuel Purchases", user_unique_id, "Updated Fuel Purchase Notes", payload);
				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
				} else {
					throw new Error("Fuel Purchase not found");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async updateFuelPurchaseReceiptImage(req: IGetAuthTypesRequest, res: Response) {
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
			const fuel_purchase_details = await FUEL_PURCHASE.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!fuel_purchase_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Fuel Purchase Not found" }, null);
			}

			await FUEL_PURCHASE.sequelize?.transaction(async (transaction) => {
				const response = await FUEL_PURCHASE.update(
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

				addLog("Fuel Purchases", user_unique_id, "Updated Fuel Purchase Receipt Image", payload);
				if (response[0] > 0) {
					SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
					
					// Delete former image available
					if (fuel_purchase_details.receipt_image_public_id !== null) {
						await deleteImage(clouder_key || '', { cloudinary_name: cloudy_name, cloudinary_key: cloudy_key, cloudinary_secret: cloudy_secret, public_id: fuel_purchase_details.receipt_image_public_id });
					}
				} else {
					throw new Error("Fuel Purchase not found");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async updateFuelPurchaseRawMaterial(req: IGetAuthTypesRequest, res: Response) {
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
			const fuel_purchase_details = await FUEL_PURCHASE.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!fuel_purchase_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Fuel Purchase Not found" }, null);
			}

			if (fuel_purchase_details.delivery_status === fuel_delivery_status.delivered) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Fuel Purchase already delivered" }, null);
			}

			await FUEL_PURCHASE.sequelize?.transaction(async (transaction) => {
				const response = await FUEL_PURCHASE.update(
					{
						raw_material_unique_id: payload.raw_material_unique_id ? payload.raw_material_unique_id : null,
					}, {
						where: {
							unique_id: payload.unique_id,
							status: default_status
						},
						transaction
					}
				);

				addLog("Fuel Purchases", user_unique_id, "Updated Fuel Purchase Raw Material", payload);
				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
				} else {
					throw new Error("Fuel Purchase not found");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async payFuelPurchase(req: IGetAuthTypesRequest, res: Response) {
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
			const fuel_purchase_details = await FUEL_PURCHASE.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!fuel_purchase_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Fuel Purchase Not found" }, null);
			}

			if (fuel_purchase_details && fuel_purchase_details.payment_status !== unpaid) {
				return BadRequestError(res, { unique_id: user_unique_id, text: `Invalid Unpaid Fuel Purchase, current status - ${fuel_purchase_details.payment_status}` }, null);
			}
			
			const vendor_details = await VENDOR.findOne({
				attributes: { exclude: ['id'] },
				where: {
					unique_id: fuel_purchase_details.vendor_unique_id,
					status: default_status
				}
			});

			if (!vendor_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Vendor not found" }, null);
			}

			const total_cost = fuel_purchase_details.total_cost || 0;
			const new_vendor_total_spend = vendor_details.total_spend && vendor_details.total_spend > 0 ? vendor_details.total_spend + total_cost : total_cost;
			
			await FUEL_PURCHASE.sequelize?.transaction(async (transaction) => {
				const response = await FUEL_PURCHASE.update(
					{
						payment_status: paid,
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

				const responseVendor = await VENDOR.update( { total_spend: new_vendor_total_spend }, { where: { unique_id: vendor_details.unique_id, status: default_status }, transaction } );

				addExpense({
					amount: total_cost,
					category: "Fuel Purchases",
					created_by: fuel_purchase_details.created_by || user_unique_id,
					expense_date: fuel_purchase_details.purchase_date || '',
					fuel_purchase_unique_id: fuel_purchase_details.unique_id,
					notes: fuel_purchase_details.notes,
					receipt_image: fuel_purchase_details.receipt_image,
					receipt_image_public_id: fuel_purchase_details.receipt_image_public_id,
				}, user_unique_id);
				// Add to inventory here ...

				addLog("Fuel Purchases", user_unique_id, "Paid Fuel Purchase", payload);
				if (response[0] > 0 && responseVendor[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
				} else {
					throw new Error("Fuel Purchase not found");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async updateFuelPurchaseDeliveryStatus(req: IGetAuthTypesRequest, res: Response) {
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
			const fuel_purchase_details = await FUEL_PURCHASE.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!fuel_purchase_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Fuel Purchase Not found" }, null);
			}

			if (fuel_purchase_details.payment_status === unpaid) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Fuel Purchase is unpaid" }, null);
			}

			if (fuel_purchase_details.delivery_status === fuel_delivery_status.delivered) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Fuel Purchase already delivered" }, null);
			}

			const raw_material_details = await RAW_MATERIAL.findOne({
				attributes: { exclude: ['id'] },
				where: {
					unique_id: fuel_purchase_details.raw_material_unique_id,
				}
			});

			if (!raw_material_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Fuel Purchase - Raw Material not found" }, null);
			}

			const new_raw_material_current_quantity = raw_material_details.current_quantity && fuel_purchase_details.liters_purchased && raw_material_details.current_quantity > 0 && fuel_purchase_details.liters_purchased > 0 ? raw_material_details.current_quantity + fuel_purchase_details.liters_purchased : raw_material_details.current_quantity;

			if (payload.delivery_status === fuel_delivery_status.delivered) {
				await FUEL_PURCHASE.sequelize?.transaction(async (transaction) => {
					const response = await FUEL_PURCHASE.update( { delivery_status: payload.delivery_status, }, { where: { unique_id: payload.unique_id, status: default_status }, transaction } );
					const responseRawMaterial = await RAW_MATERIAL.update( { current_quantity: new_raw_material_current_quantity }, { where: { unique_id: raw_material_details.unique_id, status: default_status }, transaction } );
					const responseRawMaterialStockLog = await RAW_MATERIAL_STOCK_LOG.create({
						unique_id: uuidv4(),
						raw_material_unique_id: raw_material_details.unique_id,
						movement_type: stock_log_movement_type.in,
						quantity: fuel_purchase_details.liters_purchased,
						unit_cost: null,
						quantity_after: new_raw_material_current_quantity,
						source_module: "Procurement - Fuel Purchases",
						reference: fuel_purchase_details.reference,
						created_by: user_unique_id,
						status: default_status
					}, { transaction });
	
					addLog("Fuel Purchases", user_unique_id, "Updated Fuel Purchase Delivery Status", payload);
					if (response[0] > 0 && responseRawMaterial[0] > 0 && responseRawMaterialStockLog) {
						return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
					} else {
						throw new Error("Fuel Purchase not found");
					}
				});
			} else {
				await FUEL_PURCHASE.sequelize?.transaction(async (transaction) => {
					const response = await FUEL_PURCHASE.update(
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

					addLog("Fuel Purchases", user_unique_id, "Updated Fuel Purchase Delivery Status", payload);
					if (response[0] > 0) {
						return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
					} else {
						throw new Error("Fuel Purchase not found");
					}
				});
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async deleteFuelPurchase(req: IGetAuthTypesRequest, res: Response) {
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
			const fuel_purchase_details = await FUEL_PURCHASE.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!fuel_purchase_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Fuel Purchase Not found" }, null);
			}

			if (fuel_purchase_details && fuel_purchase_details.payment_status !== unpaid) {
				return BadRequestError(res, { unique_id: user_unique_id, text: `Unable to delete fuel purchase, current status - ${fuel_purchase_details.payment_status}` }, null);
			}

			if (fuel_purchase_details.delivery_status !== fuel_delivery_status.pending) {
				return BadRequestError(res, { unique_id: user_unique_id, text: `Unable to delete payment, Fuel Purchase delivery status - ${fuel_purchase_details.delivery_status}` }, null);
			}

			const vendor_details = await VENDOR.findOne({
				attributes: { exclude: ['id'] },
				where: {
					unique_id: fuel_purchase_details.vendor_unique_id,
					status: default_status
				}
			});

			if (!vendor_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Vendor not found" }, null);
			}

			const total_cost = fuel_purchase_details.total_cost || 0;
			const new_vendor_total_spend = vendor_details.total_spend && vendor_details.total_spend > 0 ? vendor_details.total_spend - total_cost : vendor_details.total_spend;
			
			if (fuel_purchase_details.raw_material_unique_id) {
				const raw_material_details = await RAW_MATERIAL.findOne({
					attributes: { exclude: ['id'] },
					where: {
						unique_id: fuel_purchase_details.raw_material_unique_id,
					}
				});
	
				if (!raw_material_details) {
					return BadRequestError(res, { unique_id: user_unique_id, text: "Fuel Purchase - Raw Material not found" }, null);
				}

				const fuel_purchase_liters = fuel_purchase_details.liters_purchased ? fuel_purchase_details.liters_purchased : 0;
					
				// const new_raw_material_current_quantity = raw_material_details.current_quantity && raw_material_details.current_quantity > 0 && fuel_purchase_liters > 0 ? raw_material_details.current_quantity - fuel_purchase_liters : raw_material_details.current_quantity;

				await FUEL_PURCHASE.sequelize?.transaction(async (transaction) => {
					const response = await FUEL_PURCHASE.destroy(
						{
							where: {
								unique_id: payload.unique_id,
								status: default_status
							},
							transaction
						}
					);
					
					const responseVendor = await VENDOR.update( { total_spend: new_vendor_total_spend }, { where: { unique_id: vendor_details.unique_id, status: default_status }, transaction } );
					// const responseRawMaterial = await RAW_MATERIAL.update( { quantity: new_raw_material_current_quantity }, { where: { unique_id: raw_material_details.unique_id, status: default_status }, transaction } );
					// const responseRawMaterialStockLog = await RAW_MATERIAL_STOCK_LOG.create({
					// 	unique_id: uuidv4(),
					// 	raw_material_unique_id: raw_material_details.unique_id,
					// 	movement_type: stock_log_movement_type.adjustment,
					// 	quantity: fuel_purchase_details.liters_purchased,
					// 	unit_cost: null,
					// 	quantity_after: new_raw_material_current_quantity,
					// 	source_module: "Procurement - Fuel Purchases",
					// 	reference: fuel_purchase_details.reference,
					// 	created_by: user_unique_id,
					// 	status: default_status
					// }, { transaction });

					deleteExpense({ fuel_purchase_unique_id: payload.unique_id }, user_unique_id);
					addLog("Fuel Purchases", user_unique_id, "Deleted Fuel Purchase", payload);
					if (response > 0) {
						SuccessResponse(res, { unique_id: user_unique_id, text: "Fuel Purchase was deleted successfully!" }, null);
						
						// Delete former image available
						if (fuel_purchase_details.receipt_image_public_id !== null) {
							await deleteImage(clouder_key || '', { cloudinary_name: cloudy_name, cloudinary_key: cloudy_key, cloudinary_secret: cloudy_secret, public_id: fuel_purchase_details.receipt_image_public_id });
						}
					} else {
						throw new Error("Error deleting record");
					}
				});
			} else {
				await FUEL_PURCHASE.sequelize?.transaction(async (transaction) => {
					const response = await FUEL_PURCHASE.destroy(
						{
							where: {
								unique_id: payload.unique_id,
								status: default_status
							},
							transaction
						}
					);
					const responseVendor = await VENDOR.update( { total_spend: new_vendor_total_spend }, { where: { unique_id: vendor_details.unique_id, status: default_status }, transaction } );
	
					deleteExpense({ fuel_purchase_unique_id: payload.unique_id }, user_unique_id, transaction);
					addLog("Fuel Purchases", user_unique_id, "Deleted Fuel Purchase", payload);
					if (response > 0 && responseVendor[0] > 0) {
						SuccessResponse(res, { unique_id: user_unique_id, text: "Fuel Purchase was deleted successfully!" }, null);
						
						// Delete former image available
						if (fuel_purchase_details.receipt_image_public_id !== null) {
							await deleteImage(clouder_key || '', { cloudinary_name: cloudy_name, cloudinary_key: cloudy_key, cloudinary_secret: cloudy_secret, public_id: fuel_purchase_details.receipt_image_public_id });
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
