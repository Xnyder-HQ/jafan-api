import { Request, Response } from "express";
import { validationResult, matchedData } from 'express-validator';
import moment from 'moment';
import axios from 'axios';
import dotenv from 'dotenv';
import bycrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import { v4 as uuidv4 } from 'uuid';
import ROLE, { IRole } from "../models/roles.model";
import ACL, { IACL } from "../models/acls.model";
import MODULE, { IModule } from "../models/modules.model";
import SUB_MODULE, { ISubModule } from "../models/subModules.model";
import USER, { IUser } from "../models/users.model";
import { addLog } from "./logs.controller";
import { IGetAuthTypesRequest } from "../middleware/checks";
import { ServerError, SuccessResponse, ValidationError, OtherSuccessResponse, NotFoundError, UnauthorizedError, ForbiddenError, BadRequestError, logger } from '../common/index';
import {
	IPagination, ISearch, default_status, random_uuid, access_granted, true_status, false_status, random_numbers, zero, validate_future_end_date, language, 
	format_phone_number, primary_domain, mailer_url, return_all_letters_lowercase, access_suspended, access_revoked
} from '../config/config';
import { user_reset_password } from '../config/templates';

dotenv.config();

const { cloud_mailer_key, host_type, smtp_host, cloud_mailer_username, cloud_mailer_password, from_email } = process.env;

const { secret } = process.env;

const { sign } = jwt;
const { hashSync } = bycrypt;
const { compareSync } = bycrypt;

export default class AuthController {
	async userSignUp(req: IGetAuthTypesRequest, res: Response) {
		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: payload.email, text: "Validation Error Occured" }, errors.array());
		}

		try {
			const user_unique_id = uuidv4();

			await USER.sequelize?.transaction(async (transaction) => {
				const userResponse = await USER.create({
					unique_id: user_unique_id,
					method: "Signup",
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

				if (userResponse) {
					return SuccessResponse(res, { unique_id: user_unique_id, text: "Signed up successfully!" }, null);
				} else {
					throw new Error("Error signing up");
				}
			});
		} catch (err: any) {
			return ServerError(res, { unique_id: payload.email, text: err.message }, null);
		}
	}

	async userSignInViaEmail(req: IGetAuthTypesRequest, res: Response) {
		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: payload.email, text: "Validation Error Occured" }, errors.array());
		}

		try {
			const user_details = await USER.findOne({
				attributes: { exclude: ['id'] },
				where: {
					email: return_all_letters_lowercase(payload.email),
					status: default_status
				}
			});

			if (!user_details) {
				return NotFoundError(res, { unique_id: payload.email, text: "User not found" }, null);
			} else if (user_details.access === access_suspended) {
				return ForbiddenError(res, { unique_id: payload.email, text: "Account has been suspended" }, null);
			} else if (user_details.access === access_revoked) {
				return ForbiddenError(res, { unique_id: payload.email, text: "Account access has been revoked" }, null);
			} else if (user_details.email_verification === false_status) {
				return ForbiddenError(res, { unique_id: payload.email, text: "Unverified email" }, null);
			} else if (!user_details.privates) {
				return ForbiddenError(res, { unique_id: payload.email, text: "Unable to verify password" }, null);
			} else {
				const passwordIsValid = compareSync(payload.password, user_details.privates);
				
				if (!passwordIsValid) {
					return UnauthorizedError(res, { unique_id: payload.email, text: "Invalid Password!" }, null);
				} else {
					const user_acls = await ACL.findAll({
						attributes: { exclude: ['id'] },
						where: {
							user_unique_id: user_details.unique_id,
							status: default_status
						}, 
						include: [
							{
								model: ROLE,
								attributes: ['unique_id', 'name', 'stripped']
							},
							{
								model: MODULE,
								attributes: ['unique_id', 'name', 'stripped']
							},
							{
								model: SUB_MODULE,
								attributes: ['unique_id', 'name', 'stripped']
							},
						]
					});

					addLog("Authentication", user_details.unique_id, "Signin Via Email", { email: payload.email });
					
					const token = sign({ user_unique_id: user_details.unique_id }, secret || '', {
						expiresIn: payload.remember_me ? 604800 /* 7 days */ : 86400 // 24 hours
					});

					const return_data = {
						token,
						fullname: user_details.firstname + (user_details.middlename !== null ? " " + user_details.middlename + " " : " ") + user_details.lastname,
						acls: user_acls
					};
					return SuccessResponse(res, { unique_id: user_details.unique_id, text: "Logged in successfully!" }, return_data);
				}
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: payload.email, text: err.message }, null);
		}
	}

	async userSignIn(req: IGetAuthTypesRequest, res: Response) {
		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: payload.login_id, text: "Validation Error Occured" }, errors.array());
		}

		try {
			const user_details = await USER.findOne({
				attributes: { exclude: ['id'] },
				where: {
					[Op.or]: [
						{
							email: payload.login_id,
						}, 
						{
							username: payload.login_id,
						},
						{
							phone_number: payload.login_id,
						}
					],
					status: default_status
				}
			});

			if (!user_details) {
				return NotFoundError(res, { unique_id: payload.login_id, text: "User not found" }, null);
			} else if (user_details.access === access_suspended) {
				return ForbiddenError(res, { unique_id: payload.login_id, text: "Account has been suspended" }, null);
			} else if (user_details.access === access_revoked) {
				return ForbiddenError(res, { unique_id: payload.login_id, text: "Account access has been revoked" }, null);
			} else if (user_details.email_verification === false_status) {
				return ForbiddenError(res, { unique_id: payload.login_id, text: "Unverified email" }, null);
			} else if (!user_details.privates) {
				return ForbiddenError(res, { unique_id: payload.login_id, text: "Unable to verify password" }, null);
			} else {
				const passwordIsValid = compareSync(payload.password, user_details.privates);
				
				if (!passwordIsValid) {
					return UnauthorizedError(res, { unique_id: payload.login_id, text: "Invalid Password!" }, null);
				} else {
					const user_acls = await ACL.findAll({
						attributes: { exclude: ['id'] },
						where: {
							user_unique_id: user_details.unique_id,
							status: default_status
						}, 
						include: [
							{
								model: ROLE,
								attributes: ['unique_id', 'name', 'stripped']
							},
							{
								model: MODULE,
								attributes: ['unique_id', 'name', 'stripped']
							},
							{
								model: SUB_MODULE,
								attributes: ['unique_id', 'name', 'stripped']
							},
						]
					});

					addLog("Authentication", user_details.unique_id, "Signin Via Other", { login_id: payload.login_id });

					const token = sign({ user_unique_id: user_details.unique_id }, secret || '', {
						expiresIn: payload.remember_me ? 604800 /* 7 days */ : 86400 // 24 hours
					});

					const return_data = {
						token,
						fullname: user_details.firstname + (user_details.middlename !== null ? " " + user_details.middlename + " " : " ") + user_details.lastname,
						acls: user_acls
					};
					return SuccessResponse(res, { unique_id: user_details.unique_id, text: "Logged in successfully!" }, return_data);
				}
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: payload.login_id, text: err.message }, null);
		}
	}

	async passwordRecovery(req: IGetAuthTypesRequest, res: Response) {
		const errors = validationResult(req);
		const payload = matchedData(req);

		if (!errors.isEmpty()) {
			return ValidationError(res, { unique_id: payload.login_id, text: "Validation Error Occured" }, errors.array());
		}

		try {
			
			const user_details = await USER.findOne({
				attributes: { exclude: ['id'] },
				where: {
					[Op.or]: [
						{
							email: payload.login_id,
						}, 
						{
							username: payload.login_id,
						},
						{
							phone_number: payload.login_id,
						}
					],
					status: default_status
				},
			});

			if (!user_details) {
				return NotFoundError(res, { unique_id: payload.login_id, text: "User Not found" }, null);
			} else if (user_details.access === access_suspended) {
				return ForbiddenError(res, { unique_id: payload.login_id, text: "Account has been suspended" }, null);
			} else if (user_details.access === access_revoked) {
				return ForbiddenError(res, { unique_id: payload.login_id, text: "Account access has been revoked" }, null);
			} else {
				const new_password = random_uuid(6).toUpperCase();

				const { email_html, email_subject, email_text } = user_reset_password({ new_password });
				
				const mailer_response = await axios.post(
					`${mailer_url}/send`,
					{
						host_type: host_type,
						smtp_host: smtp_host,
						username: cloud_mailer_username,
						password: cloud_mailer_password,
						from_email: from_email,
						to_email: return_all_letters_lowercase(user_details.email),
						subject: email_subject,
						text: email_text,
						html: email_html
					},
					{
						headers: {
							'mailer-access-key': cloud_mailer_key
						}
					}
				);
	
				if (mailer_response.data.success) {
					if (mailer_response.data.data === null) {
						return BadRequestError(res, { unique_id: payload.login_id, text: "Unable to send email to user" }, null);
					} else {
						await USER.sequelize?.transaction(async (transaction) => {
							const userResponse = await USER.update(
								{
									privates: hashSync(new_password, 8)
								}, {
									where: {
										unique_id: user_details.unique_id,
										status: default_status
									},  
									transaction
								}
							);
			
							addLog("Authentication", user_details.unique_id, "Password Recovery", { login_id: payload.login_id });
							if (userResponse[0] > 0) {
								return SuccessResponse(res, { unique_id: payload.login_id, text: `User's password changed successfully` }, null);
							} else {
								throw new Error("Error generating password");
							}
						});
					}
				} else {
					BadRequestError(res, { unique_id: payload.login_id, text: mailer_response.data.message }, null);
				}
			}
		} catch (err: any) {
			return ServerError(res, { unique_id: payload.login_id, text: err.message }, null);
		}
	}

};