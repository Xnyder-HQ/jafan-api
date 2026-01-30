import { Request, Response } from "express";
import { Op } from "sequelize";
import { check } from 'express-validator';
import moment from 'moment';
import STACKING_LOG from "../models/stackingLogs.model";
import { default_status, default_delete_status, strip_text, check_length_TEXT } from '../config/config';

export const StackingLogRules = {
	forFindingStackingLogInternal: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await STACKING_LOG.findOne({ where: { unique_id: unique_id } });
				if (!data) return Promise.reject('Stacking Log not found!');
			})
	],
	forFindingStackingLog: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await STACKING_LOG.findOne({ where: { unique_id: unique_id, status: default_status } });
				if (!data) return Promise.reject('Stacking Log not found!');
			})
	],
	forFindingStackingLogFalsy: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await STACKING_LOG.findOne({ where: { unique_id: unique_id, status: default_delete_status } });
				if (!data) return Promise.reject('Stacking Log not found!');
			})
	],
	forFindingStackingLogAlt: [
		check('stacking_log_unique_id', "Stacking Log Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (stacking_log_unique_id: string, { req }) => {
				const data = await STACKING_LOG.findOne({ where: { unique_id: stacking_log_unique_id, status: default_status } });
				if (!data) return Promise.reject('Stacking Log not found!');
			})
	],
	forAddingAndUpdating: [
		check('blocks_stacked', "Blocks Stacked is required")
			.exists({ checkNull: true, checkFalsy: false })
			.bail()
			.isFloat()
			.custom(blocks_stacked => {
				if (blocks_stacked < 0) return false;
				else return true;
			})
			.withMessage("Blocks Stacked invalid"),
		// check('stacking_rate', "Stacking Rate is required")
		// 	.exists({ checkNull: true, checkFalsy: false })
		// 	.bail()
		// 	.isFloat()
		// 	.custom(stacking_rate => {
		// 		if (stacking_rate < 0) return false;
		// 		else return true;
		// 	})
		// 	.withMessage("Stacking Rate invalid"),
		check('breakage_quantity', "Breakage Quantity is required")
			.exists({ checkNull: true, checkFalsy: false })
			.bail()
			.isFloat()
			.custom(breakage_quantity => {
				if (breakage_quantity < 0) return false;
				else return true;
			})
			.withMessage("Breakage Quantity invalid"),
		check('stack_date', "Stack Date is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(stack_date => {
				const later = moment(stack_date, "YYYY-MM-DD", true);
				return later.isValid();
			})
			.withMessage("Invalid stack date format (YYYY-MM-DD)"),
		check('notes')
			.optional({ checkFalsy: false })
			.bail()
			.isLength({ min: 2, max: check_length_TEXT })
			.withMessage(`Invalid length (2 - ${check_length_TEXT}) characters`),
	],
}