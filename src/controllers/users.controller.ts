import { Request, Response } from "express";
import { Op } from "sequelize";
import { validationResult, matchedData } from 'express-validator';
import dotenv from 'dotenv';
import bycrypt from "bcryptjs";
import axios from "axios";
import { v4 as uuidv4 } from 'uuid';
import USER, { IUser } from "../models/users.model";
import ACL, { IACL } from "../models/acls.model";
import MODULE, { IModule } from "../models/modules.model";
import SUB_MODULE, { ISubModule } from "../models/subModules.model";
import ROLE, { IRole } from "../models/roles.model";
import ROLE_ACL, { IRoleAcl } from "../models/roleAcls.model";
import { addLog } from "./logs.controller";
import { IGetAuthTypesRequest } from "../middleware/checks";
import { ServerError, SuccessResponse, ValidationError, OtherSuccessResponse, NotFoundError, BadRequestError, logger, UnauthorizedError } from '../common/index';
import {
	IPagination, ISearch, default_status, paginate, return_all_letters_uppercase, random_uuid, anonymous, access_revoked, access_suspended, access_granted, true_status,
	strip_text, timestamp_str_alt, todays_date, mailer_url, return_all_letters_lowercase, primary_domain, return_trimmed_data, zero, dynamicWhere, format_phone_number, 
	return_bulk_acls_from_role_acls_array
} from '../config/config';
import { deleteImage } from '../middleware/uploads';

dotenv.config();

const { clouder_key, cloudy_name, cloudy_key, cloudy_secret, cloud_mailer_key, host_type, smtp_host, cloud_mailer_username, cloud_mailer_password, from_email } = process.env;

const { hashSync } = bycrypt;

export default class UserController {
	async getRootUsers(req: IGetAuthTypesRequest, res: Response) {
		const api_key: string = req.API_KEY;

		const queryParams: IPagination = req.query;

		const total_records = await USER.count();
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await USER.findAndCountAll({
				attributes: { exclude: ['id', 'profile_public_id'] },
				include: [
					{
						model: ROLE,
						attributes: ['unique_id', 'name', 'stripped']
					},
				],
				order: [
					[orderBy, sortBy]
				],
				distinct: true,
				offset: pagination.start,
				limit: pagination.limit
			});

			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: api_key, text: "Users Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: api_key, text: "Users loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: api_key, text: err.message }, null);
		}
	}

	async getRootUser(req: IGetAuthTypesRequest, res: Response) {
		const api_key: string = req.API_KEY;

		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: api_key, text: "Validation Error Occured" }, errors.array())
		}

		try {
			const response = await USER.findOne({
				attributes: { exclude: ['id', 'profile_public_id'] },
				where: {
					...payload
				},
				include: [
					{
						model: ROLE,
						attributes: ['unique_id', 'name', 'stripped']
					},
				],
			});

			if (!response) {
				return SuccessResponse(res, { unique_id: api_key, text: "User Not found" }, null);
			} else {
				return SuccessResponse(res, { unique_id: api_key, text: "User loaded" }, response);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: api_key, text: err.message }, null);
		}
	}

	async getRootUsersSpecifically(req: IGetAuthTypesRequest, res: Response) {
		const api_key: string = req.API_KEY;

		const queryParams: IPagination = req.query;
		
		const total_records = await USER.count({ where: dynamicWhere(queryParams) });
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await USER.findAndCountAll({
				attributes: { exclude: ['id', 'profile_public_id'] },
				where: dynamicWhere(queryParams),
				include: [
					{
						model: ROLE,
						attributes: ['unique_id', 'name', 'stripped']
					},
				],
				order: [
					[orderBy, sortBy]
				],
				distinct: true,
				offset: pagination.start,
				limit: pagination.limit
			});

			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: api_key, text: "Users Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: api_key, text: "Users loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: api_key, text: err.message }, null);
		}
	}

	async filterRootUsersSpecifically(req: IGetAuthTypesRequest, res: Response) {
		const api_key: string = req.API_KEY;

		const queryParams: IPagination = req.query;
		
		const total_records = await USER.count({
			where: {
				...dynamicWhere(queryParams),
				createdAt: {
					[Op.gte]: timestamp_str_alt(new Date(queryParams.start_date).setHours(0, 0, 0, 0)),
					[Op.lte]: timestamp_str_alt(new Date(queryParams.end_date).setHours(23, 59, 59, 0)),
				}
			}
		});
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await USER.findAndCountAll({
				attributes: { exclude: ['id', 'profile_public_id'] },
				where: {
					...dynamicWhere(queryParams),
					createdAt: {
						[Op.gte]: timestamp_str_alt(new Date(queryParams.start_date).setHours(0, 0, 0, 0)),
						[Op.lte]: timestamp_str_alt(new Date(queryParams.end_date).setHours(23, 59, 59, 0)),
					}
				},
				include: [
					{
						model: ROLE,
						attributes: ['unique_id', 'name', 'stripped']
					},
				],
				order: [
					[orderBy, sortBy]
				],
				distinct: true,
				offset: pagination.start,
				limit: pagination.limit
			});

			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: api_key, text: "Users Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: api_key, text: "Users loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: api_key, text: err.message }, null);
		}
	}

	async searchRootUsers(req: IGetAuthTypesRequest, res: Response) {
		const api_key: string = req.API_KEY;

		const queryParams: IPagination = req.query;

		const total_records = await USER.count({
			where: {
				[Op.or]: [
					{
						firstname: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					},
					{
						middlename: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					},
					{
						lastname: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					},
					{
						username: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					},
					{
						phone_number: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					},
				]
			}
		});
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await USER.findAndCountAll({
				attributes: { exclude: ['id', 'profile_public_id'] },
				where: {
					[Op.or]: [
						{
							firstname: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
						},
						{
							middlename: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
						},
						{
							lastname: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
						},
						{
							username: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
						},
						{
							phone_number: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
						},
					]
				},
				include: [
					{
						model: ROLE,
						attributes: ['unique_id', 'name', 'stripped']
					},
				],
				order: [
					[orderBy, sortBy]
				],
				distinct: true,
				offset: pagination.start,
				limit: pagination.limit
			});

			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: api_key, text: "Users Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: api_key, text: "Users loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: api_key, text: err.message }, null);
		}
	}

	async publicGetUsers(req: IGetAuthTypesRequest, res: Response) {
		const queryParams: IPagination = req.query;

		const total_records = await USER.count();
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await USER.findAndCountAll({
				attributes: ['unique_id', 'firstname', 'middlename', 'lastname', 'username', 'email', 'phone_number', 'profile_image'],
				include: [
					{
						model: ROLE,
						attributes: ['unique_id', 'name', 'stripped']
					},
				],
				order: [
					[orderBy, sortBy]
				],
				distinct: true,
				offset: pagination.start,
				limit: pagination.limit
			});

			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: anonymous, text: "Users Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: anonymous, text: "Users loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async publicSearchUsers(req: IGetAuthTypesRequest, res: Response) {
		const queryParams: IPagination = req.query;

		const total_records = await USER.count({
			where: {
				[Op.or]: [
					{
						firstname: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					},
					{
						middlename: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					},
					{
						lastname: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					},
					{
						username: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					},
					{
						phone_number: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					},
					{
						business_name: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					},
				]
			}
		});
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await USER.findAndCountAll({
				attributes: ['unique_id', 'firstname', 'middlename', 'lastname', 'username', 'email', 'phone_number', 'profile_image'],
				where: {
					[Op.or]: [
						{
							firstname: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
						},
						{
							middlename: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
						},
						{
							lastname: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
						},
						{
							username: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
						},
						{
							phone_number: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
						},
						{
							business_name: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
						},
					]
				},
				include: [
					{
						model: ROLE,
						attributes: ['unique_id', 'name', 'stripped']
					},
				],
				order: [
					[orderBy, sortBy]
				],
				distinct: true,
				offset: pagination.start,
				limit: pagination.limit
			});

			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: anonymous, text: "Users Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: anonymous, text: "Users loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async publicGetUser(req: IGetAuthTypesRequest, res: Response) {
		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: anonymous, text: "Validation Error Occured" }, errors.array())
		}

		try {
			const response = await USER.findOne({
				attributes: ['unique_id', 'firstname', 'middlename', 'lastname', 'username', 'email', 'phone_number', 'profile_image'],
				where: {
					...payload
				}, 
				include: [
					{
						model: ROLE,
						attributes: ['unique_id', 'name', 'stripped']
					},
				],
			});

			if (!response) {
				return SuccessResponse(res, { unique_id: anonymous, text: "User Not found" }, null);
			} else {
				return SuccessResponse(res, { unique_id: anonymous, text: "User loaded" }, response);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}
	
	async getUsers(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await USER.count();
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await USER.findAndCountAll({
				attributes: { exclude: ['id', 'profile_public_id'] },
				include: [
					{
						model: ROLE,
						attributes: ['unique_id', 'name', 'stripped']
					},
				],
				order: [
					[orderBy, sortBy]
				],
				distinct: true,
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Users", user_unique_id, "Queried Users", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Users Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Users loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getUser(req: IGetAuthTypesRequest, res: Response) {
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
			const response = await USER.findOne({
				attributes: { exclude: ['id', 'profile_public_id'] },
				where: {
					[Op.or]: [
						{ unique_id: payload.unique_id },
						{ email: return_all_letters_lowercase(payload.email) },
						{ phone_number: format_phone_number(payload.phone_number) },
					]
				},
				include: [
					{
						model: ROLE,
						attributes: ['unique_id', 'name', 'stripped']
					},
				],
			});

			addLog("Users", user_unique_id, "Queried User", queryParams);
			if (!response) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "User Not found" }, null);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "User loaded" }, response);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getUsersSpecifically(req: IGetAuthTypesRequest, res: Response) {
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
		
		const total_records = await USER.count({ where: dynamicWhere(queryParams) });
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await USER.findAndCountAll({
				attributes: { exclude: ['id', 'profile_public_id'] },
				where: dynamicWhere(queryParams),
				include: [
					{
						model: ROLE,
						attributes: ['unique_id', 'name', 'stripped']
					},
				],
				order: [
					[orderBy, sortBy]
				],
				distinct: true,
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Users", user_unique_id, "Queried Users specifically", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Users Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Users loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async filterUsersSpecifically(req: IGetAuthTypesRequest, res: Response) {
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
		
		const total_records = await USER.count({
			where: {
				...dynamicWhere(queryParams),
				createdAt: {
					[Op.gte]: timestamp_str_alt(new Date(queryParams.start_date).setHours(0, 0, 0, 0)),
					[Op.lte]: timestamp_str_alt(new Date(queryParams.end_date).setHours(23, 59, 59, 0)),
				}
			}
		});
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await USER.findAndCountAll({
				attributes: { exclude: ['id', 'profile_public_id'] },
				where: {
					...dynamicWhere(queryParams),
					createdAt: {
						[Op.gte]: timestamp_str_alt(new Date(queryParams.start_date).setHours(0, 0, 0, 0)),
						[Op.lte]: timestamp_str_alt(new Date(queryParams.end_date).setHours(23, 59, 59, 0)),
					}
				},
				include: [
					{
						model: ROLE,
						attributes: ['unique_id', 'name', 'stripped']
					},
				],
				order: [
					[orderBy, sortBy]
				],
				distinct: true,
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Users", user_unique_id, "Filtered Users specifically", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Users Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Users loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async searchUsers(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await USER.count({
			where: {
				[Op.or]: [
					{
						firstname: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					},
					{
						middlename: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					},
					{
						lastname: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					},
					{
						username: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					},
					{
						phone_number: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					},
				]
			}
		});
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await USER.findAndCountAll({
				attributes: { exclude: ['id', 'profile_public_id'] },
				where: {
					[Op.or]: [
						{
							firstname: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
						},
						{
							middlename: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
						},
						{
							lastname: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
						},
						{
							username: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
						},
						{
							phone_number: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
						},
					]
				},
				include: [
					{
						model: ROLE,
						attributes: ['unique_id', 'name', 'stripped']
					},
				],
				order: [
					[orderBy, sortBy]
				],
				distinct: true,
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Users", user_unique_id, "Searched Users", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Users Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Users loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getUserProfile(req: IGetAuthTypesRequest, res: Response) {
		const user_unique_id: string = req.USER_UNIQUE_ID;

		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: user_unique_id, text: "Validation Error Occured" }, errors.array())
		}

		try {
			const response = await USER.findOne({
				attributes: { exclude: ['id', 'profile_public_id', 'access', 'status', 'updatedAt'] },
				where: {
					unique_id: user_unique_id,
					status: default_status
				}, 
				include: [
					{
						model: ROLE,
						attributes: ['unique_id', 'name', 'stripped']
					},
				],
			});

			if (!response) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "User Not found" }, null);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "User loaded" }, response);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async addUser(req: IGetAuthTypesRequest, res: Response) {
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
		
		if (!acl_details.add) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized access to add record content" }, null);
		}

		if (!acl_details.elevated_role) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized elevated access to add record content" }, null);
		}

		try {
			const new_user_unique_id = uuidv4(); 

			if (payload.role_unique_id) {
				const role_details = await ROLE.findOne({
					attributes: { exclude: ['id'] },
					where: { unique_id: payload.role_unique_id }
				});
	
				if (!role_details) {
					return BadRequestError(res, { unique_id: user_unique_id, text: "Role Not found" }, null);
				}

				const role_acls = await ROLE_ACL.findAll({
					attributes: { exclude: ['id'] },
					where: {
						role_unique_id: role_details.unique_id,
						status: default_status
					}
				});

				if (role_acls && role_acls.length === 0) {
					return BadRequestError(res, { unique_id: user_unique_id, text: "Role ACLs Not found" }, null);
				}

				const bulkAcls = return_bulk_acls_from_role_acls_array(role_acls, { user_unique_id: new_user_unique_id });
				
				if (bulkAcls) {
					await USER.sequelize?.transaction(async (transaction) => {
						const userResponse = await USER.create({
							unique_id: new_user_unique_id,
							method: "Internal",
							role_unique_id: payload.role_unique_id ? payload.role_unique_id : null,
							firstname: payload.firstname,
							middlename: payload.middlename ? payload.middlename : null,
							lastname: payload.lastname,
							username: payload.username ? payload.username : null,
							email: return_all_letters_lowercase(payload.email),
							phone_number: format_phone_number(payload.phone_number),
							alt_phone_number: payload.alt_phone_number ? format_phone_number(payload.alt_phone_number) : null,
							gender: payload.gender ? payload.gender : null,
							date_of_birth: payload.date_of_birth ? payload.date_of_birth : null,
							address: payload.address ? payload.address : null,
							country: payload.country ? payload.country : null,
							state: payload.state ? payload.state : null,
							city: payload.city ? payload.city : null,
							privates: hashSync(payload.password, 8),
							access: access_granted,
							status: default_status
						}, { transaction });

						const aclsRes = await ACL.bulkCreate(bulkAcls, { transaction });

						addLog("Users", user_unique_id, "Added User", { ...payload, unique_id: new_user_unique_id, acls: bulkAcls });
						if (userResponse && aclsRes.length > 0) {
							return SuccessResponse(res, { unique_id: user_unique_id, text: "User added successfully!" }, null);
						} else {
							throw new Error("Error adding user");
						}
					});
				} else {
					return BadRequestError(res, { unique_id: user_unique_id, text: "Unable to create acls for user role" }, null);
				}
			} else {
				await USER.sequelize?.transaction(async (transaction) => {
					const userResponse = await USER.create({
						unique_id: new_user_unique_id,
						method: "Internal",
						role_unique_id: payload.role_unique_id ? payload.role_unique_id : null,
						firstname: payload.firstname,
						middlename: payload.middlename ? payload.middlename : null,
						lastname: payload.lastname,
						username: payload.username ? payload.username : null,
						email: return_all_letters_lowercase(payload.email),
						phone_number: format_phone_number(payload.phone_number),
						alt_phone_number: payload.alt_phone_number ? format_phone_number(payload.alt_phone_number) : null,
						gender: payload.gender ? payload.gender : null,
						date_of_birth: payload.date_of_birth ? payload.date_of_birth : null,
						address: payload.address ? payload.address : null,
						country: payload.country ? payload.country : null,
						state: payload.state ? payload.state : null,
						city: payload.city ? payload.city : null,
						privates: hashSync(payload.password, 8),
						access: access_granted,
						status: default_status
					}, { transaction });
	
					addLog("Users", user_unique_id, "Added User", { ...payload, unique_id: new_user_unique_id });
					if (userResponse) {
						return SuccessResponse(res, { unique_id: user_unique_id, text: "User added successfully!" }, null);
					} else {
						throw new Error("Error adding user");
					}
				});
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async updateUserEmail(req: IGetAuthTypesRequest, res: Response) {
		const user_unique_id: string = req.USER_UNIQUE_ID;

		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: user_unique_id, text: "Validation Error Occured" }, errors.array())
		}

		try {
			await USER.sequelize?.transaction(async (transaction) => {
				const response = await USER.update(
					{
						email: return_all_letters_lowercase(payload.email),
					}, {
						where: {
							unique_id: user_unique_id,
							status: default_status
						},
						transaction
					}
				);

				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
				} else {
					throw new Error("Error updating details");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async updateUserPhoneNumber(req: IGetAuthTypesRequest, res: Response) {
		const user_unique_id: string = req.USER_UNIQUE_ID;

		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: user_unique_id, text: "Validation Error Occured" }, errors.array())
		}

		try {
			await USER.sequelize?.transaction(async (transaction) => {
				const response = await USER.update(
					{
						phone_number: format_phone_number(payload.phone_number),
					}, {
						where: {
							unique_id: user_unique_id,
							phone_number: null,
							status: default_status
						},
						transaction
					}
				);

				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
				} else {
					throw new Error("Error updating details");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async updateUserAltPhoneNumber(req: IGetAuthTypesRequest, res: Response) {
		const user_unique_id: string = req.USER_UNIQUE_ID;

		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: user_unique_id, text: "Validation Error Occured" }, errors.array())
		}

		try {
			await USER.sequelize?.transaction(async (transaction) => {
				const response = await USER.update(
					{
						alt_phone_number: format_phone_number(payload.alt_phone_number),
					}, {
						where: {
							unique_id: user_unique_id,
							status: default_status
						},
						transaction
					}
				);

				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
				} else {
					throw new Error("Error updating details");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async updateUserNames(req: IGetAuthTypesRequest, res: Response) {
		const user_unique_id: string = req.USER_UNIQUE_ID;

		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: user_unique_id, text: "Validation Error Occured" }, errors.array())
		}

		try {

			await USER.sequelize?.transaction(async (transaction) => {
				const response = await USER.update(
					{
						...payload,
						middlename: payload.middlename ? payload.middlename : null,
					}, {
						where: {
							unique_id: user_unique_id,
							status: default_status
						},
						transaction
					}
				);

				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
				} else {
					throw new Error("Error updating details");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async updateUserDetails(req: IGetAuthTypesRequest, res: Response) {
		const user_unique_id: string = req.USER_UNIQUE_ID;

		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: user_unique_id, text: "Validation Error Occured" }, errors.array())
		}

		try {

			await USER.sequelize?.transaction(async (transaction) => {
				const response = await USER.update(
					{
						phone_number: format_phone_number(payload.phone_number),
						...payload,
						alt_phone_number: payload.alt_phone_number ? format_phone_number(payload.alt_phone_number) : null,
					}, {
						where: {
							unique_id: user_unique_id,
							status: default_status
						},
						transaction
					}
				);

				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
				} else {
					throw new Error("Error updating details");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async rootUpdateUsername(req: IGetAuthTypesRequest, res: Response) {
		const api_key: string = req.API_KEY;

		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: api_key, text: "Validation Error Occured" }, errors.array())
		}

		try {
			const user_details = await USER.findOne({
				attributes: { exclude: ['id'] },
				where: {
					unique_id: payload.unique_id,
					status: default_status
				}
			});

			if (!user_details) {
				return NotFoundError(res, { unique_id: api_key, text: "User Not found" }, null);
			}

			if (user_details.username) {
				return BadRequestError(res, { unique_id: api_key, text: "Username already created" }, null);
			}

			const existing_username_user_details = await USER.findOne({
				attributes: { exclude: ['id'] },
				where: {
					username: return_all_letters_lowercase(payload.username),
					status: default_status
				}
			});

			if (!existing_username_user_details) {
				return BadRequestError(res, { unique_id: api_key, text: "Username already exists" }, null);
			}

			await USER.sequelize?.transaction(async (transaction) => {
				const response = await USER.update(
					{
						username: return_all_letters_lowercase(payload.username),
					}, {
						where: {
							unique_id: user_details.unique_id,
							status: default_status
						},
						transaction
					}
				);

				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: api_key, text: "Details updated successfully!" }, null);
				} else {
					throw new Error("Error updating details");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: api_key, text: err.message }, null);
		}
	}
	
	async updateUsername(req: IGetAuthTypesRequest, res: Response) {
		const user_unique_id: string = req.USER_UNIQUE_ID;

		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: user_unique_id, text: "Validation Error Occured" }, errors.array())
		}

		try {
			const user_details = await USER.findOne({
				attributes: { exclude: ['id'] },
				where: {
					unique_id: user_unique_id,
					status: default_status
				}
			});

			if (!user_details) {
				return NotFoundError(res, { unique_id: user_unique_id, text: "User Not found" }, null);
			}

			if (user_details.username) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Username already created" }, null);
			}

			const existing_username_user_details = await USER.findOne({
				attributes: { exclude: ['id'] },
				where: {
					username: return_all_letters_lowercase(payload.username),
					status: default_status
				}
			});

			if (existing_username_user_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "Username already exists" }, null);
			}

			await USER.sequelize?.transaction(async (transaction) => {
				const response = await USER.update(
					{
						username: return_all_letters_lowercase(payload.username),
					}, {
						where: {
							unique_id: user_unique_id,
							status: default_status
						},
						transaction
					}
				);

				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
				} else {
					throw new Error("Error updating details");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async updateUserAddressDetails(req: IGetAuthTypesRequest, res: Response) {
		const user_unique_id: string = req.USER_UNIQUE_ID;

		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: user_unique_id, text: "Validation Error Occured" }, errors.array())
		}

		try {
			await USER.sequelize?.transaction(async (transaction) => {
				const response = await USER.update(
					{
						country: payload.country,
						state: payload.state,
						city: payload.city,
						address: payload.address ? payload.address : null,
					}, {
						where: {
							unique_id: user_unique_id,
							status: default_status
						},
						transaction
					}
				);

				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
				} else {
					throw new Error("Error updating details");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async updateUserProfileImage(req: IGetAuthTypesRequest, res: Response) {
		const user_unique_id: string = req.USER_UNIQUE_ID;

		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: user_unique_id, text: "Validation Error Occured" }, errors.array())
		}

		try {
			const user_details = await USER.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: user_unique_id }
			});

			if (!user_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "User Not found" }, null);
			}

			await USER.sequelize?.transaction(async (transaction) => {
				const response = await USER.update(
					{
						profile_image: payload.profile_image ? payload.profile_image : null,
						profile_image_public_id: payload.profile_image_public_id ? payload.profile_image_public_id : null,
					}, {
						where: {
							unique_id: user_unique_id,
							status: default_status
						},
						transaction
					}
				);

				if (response[0] > 0) {
					SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);

					// Delete former image available
					if (user_details.profile_image_public_id !== null) {
						await deleteImage(clouder_key || '', { cloudinary_name: cloudy_name, cloudinary_key: cloudy_key, cloudinary_secret: cloudy_secret, public_id: user_details.profile_image_public_id });
					}
				} else {
					throw new Error("Error updating details");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async updateAccessGranted(req: IGetAuthTypesRequest, res: Response) {
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
			await USER.sequelize?.transaction(async (transaction) => {
				const response = await USER.update(
					{
						access: access_granted
					}, {
						where: {
							unique_id: payload.unique_id,
							access: {
								[Op.ne]: access_granted
							},
							status: default_status
						},
						transaction
					}
				);

				addLog("Users", user_unique_id, "Granted User Access", payload);
				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "User's access granted successfully!" }, null);
				} else {
					throw new Error("User access already granted");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async updateAccessSuspended(req: IGetAuthTypesRequest, res: Response) {
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
			await USER.sequelize?.transaction(async (transaction) => {
				const response = await USER.update(
					{
						access: access_suspended
					}, {
						where: {
							unique_id: payload.unique_id,
							access: {
								[Op.ne]: access_suspended
							},
							status: default_status
						},
						transaction
					}
				);

				addLog("Users", user_unique_id, "Suspended User Access", payload);
				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "User's access suspended successfully!" }, null);
				} else {
					throw new Error("User access already suspended");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async updateAccessRevoked(req: IGetAuthTypesRequest, res: Response) {
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
			await USER.sequelize?.transaction(async (transaction) => {
				const response = await USER.update(
					{
						access: access_revoked
					}, {
						where: {
							unique_id: payload.unique_id,
							access: {
								[Op.ne]: access_revoked
							},
							status: default_status
						},
						transaction
					}
				);

				addLog("Users", user_unique_id, "Revoked User Access", payload);
				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "User's access revoked successfully!" }, null);
				} else {
					throw new Error("User access already revoked");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async updateUserRole(req: IGetAuthTypesRequest, res: Response) {
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
			const user_details = await USER.findOne({
				attributes: { exclude: ['id'] },
				where: {
					unique_id: payload.unique_id,
					status: default_status
				}
			});

			if (!user_details) {
				return NotFoundError(res, { unique_id: user_unique_id, text: "User Not found" }, null);
			}

			if (user_details.role_unique_id) {
				const role_details = await ROLE.findOne({
					attributes: { exclude: ['id'] },
					where: { unique_id: payload.role_unique_id }
				});
	
				if (!role_details) {
					return BadRequestError(res, { unique_id: user_unique_id, text: "Role Not found" }, null);
				}

				const acl_details = await ACL.findOne({
					attributes: { exclude: ['id'] },
					where: { 
						user_unique_id: user_details.unique_id, 
						role_unique_id: user_details.role_unique_id 
					}
				});
	
				// if (!acl_details) {
				// 	return BadRequestError(res, { unique_id: user_unique_id, text: "Role Not found" }, null);
				// }

				const role_acls = await ROLE_ACL.findAll({
					attributes: { exclude: ['id'] },
					where: {
						role_unique_id: role_details.unique_id,
						status: default_status
					}
				});

				if (role_acls && role_acls.length === 0) {
					return BadRequestError(res, { unique_id: user_unique_id, text: "Role ACLs Not found" }, null);
				}

				const bulkAcls = return_bulk_acls_from_role_acls_array(role_acls, { user_unique_id: user_details.unique_id });
				
				if (bulkAcls) {
					if (acl_details) {
						await USER.sequelize?.transaction(async (transaction) => {
							const removeCurrentAcls = await ACL.destroy( { where: { user_unique_id: user_details.unique_id, role_unique_id: user_details.role_unique_id, status: default_status }, transaction } );

							const response = await USER.update(
								{
									role_unique_id: role_details.unique_id
								}, {
									where: {
										unique_id: payload.unique_id,
										status: default_status
									},
									transaction
								}
							);
	
							const aclsRes = await ACL.bulkCreate(bulkAcls, { transaction });
							
							addLog("Users", user_unique_id, "Updated User Role & Acls", { ...payload, unique_id: user_details.unique_id, acls: bulkAcls });
							if (removeCurrentAcls > 0 && response[0] > 0 && aclsRes.length > 0) {
								return SuccessResponse(res, { unique_id: user_unique_id, text: "Role updated successfully!" }, null);
							} else {
								throw new Error("Error updating user role");
							}
						});
					} else {
						await USER.sequelize?.transaction(async (transaction) => {
							const response = await USER.update(
								{
									role_unique_id: role_details.unique_id
								}, {
									where: {
										unique_id: payload.unique_id,
										status: default_status
									},
									transaction
								}
							);
	
							const aclsRes = await ACL.bulkCreate(bulkAcls, { transaction });
							
							addLog("Users", user_unique_id, "Updated User Role & Acls", { ...payload, unique_id: user_details.unique_id, acls: bulkAcls });
							if (response[0] > 0 && aclsRes.length > 0) {
								return SuccessResponse(res, { unique_id: user_unique_id, text: "Role updated successfully!" }, null);
							} else {
								throw new Error("Error updating user role");
							}
						});
					}
				} else {
					return BadRequestError(res, { unique_id: user_unique_id, text: "Unable to create acls for user role" }, null);
				}
			} else {
				const role_details = await ROLE.findOne({
					attributes: { exclude: ['id'] },
					where: { unique_id: payload.role_unique_id }
				});
	
				if (!role_details) {
					return BadRequestError(res, { unique_id: user_unique_id, text: "Role Not found" }, null);
				}

				const role_acls = await ROLE_ACL.findAll({
					attributes: { exclude: ['id'] },
					where: {
						role_unique_id: role_details.unique_id,
						status: default_status
					}
				});

				if (role_acls && role_acls.length === 0) {
					return BadRequestError(res, { unique_id: user_unique_id, text: "Role ACLs Not found" }, null);
				}

				const bulkAcls = return_bulk_acls_from_role_acls_array(role_acls, { user_unique_id: user_details.unique_id });
				
				if (bulkAcls) {
					await USER.sequelize?.transaction(async (transaction) => {
						const response = await USER.update(
							{
								role_unique_id: role_details.unique_id
							}, {
								where: {
									unique_id: payload.unique_id,
									status: default_status
								},
								transaction
							}
						);

						const aclsRes = await ACL.bulkCreate(bulkAcls, { transaction });
						
						addLog("Users", user_unique_id, "Updated User Role & Acls", { ...payload, unique_id: user_details.unique_id, acls: bulkAcls });
						if (response[0] > 0 && aclsRes.length > 0) {
							return SuccessResponse(res, { unique_id: user_unique_id, text: "Role updated successfully!" }, null);
						} else {
							throw new Error("Error updating user role");
						}
					});
				} else {
					return BadRequestError(res, { unique_id: user_unique_id, text: "Unable to create acls for user role" }, null);
				}
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async deleteUser(req: IGetAuthTypesRequest, res: Response) {
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
		
		if (!acl_details.elevated_role) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized elevated access to delete record content" }, null);
		}

		try {
			const user_details = await USER.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			if (!user_details) {
				return BadRequestError(res, { unique_id: user_unique_id, text: "User Not found" }, null);
			}

			await USER.sequelize?.transaction(async (transaction) => {
				const response = await USER.destroy(
					{
						where: {
							unique_id: payload.unique_id,
							status: default_status
						}
					}
				);

				addLog("Users", user_unique_id, "Deleted User", payload);
				if (response > 0) {
					SuccessResponse(res, { unique_id: user_unique_id, text: "User was deleted successfully!" }, null);

					// Delete former image available
					if (user_details.profile_public_id !== null) {
						await deleteImage(clouder_key || '', { cloudinary_name: cloudy_name, cloudinary_key: cloudy_key, cloudinary_secret: cloudy_secret, public_id: user_details.profile_public_id });
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
