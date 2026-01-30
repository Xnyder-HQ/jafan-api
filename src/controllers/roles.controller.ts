import { Request, Response } from "express";
import { Op } from "sequelize";
import { validationResult, matchedData } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import ACL, { IACL } from "../models/acls.model";
import MODULE, { IModule } from "../models/modules.model";
import SUB_MODULE, { ISubModule } from "../models/subModules.model";
import ROLE, { IRole } from "../models/roles.model";
import { addLog } from "./logs.controller";
import { IGetAuthTypesRequest } from "../middleware/checks";
import { ServerError, SuccessResponse, ValidationError, OtherSuccessResponse, NotFoundError, BadRequestError, logger, UnauthorizedError } from '../common/index';
import {
	IPagination, ISearch, default_status, paginate, return_all_letters_uppercase, anonymous, true_status, false_status, strip_text, timestamp_str_alt,
	dynamicWhere
} from '../config/config';

export default class RoleController {
	async getRoles(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await ROLE.count();
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await ROLE.findAndCountAll({
				attributes: { exclude: ['id', 'description'] },
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Roles", user_unique_id, "Queried Roles", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Roles Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Roles loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getRole(req: IGetAuthTypesRequest, res: Response) {
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
			const response = await ROLE.findOne({
				attributes: { exclude: ['id'] },
				where: { unique_id: payload.unique_id }
			});

			addLog("Roles", user_unique_id, "Queried Role", queryParams);
			if (!response) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Role Not found" }, null);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Role loaded" }, response);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async searchRoles(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await ROLE.count({
			where: {
				[Op.or]: [
					{
						name: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					}
				]
			}
		});
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await ROLE.findAndCountAll({
				attributes: { exclude: ['id', 'description'] },
				where: {
					[Op.or]: [
						{
							name: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
						}
					]
				},
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Roles", user_unique_id, "Searched Roles", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Roles Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Roles loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getRolesSpecifically(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await ROLE.count({ where: dynamicWhere(queryParams) });
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await ROLE.findAndCountAll({
				attributes: { exclude: ['id', 'description'] },
				where: dynamicWhere(queryParams),
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Roles", user_unique_id, "Queried Roles Specifically", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Roles Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Roles loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async filterRolesSpecifically(req: IGetAuthTypesRequest, res: Response) {
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

		const total_records = await ROLE.count({
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
			const response = await ROLE.findAndCountAll({
				attributes: { exclude: ['id', 'description'] },
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

			addLog("Roles", user_unique_id, "Filtered Roles Specifically", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Roles Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Roles loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async publicGetRoles(req: IGetAuthTypesRequest, res: Response) {
		const queryParams: IPagination = req.query;

		const total_records = await ROLE.count({ where: { status: default_status } });
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await ROLE.findAndCountAll({
				attributes: { exclude: ['id', 'status'] },
				where: { status: default_status },
				order: [
					[orderBy, sortBy]
				],
				// offset: pagination.start,
				// limit: pagination.limit
			});

			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: anonymous, text: "Roles Not found" }, []);
			} else {
				// return SuccessResponse(res, { unique_id: anonymous, text: "Roles loaded" }, { ...response, pages: pagination.pages });
				return SuccessResponse(res, { unique_id: anonymous, text: "Roles loaded" }, { ...response });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async publicGetRole(req: IGetAuthTypesRequest, res: Response) {
		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: anonymous, text: "Validation Error Occured" }, errors.array())
		}

		try {
			const response = await ROLE.findOne({
				attributes: { exclude: ['id', 'status'] },
				where: { ...payload }
			});

			if (!response) {
				return SuccessResponse(res, { unique_id: anonymous, text: "Role Not found" }, null);
			} else {
				return SuccessResponse(res, { unique_id: anonymous, text: "Role loaded" }, response);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async publicSearchRoles(req: IGetAuthTypesRequest, res: Response) {
		const queryParams: IPagination = req.query;

		const total_records = await ROLE.count({
			where: {
				[Op.or]: [
					{
						name: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
					}
				]
			}
		});
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await ROLE.findAndCountAll({
				attributes: { exclude: ['id', 'status'] },
				where: {
					[Op.or]: [
						{
							name: { [Op.or]: { [Op.like]: `%${queryParams.search}`, [Op.startsWith]: `${queryParams.search}`, [Op.endsWith]: `${queryParams.search}`, [Op.substring]: `${queryParams.search}` } }
						}
					]
				},
				order: [
					[orderBy, sortBy]
				],
				// offset: pagination.start,
				// limit: pagination.limit
			});

			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: anonymous, text: "Roles Not found" }, []);
			} else {
				// return SuccessResponse(res, { unique_id: anonymous, text: "Roles loaded" }, { ...response, pages: pagination.pages });
				return SuccessResponse(res, { unique_id: anonymous, text: "Roles loaded" }, { ...response });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: anonymous, text: err.message }, null);
		}
	}

	async addRole(req: IGetAuthTypesRequest, res: Response) {
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

		if (!acl_details.elevated_role) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized elevated access to add record content" }, null);
		}

		try {
			const role_unique_id = uuidv4();

			await ROLE.sequelize?.transaction(async (transaction) => {
				const roleResponse = await ROLE.create({
					unique_id: role_unique_id,
					name: payload.name,
					stripped: strip_text(payload.name),
					description: payload.description ? payload.description : null,
					status: default_status
				}, { transaction });

				addLog("Roles", user_unique_id, "Added Role", payload);
				if (roleResponse) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Role created successfully!" }, { unique_id: role_unique_id });
				} else {
					throw new Error("Error adding role");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async updateRoleDetails(req: IGetAuthTypesRequest, res: Response) {
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
			await ROLE.sequelize?.transaction(async (transaction) => {
				const response = await ROLE.update(
					{
						...payload,
						stripped: strip_text(payload.name),
						description: payload.description ? payload.description : null,
					}, {
						where: {
							unique_id: payload.unique_id,
							status: default_status
						},
						transaction
					}
				);

				addLog("Roles", user_unique_id, "Updated Role Details", payload);
				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Details updated successfully!" }, null);
				} else {
					throw new Error("Role not found");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async deleteRole(req: IGetAuthTypesRequest, res: Response) {
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
			await ROLE.sequelize?.transaction(async (transaction) => {
				const response = await ROLE.destroy(
					{
						where: {
							unique_id: payload.unique_id,
							status: default_status
						},
						transaction
					}
				);

				addLog("Roles", user_unique_id, "Deleted Role", payload);
				if (response > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Role was deleted successfully!" }, null);
				} else {
					throw new Error("Error deleting record");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}
};
