import { Request, Response } from "express";
import { Op } from "sequelize";
import { validationResult, matchedData } from 'express-validator';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import ACL, { IACL } from "../models/acls.model";
import MODULE, { IModule } from "../models/modules.model";
import SUB_MODULE, { ISubModule } from "../models/subModules.model";
import EXPENSE, { IExpense } from "../models/expenses.model";
import { addLog } from "./logs.controller";
import { IGetAuthTypesRequest } from "../middleware/checks";
import { ServerError, SuccessResponse, ValidationError, OtherSuccessResponse, NotFoundError, BadRequestError, logger, UnauthorizedError } from '../common/index';
import {
	IPagination, ISearch, default_status, paginate, return_all_letters_uppercase, anonymous, true_status, false_status, strip_text, timestamp_str_alt,
	dynamicWhere
} from '../config/config';
import { deleteImage } from '../middleware/uploads';

dotenv.config();

const { clouder_key, cloudy_name, cloudy_key, cloudy_secret } = process.env;

export async function addExpense(
	data: {
		purchase_order_unique_id?: string,
		fuel_purchase_unique_id?: string,
		vendor_payment_unique_id?: string,
		machine_maintenance_log_unique_id?: string,
		stacking_log_unique_id?: string,
		category: string,
		amount: number,
		expense_date: string,
		notes?: string,
		receipt_image?: string,
		receipt_image_public_id?: string,
		created_by: string,
	}, 
	user_unique_id: string,
	transaction?: any | null | undefined
) {
	addLog("Expenses", user_unique_id, "Added Expense", data, transaction ? transaction : null);
	return transaction ? await EXPENSE.create({
		unique_id: uuidv4(),
		purchase_order_unique_id: data.purchase_order_unique_id ? data.purchase_order_unique_id : null,
		fuel_purchase_unique_id: data.fuel_purchase_unique_id ? data.fuel_purchase_unique_id : null,
		vendor_payment_unique_id: data.vendor_payment_unique_id ? data.vendor_payment_unique_id : null,
		machine_maintenance_log_unique_id: data.machine_maintenance_log_unique_id ? data.machine_maintenance_log_unique_id : null,
		stacking_log_unique_id: data.machine_maintenance_log_unique_id ? data.machine_maintenance_log_unique_id : null,
		category: data.category,
		amount: data.amount,
		expense_date: data.expense_date,
		notes: data.notes ? data.notes : null,
		receipt_image: data.receipt_image ? data.receipt_image : null,
		receipt_image_public_id: data.receipt_image_public_id ? data.receipt_image_public_id : null,
		created_by: data.created_by,
		status: default_status
	}, { transaction }) : await EXPENSE.create({
		unique_id: uuidv4(),
		purchase_order_unique_id: data.purchase_order_unique_id ? data.purchase_order_unique_id : null,
		fuel_purchase_unique_id: data.fuel_purchase_unique_id ? data.fuel_purchase_unique_id : null,
		vendor_payment_unique_id: data.vendor_payment_unique_id ? data.vendor_payment_unique_id : null,
		machine_maintenance_log_unique_id: data.machine_maintenance_log_unique_id ? data.machine_maintenance_log_unique_id : null,
		stacking_log_unique_id: data.stacking_log_unique_id ? data.stacking_log_unique_id : null,
		category: data.category,
		amount: data.amount,
		expense_date: data.expense_date,
		notes: data.notes ? data.notes : null,
		receipt_image: data.receipt_image ? data.receipt_image : null,
		receipt_image_public_id: data.receipt_image_public_id ? data.receipt_image_public_id : null,
		created_by: data.created_by,
		status: default_status
	});
}; 

export async function deleteExpense(
	data: {
		unique_id?: string,
		purchase_order_unique_id?: string,
		fuel_purchase_unique_id?: string,
		vendor_payment_unique_id?: string,
		machine_maintenance_log_unique_id?: string,
		stacking_log_unique_id?: string,
	}, 
	user_unique_id: string,
	transaction?: any | null | undefined
) {
	addLog("Expenses", user_unique_id, "Deleted Expense", data, transaction ? transaction : null);
	return transaction ? await EXPENSE.destroy(
		{
			where: {
				[Op.or]: [
					{
						unique_id: data.unique_id,
					}, 
					{
						purchase_order_unique_id: data.purchase_order_unique_id,
					}, 
					{
						fuel_purchase_unique_id: data.fuel_purchase_unique_id,
					}, 
					{
						vendor_payment_unique_id: data.vendor_payment_unique_id,
					},
					{
						machine_maintenance_log_unique_id: data.machine_maintenance_log_unique_id,
					},
					{
						stacking_log_unique_id: data.stacking_log_unique_id,
					},
				], 
				status: default_status
			},
			transaction
		}
	) : await EXPENSE.destroy(
		{
			where: {
				[Op.or]: [
					{
						unique_id: data.unique_id,
					}, 
					{
						purchase_order_unique_id: data.purchase_order_unique_id,
					}, 
					{
						fuel_purchase_unique_id: data.fuel_purchase_unique_id,
					}, 
					{
						vendor_payment_unique_id: data.vendor_payment_unique_id,
					},
					{
						machine_maintenance_log_unique_id: data.machine_maintenance_log_unique_id,
					},
					{
						stacking_log_unique_id: data.stacking_log_unique_id,
					},
				], 
				status: default_status
			}
		}
	);
}; 

export default class ExpenseController {
	async getExpenses(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await EXPENSE.count();
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await EXPENSE.findAndCountAll({
				attributes: { exclude: ['id'] },
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Expenses", user_unique_id, "Queried Expenses", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Expenses Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Expenses loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getExpense(req: IGetAuthTypesRequest, res: Response) {
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
			const response = await EXPENSE.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			addLog("Expenses", user_unique_id, "Queried Expense", queryParams);
			if (!response) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Expense Not found" }, null);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Expense loaded" }, response);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async searchExpenses(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await EXPENSE.count({
			where: {
				[Op.or]: [
					{
						type: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					},
					{
						description: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					},
					{
						content: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					}
				]
			}
		});
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await EXPENSE.findAndCountAll({
				attributes: { exclude: ['id'] },
				where: {
					[Op.or]: [
						{
							type: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
						},
						{
							description: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
						},
						{
							content: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
						}
					]
				},
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Expenses", user_unique_id, "Searched Expenses", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Expenses Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Expenses loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getExpensesSpecifically(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await EXPENSE.count({ where: dynamicWhere(queryParams) });
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await EXPENSE.findAndCountAll({
				attributes: { exclude: ['id'] },
				where: dynamicWhere(queryParams),
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Expenses", user_unique_id, "Queried Expenses Specifically", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Expenses Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Expenses loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async filterExpensesSpecifically(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await EXPENSE.count({
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
			const response = await EXPENSE.findAndCountAll({
				attributes: { exclude: ['id'] },
				where: {
					...dynamicWhere(queryParams),
					createdAt: {
						[Op.gte]: timestamp_str_alt(new Date(payload.start_date).setHours(0, 0, 0, 0)),
						[Op.lte]: timestamp_str_alt(new Date(payload.end_date).setHours(23, 59, 59, 0)),
					}
				},
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Expenses", user_unique_id, "Filter Expenses Specifically", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Expenses Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Expenses loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async addExpense(req: IGetAuthTypesRequest, res: Response) {
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
			const expense_unique_id = uuidv4();

			await EXPENSE.sequelize?.transaction(async (transaction) => {
				const expenseResponse = await EXPENSE.create({
					unique_id: expense_unique_id,
					purchase_order_unique_id: null,
					fuel_purchase_unique_id: null,
					category: payload.category,
					amount: parseInt(payload.amount),
					expense_date: payload.expense_date,
					notes: payload.notes ? payload.notes : null,
					receipt_image: payload.receipt_image ? payload.receipt_image : null,
					receipt_image_public_id: payload.receipt_image_public_id ? payload.receipt_image_public_id : null,
					created_by: user_unique_id,
					status: default_status
				}, { transaction });

				addLog("Expenses", user_unique_id, "Added Expense", payload);
				if (expenseResponse) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Expense created successfully!" }, { unique_id: expense_unique_id });
				} else {
					throw new Error("Error adding expense");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async deleteExpense(req: IGetAuthTypesRequest, res: Response) {
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
			const expense_details = await EXPENSE.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!expense_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Expense Not found" }, null);
			}

			await EXPENSE.sequelize?.transaction(async (transaction) => {
				const response = await EXPENSE.destroy(
					{
						where: {
							unique_id: payload.unique_id,
							status: default_status
						},
						transaction
					}
				);

				addLog("Expenses", user_unique_id, "Deleted Expense", payload);
				if (response > 0) {
					SuccessResponse(res, { unique_id: user_unique_id, text: "Expense was deleted successfully!" }, null);
										
					// Delete former image available
					if (expense_details.receipt_image_public_id !== null && expense_details.purchase_order_unique_id === null && expense_details.fuel_purchase_unique_id === null) {
						await deleteImage(clouder_key || '', { cloudinary_name: cloudy_name, cloudinary_key: cloudy_key, cloudinary_secret: cloudy_secret, public_id: expense_details.receipt_image_public_id });
					}
				} else {
					throw new Error("Error deleting record");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}
};
