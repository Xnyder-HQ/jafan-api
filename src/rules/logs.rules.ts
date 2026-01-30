import { Request, Response } from "express";
import { Op } from "sequelize";
import { check } from 'express-validator';
import moment from 'moment';
import LOG from "../models/logs.model";
import { default_status, default_delete_status, strip_text } from '../config/config';

export const LogRules = {
	forFindingLogInternal: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await LOG.findOne({ where: { unique_id: unique_id } });
				if (!data) return Promise.reject('Log not found!');
			})
	],
	forFindingLog: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await LOG.findOne({ where: { unique_id: unique_id, status: default_status } });
				if (!data) return Promise.reject('Log not found!');
			})
	],
	forFindingLogFalsy: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await LOG.findOne({ where: { unique_id: unique_id, status: default_delete_status } });
				if (!data) return Promise.reject('Log not found!');
			})
	],
	forFindingLogAlt: [
		check('log_unique_id', "Log Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (log_unique_id: string, { req }) => {
				const data = await LOG.findOne({ where: { unique_id: log_unique_id, status: default_status } });
				if (!data) return Promise.reject('Log not found!');
			})
	],
}