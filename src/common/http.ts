import { Response } from "express";
import {
	AuthenticationErrorResCode, InvalidAuthenticationErrorResCode, CreateSuccessResCode, NoContentSuccessResCode,
	NotFoundResCode, ServerErrorResCode, SuccessResCode, TooManyRequestsResCode, UserErrorResCode, UserValidationErrorResCode,
	ConflictResCode, ServiceUnavailableErrorResCode
} from "../config/http.config";
import logger from "./logger";

export const SuccessResponse = (res: Response, message: string | any, data?: null | string | object | Array<string | object>) => {
	logger.info(message);
	return res.status(SuccessResCode).send({
		success: true,
		message: typeof message === "object" ? message.text : message,
		data: !data ? null : data
	});
};

export const CreationSuccessResponse = (res: Response, message: string | any, data?: null | string | object | Array<string | object>) => {
	logger.info(message);
	return res.status(CreateSuccessResCode).send({
		success: true,
		message: typeof message === "object" ? message.text : message,
		data: !data ? null : data
	});
};

export const OtherSuccessResponse = (res: Response, message: string | any, data?: null | string | object | Array<string | object>) => {
	logger.info(message);
	return res.status(NoContentSuccessResCode).send({
		success: true,
		message: typeof message === "object" ? message.text : message,
		data: !data ? null : data
	});
};

export const NotFoundError = (res: Response, message: string | any, data?: null | string | object | Array<string | object>) => {
	logger.error(message);
	return res.status(NotFoundResCode).send({
		success: false,
		message: typeof message === "object" ? message.text : message,
		data: !data ? null : data
	});
};

export const BadRequestError = (res: Response, message: string | any, data?: null | string | object | Array<string | object>) => {
	logger.warn(message);
	return res.status(UserErrorResCode).send({
		success: false,
		message: typeof message === "object" ? message.text : message,
		data: !data ? null : data
	});
};

export const ValidationError = (res: Response, message: string | any, data?: null | string | object | Array<string | object>) => {
	logger.warn(message);
	return res.status(UserValidationErrorResCode).send({
		success: false,
		message: typeof message === "object" ? message.text : message,
		data: !data ? null : data
	});
};

export const UnauthorizedError = (res: Response, message: string | any, data?: null | string | object | Array<string | object>) => {
	logger.warn(message);
	return res.status(InvalidAuthenticationErrorResCode).send({
		success: false,
		message: typeof message === "object" ? message.text : message,
		data: !data ? null : data
	});
};

export const ForbiddenError = (res: Response, message: string | any, data?: null | string | object | Array<string | object>) => {
	logger.error(message);
	return res.status(AuthenticationErrorResCode).send({
		success: false,
		message: typeof message === "object" ? message.text : message,
		data: !data ? null : data
	});
};

export const ConflictError = (res: Response, message: string | any, data?: null | string | object | Array<string | object>) => {
	logger.warn(message);
	return res.status(ConflictResCode).send({
		success: false,
		message: typeof message === "object" ? message.text : message,
		data: !data ? null : data
	});
};

export const TooManyRequestError = (res: Response, message: string | any, data?: null | string | object | Array<string | object>) => {
	logger.warn(message);
	return res.status(TooManyRequestsResCode).send({
		success: false,
		message: typeof message === "object" ? message.text : message,
		data: !data ? null : data
	});
};

export const ServerError = (res: Response, message: string | any, data?: null | string | object | Array<string | object>) => {
	logger.error(message);
	return res.status(ServerErrorResCode).send({
		success: false,
		message: typeof message === "object" ? message.text : message,
		data: !data ? null : data
	});
};

export const ServiceUnavailableError = (res: Response, message: string | any, data?: null | string | object | Array<string | object>) => {
	logger.error(message);
	return res.status(ServiceUnavailableErrorResCode).send({
		success: false,
		message: typeof message === "object" ? message.text : message,
		data: !data ? null : data
	});
};