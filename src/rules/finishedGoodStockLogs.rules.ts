import { Request, Response } from "express";
import { Op } from "sequelize";
import { check } from 'express-validator';
import moment from 'moment';
import FINISHED_GOOD_STOCK_LOG from "../models/finishedGoodStockLogs.model";
import { default_status, default_delete_status, strip_text, check_length_TEXT } from '../config/config';

export const FinishedGoodStockLogRules = {
	forFindingFinishedGoodStockLogInternal: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await FINISHED_GOOD_STOCK_LOG.findOne({ where: { unique_id: unique_id } });
				if (!data) return Promise.reject('Finished Good Stock Log not found!');
			})
	],
	forFindingFinishedGoodStockLog: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await FINISHED_GOOD_STOCK_LOG.findOne({ where: { unique_id: unique_id, status: default_status } });
				if (!data) return Promise.reject('Finished Good Stock Log not found!');
			})
	],
	forFindingFinishedGoodStockLogFalsy: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await FINISHED_GOOD_STOCK_LOG.findOne({ where: { unique_id: unique_id, status: default_delete_status } });
				if (!data) return Promise.reject('Finished Good Stock Log not found!');
			})
	],
	forFindingFinishedGoodStockLogAlt: [
		check('finished_good_stock_log_unique_id', "Finished Good Stock Log Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (finished_good_stock_log_unique_id: string, { req }) => {
				const data = await FINISHED_GOOD_STOCK_LOG.findOne({ where: { unique_id: finished_good_stock_log_unique_id, status: default_status } });
				if (!data) return Promise.reject('Finished Good Stock Log not found!');
			})
	],
}