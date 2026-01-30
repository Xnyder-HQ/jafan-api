import { Request, Response, NextFunction } from "express";
import dotenv from 'dotenv';
import process from "node:process";
import jwt from "jsonwebtoken";
import { UnauthorizedError, ForbiddenError, logger, BadRequestError, SuccessResponse } from '../common/index';
import API_KEY, { IApiKey } from "../models/apiKeys.model";
import USER, { IUser } from "../models/users.model";
import { 
	default_status, default_delete_status, jafan_header_key, jafan_header_token, tag_root, tag_internal_api_key,
	access_granted, access_suspended
} from "../config/config";

dotenv.config();

const { secret } = process.env;

const { verify } = jwt;

export interface IGetAuthTypesRequest extends Request {
	API_KEY: string,
	USER_UNIQUE_ID: string, 
}

const verifyKey = (req: IGetAuthTypesRequest, res: Response, next: NextFunction) => {
	const key = req.headers[jafan_header_key] || req.query.key || req.body.key || '';
	if (!key) {
		ForbiddenError(res, "No key provided!", null);
	} else {
		req.API_KEY = key;
		next();
	}
};

const verifyModule = (req: IGetAuthTypesRequest, res: Response, next: NextFunction) => {
	const module_unique_id = req.query.module_unique_id || '';
	if (!module_unique_id) {
		BadRequestError(res, "No module found!", null);
	} else {
		next();
	}
};

const verifyToken = (req: IGetAuthTypesRequest, res: Response, next: NextFunction) => {
	const token = req.headers[jafan_header_token] || req.query.token || req.body.token || '';
	if (!token) {
		ForbiddenError(res, "No token provided!", null);
	} else {
		if (!secret) {
			UnauthorizedError(res, "Server configuration error: secret is not defined!", null);
			return;
		}
		verify(token, secret, (err: any, decoded: any) => {
			if (err) {
				UnauthorizedError(res, "Unauthorized!", null);
			} else {
				if (!decoded.user_unique_id) {
					UnauthorizedError(res, "Invalid token!", null);
				} else {
					req.USER_UNIQUE_ID = decoded.user_unique_id;
					next();
				}
			}
		});
	}
};

const isUser = (req: IGetAuthTypesRequest, res: Response, next: NextFunction) => {
	USER.findOne({
		where: {
			unique_id: req.USER_UNIQUE_ID
		}
	}).then(user => {
		if (!user) {
			ForbiddenError(res, "Require User!", null);
		} else if (user.status === default_delete_status) {
			ForbiddenError(res, "User not available!", null);
		} else if (user.access != access_granted) {
			const err = user.access === access_suspended ? "Access is suspended" : "Access is revoked";
			ForbiddenError(res, err, null);
		} else {
			next();
		}
	});
};

const keyExists = (req: IGetAuthTypesRequest, res: Response, next: NextFunction) => {
	API_KEY.findOne({
		where: {
			type: tag_root,
			api_key: req.API_KEY
		}
	}).then(api_key => {
		if (!api_key) {
			ForbiddenError(res, `Require ${tag_root} key!`, null);
		} else if (api_key.status === default_delete_status) {
			ForbiddenError(res, "Api key not available!", null);
		} else {
			SuccessResponse(res, "Key Exists!", { type: api_key.type });
		}
	});
};

const isRootKey = (req: IGetAuthTypesRequest, res: Response, next: NextFunction) => {
	API_KEY.findOne({
		where: {
			type: tag_root,
			api_key: req.API_KEY
		}
	}).then(api_key => {
		if (!api_key) {
			ForbiddenError(res, `Require ${tag_root} key!`, null);
		} else if (api_key.status === default_delete_status) {
			ForbiddenError(res, "Api key not available!", null);
		} else {
			next();
		}
	});
};

const isInternalKey = (req: IGetAuthTypesRequest, res: Response, next: NextFunction) => {
	API_KEY.findOne({
		where: {
			type: tag_internal_api_key,
			api_key: req.API_KEY
		}
	}).then(api_key => {
		if (!api_key) {
			ForbiddenError(res, `Require ${tag_internal_api_key} key!`, null);
		} else if (api_key.status === default_delete_status) {
			ForbiddenError(res, "Api key not available!", null);
		} else {
			next();
		}
	});
};

export default { verifyKey, verifyToken, isUser, keyExists, isRootKey, isInternalKey, verifyModule };