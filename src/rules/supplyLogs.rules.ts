import { Request, Response } from "express";
import { Op } from "sequelize";
import { check } from 'express-validator';
import moment from 'moment';
import SUPPLY_LOG from "../models/supplyLogs.model";
import { default_status, default_delete_status, strip_text, check_length_TEXT } from '../config/config';

export const SupplyLogRules = {
	forFindingSupplyLogInternal: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await SUPPLY_LOG.findOne({ where: { unique_id: unique_id } });
				if (!data) return Promise.reject('Supply Log not found!');
			})
	],
	forFindingSupplyLog: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await SUPPLY_LOG.findOne({ where: { unique_id: unique_id, status: default_status } });
				if (!data) return Promise.reject('Supply Log not found!');
			})
	],
	forFindingSupplyLogFalsy: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await SUPPLY_LOG.findOne({ where: { unique_id: unique_id, status: default_delete_status } });
				if (!data) return Promise.reject('Supply Log not found!');
			})
	],
	forFindingSupplyLogAlt: [
		check('supply_log_unique_id', "Supply Log Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (supply_log_unique_id: string, { req }) => {
				const data = await SUPPLY_LOG.findOne({ where: { unique_id: supply_log_unique_id, status: default_status } });
				if (!data) return Promise.reject('Supply Log not found!');
			})
	],
	forAddingAndUpdating: [
		check('site_address', "Site Address is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 1, max: 300 })
			.withMessage("Invalid length (1 - 300) characters"),
		check('delivery_date', "Delivery Date is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(delivery_date => {
				const later = moment(delivery_date, "YYYY-MM-DD HH:mm", true);
				return later.isValid();
			})
			.withMessage("Invalid delivery date format (YYYY-MM-DD HH:mm)"),
		check('blocks_loaded', "Blocks Loaded is required")
			.exists({ checkNull: true, checkFalsy: false })
			.bail()
			.isFloat()
			.custom(blocks_loaded => {
				if (blocks_loaded < 0) return false;
				else return true;
			})
			.withMessage("Blocks Loaded invalid"),
		check('blocks_dropped', "Blocks Dropped is required")
			.exists({ checkNull: true, checkFalsy: false })
			.bail()
			.isFloat()
			.custom(blocks_dropped => {
				if (blocks_dropped < 0) return false;
				else return true;
			})
			.withMessage("Blocks Dropped invalid"),
		check('blocks_returned', "Blocks Returned is required")
			.exists({ checkNull: true, checkFalsy: false })
			.bail()
			.isFloat()
			.custom(blocks_returned => {
				if (blocks_returned < 0) return false;
				else return true;
			})
			.withMessage("Blocks Returned invalid"),
		check('breakage_quantity', "Breakage Quantity is required")
			.exists({ checkNull: true, checkFalsy: false })
			.bail()
			.isFloat()
			.custom(breakage_quantity => {
				if (breakage_quantity < 0) return false;
				else return true;
			})
			.withMessage("Breakage Quantity invalid"),
		check('notes')
			.optional({ checkFalsy: false })
			.bail()
			.isLength({ min: 2, max: check_length_TEXT })
			.withMessage(`Invalid length (2 - ${check_length_TEXT}) characters`),
	],
}