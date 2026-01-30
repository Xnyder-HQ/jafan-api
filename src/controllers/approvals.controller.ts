import { Request, Response } from "express";
import { Op } from "sequelize";
import { validationResult, matchedData } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import APPROVAL, { IApproval } from "../models/approvals.model";
import ACL, { IACL } from "../models/acls.model";
import MODULE, { IModule } from "../models/modules.model";
import SUB_MODULE, { ISubModule } from "../models/subModules.model";
import USER, { IUser } from "../models/users.model";
import ROLE, { IRole } from "../models/roles.model";
import { addLog } from "./logs.controller";
import { IGetAuthTypesRequest } from "../middleware/checks";
import { ServerError, SuccessResponse, ValidationError, OtherSuccessResponse, NotFoundError, BadRequestError, logger, UnauthorizedError } from '../common/index';
import {
	IPagination, ISearch, default_status, paginate, return_all_letters_uppercase, anonymous, true_status, false_status, strip_text, timestamp_str_alt,
	dynamicWhere, pending, approved, denied
} from '../config/config';

export default class ApprovalController {
	async getApprovals(req: IGetAuthTypesRequest, res: Response) {
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

		if (!acl_details.elevated_role) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized elevated access to view record content" }, null);
		}

		const total_records = await APPROVAL.count();
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await APPROVAL.findAndCountAll({
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
						model: MODULE,
						attributes: ['unique_id', 'name', 'stripped']
					},
					{
						model: SUB_MODULE,
						attributes: ['unique_id', 'name', 'stripped']
					}
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Approvals", user_unique_id, "Queried Approvals", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Approvals Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Approvals loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getApproval(req: IGetAuthTypesRequest, res: Response) {
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

		if (!acl_details.elevated_role) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized elevated access to view record content" }, null);
		}

		try {
			const response = await APPROVAL.findOne({
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
						model: MODULE,
						attributes: ['unique_id', 'name', 'stripped']
					},
					{
						model: SUB_MODULE,
						attributes: ['unique_id', 'name', 'stripped']
					}
				], 
			});

			addLog("Approvals", user_unique_id, "Queried Approval", queryParams);
			if (!response) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Approval Not found" }, null);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Approval loaded" }, response);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getApprovalsSpecifically(req: IGetAuthTypesRequest, res: Response) {
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

		if (!acl_details.elevated_role) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized elevated access to view record content" }, null);
		}

		const total_records = await APPROVAL.count({ where: dynamicWhere(queryParams) });
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await APPROVAL.findAndCountAll({
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
						model: MODULE,
						attributes: ['unique_id', 'name', 'stripped']
					},
					{
						model: SUB_MODULE,
						attributes: ['unique_id', 'name', 'stripped']
					}
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Approvals", user_unique_id, "Queried Approvals specifically", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Approvals Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Approvals loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async filterApprovalsSpecifically(req: IGetAuthTypesRequest, res: Response) {
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

		if (!acl_details.elevated_role) {
			return UnauthorizedError(res, { unique_id: user_unique_id, text: "Unauthorized elevated access to view record content" }, null);
		}

		const total_records = await APPROVAL.count({
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
			const response = await APPROVAL.findAndCountAll({
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
						model: MODULE,
						attributes: ['unique_id', 'name', 'stripped']
					},
					{
						model: SUB_MODULE,
						attributes: ['unique_id', 'name', 'stripped']
					}
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Approvals", user_unique_id, "Filtered Approvals specifically", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Approvals Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Approvals loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getUserApprovals(req: IGetAuthTypesRequest, res: Response) {
		const user_unique_id: string = req.USER_UNIQUE_ID;

		const queryParams: IPagination = req.query;

		const total_records = await APPROVAL.count({ where: { user_unique_id } });
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await APPROVAL.findAndCountAll({
				attributes: { exclude: ['id'] },
				where: { user_unique_id },
				include: [
					{
						model: MODULE,
						attributes: ['unique_id', 'name', 'stripped']
					},
					{
						model: SUB_MODULE,
						attributes: ['unique_id', 'name', 'stripped']
					}
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Approvals", user_unique_id, "Queried User Approvals", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "User Approvals Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "User Approvals loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getUserApproval(req: IGetAuthTypesRequest, res: Response) {
		const user_unique_id: string = req.USER_UNIQUE_ID;

		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: user_unique_id, text: "Validation Error Occured" }, errors.array())
		}

		const queryParams: IPagination = req.query;

		try {
			const response = await APPROVAL.findOne({
				attributes: { exclude: ['id'] },
				where: { user_unique_id, unique_id: payload.unique_id }, 
				include: [
					{
						model: MODULE,
						attributes: ['unique_id', 'name', 'stripped']
					},
					{
						model: SUB_MODULE,
						attributes: ['unique_id', 'name', 'stripped']
					}
				], 
			});

			addLog("Approvals", user_unique_id, "Queried User Approval", queryParams);
			if (!response) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "User Approval Not found" }, null);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "User Approval loaded" }, response);
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async getUserApprovalsSpecifically(req: IGetAuthTypesRequest, res: Response) {
		const user_unique_id: string = req.USER_UNIQUE_ID;

		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: user_unique_id, text: "Validation Error Occured" }, errors.array())
		}

		const queryParams: IPagination = req.query;

		const total_records = await APPROVAL.count({ where: { user_unique_id, ...dynamicWhere(queryParams) } });
		const pagination = paginate(queryParams.page || parseInt(req.body.page), queryParams.size || parseInt(req.body.size), total_records);
		const orderBy = queryParams.orderBy || req.body.orderBy || "createdAt";
		const sortBy = return_all_letters_uppercase(queryParams.sortBy) || return_all_letters_uppercase(req.body.sortBy) || "DESC";

		try {
			const response = await APPROVAL.findAndCountAll({
				attributes: { exclude: ['id'] },
				where: { user_unique_id, ...dynamicWhere(queryParams) },
				include: [
					{
						model: MODULE,
						attributes: ['unique_id', 'name', 'stripped']
					},
					{
						model: SUB_MODULE,
						attributes: ['unique_id', 'name', 'stripped']
					}
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Approvals", user_unique_id, "Queried User Approvals specifically", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Approvals Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Approvals loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async filterUserApprovalsSpecifically(req: IGetAuthTypesRequest, res: Response) {
		const user_unique_id: string = req.USER_UNIQUE_ID;

		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: user_unique_id, text: "Validation Error Occured" }, errors.array())
		}

		const queryParams: IPagination = req.query;

		const total_records = await APPROVAL.count({ 
			where: {
				user_unique_id, 
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
			const response = await APPROVAL.findAndCountAll({
				attributes: { exclude: ['id'] },
				where: {
					user_unique_id, 
					...dynamicWhere(queryParams),
					createdAt: {
						[Op.gte]: timestamp_str_alt(new Date(payload.start_date).setHours(0, 0, 0, 0)),
						[Op.lte]: timestamp_str_alt(new Date(payload.end_date).setHours(23, 59, 59, 0)),
					}
				}, 
				include: [
					{
						model: MODULE,
						attributes: ['unique_id', 'name', 'stripped']
					},
					{
						model: SUB_MODULE,
						attributes: ['unique_id', 'name', 'stripped']
					}
				], 
				order: [
					[orderBy, sortBy]
				],
				offset: pagination.start,
				limit: pagination.limit
			});

			addLog("Approvals", user_unique_id, "Filtered User Approvals specifically", queryParams);
			if (response.count === 0) {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Approvals Not found" }, []);
			} else {
				return SuccessResponse(res, { unique_id: user_unique_id, text: "Approvals loaded" }, { ...response, pages: pagination.pages });
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async addApproval(req: IGetAuthTypesRequest, res: Response) {
		const user_unique_id: string = req.USER_UNIQUE_ID;

		const errors = validationResult(req);
		const payload = matchedData(req, { locations: ["body"] });

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: user_unique_id, text: "Validation Error Occured" }, errors.array());
		}

		try {
			const approval_unique_id = uuidv4();

			await APPROVAL.sequelize?.transaction(async (transaction) => {
				const approvalResponse = await APPROVAL.create({
					unique_id: approval_unique_id,
					user_unique_id: user_unique_id,
					module_unique_id: payload.module_unique_id,
					sub_module_unique_id: payload.sub_module_unique_id ? payload.sub_module_unique_id : null,
					view: payload.view,
					add: payload.add,
					edit: payload.edit,
					delete: payload.delete,
					elevated_role: payload.elevated_role,
					acl_expiring: payload.acl_expiring,
					approval_status: pending,
					status: default_status
				}, { transaction });

				addLog("Approvals", user_unique_id, "Added Approval", payload);
				if (approvalResponse) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Approval created successfully!" }, { unique_id: approval_unique_id });
				} else {
					throw new Error("Error adding approval");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async acceptApproval(req: IGetAuthTypesRequest, res: Response) {
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

		const approval_details = await APPROVAL.findOne({
			attributes: { exclude: ['id'] },
			where: {
				unique_id: payload.unique_id,
				approval_status: pending,
				status: default_status
			}
		});

		if (!approval_details) {
			return NotFoundError(res, { unique_id: user_unique_id, text: "Approval Not found" }, null);
		} 

		try {
			await APPROVAL.sequelize?.transaction(async (transaction) => {
				const response = await APPROVAL.update(
					{
						approval_status: approved,
					}, {
						where: {
							unique_id: payload.unique_id,
							approval_status: pending,
							status: default_status
						},
						transaction
					}
				);

				const aclResponse = await ACL.create({
					unique_id: uuidv4(),
					user_unique_id: approval_details.user_unique_id,
					module_unique_id: approval_details.module_unique_id,
					sub_module_unique_id: approval_details.sub_module_unique_id ? approval_details.sub_module_unique_id : null,
					view: approval_details.view,
					add: approval_details.add,
					edit: approval_details.edit,
					delete: approval_details.delete,
					elevated_role: approval_details.elevated_role,
					acl_expiring: payload.acl_expiring ? payload.acl_expiring : approval_details.acl_expiring,
					status: default_status
				}, { transaction });

				addLog("Approvals", user_unique_id, "Accepted Approval", payload);
				if (aclResponse && response[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Approval accepted successfully!" }, null);
				} else {
					throw new Error("Approval not found");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async denyApproval(req: IGetAuthTypesRequest, res: Response) {
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
			await APPROVAL.sequelize?.transaction(async (transaction) => {
				const response = await APPROVAL.update(
					{
						approval_status: denied,
					}, {
						where: {
							unique_id: payload.unique_id,
							approval_status: pending,
							status: default_status
						},
						transaction
					}
				);

				addLog("Approvals", user_unique_id, "Denied Approval", payload);
				if (response[0] > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Approval denied successfully!" }, null);
				} else {
					throw new Error("Approval not found");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}

	async deleteApproval(req: IGetAuthTypesRequest, res: Response) {
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
			await APPROVAL.sequelize?.transaction(async (transaction) => {
				const response = await APPROVAL.destroy(
					{
						where: {
							unique_id: payload.unique_id,
							status: default_status
						},
						transaction
					}
				);

				addLog("Approvals", user_unique_id, "Deleted Approval", payload);
				if (response > 0) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Approval was deleted successfully!" }, null);
				} else {
					throw new Error("Error deleting record");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: user_unique_id, text: err.message }, null);
		}
	}
};
