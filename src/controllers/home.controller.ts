import { Request, Response } from "express";
import { SuccessResponse } from '../common/index';

export function welcome(req: Request, res: Response): Response {
	return SuccessResponse(res, "Jafan API activated.");
}