import { Request, Response } from "express";
import { Op } from "sequelize";
import { check } from 'express-validator';
import moment from 'moment';
import RAW_MATERIAL_STOCK_LOG from "../models/rawMaterialStockLogs.model";
import { default_status, default_delete_status, strip_text, check_length_TEXT } from '../config/config';

export const RawMaterialStockLogRules = {
	forFindingRawMaterialStockLogInternal: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await RAW_MATERIAL_STOCK_LOG.findOne({ where: { unique_id: unique_id } });
				if (!data) return Promise.reject('Raw Material Stock Log not found!');
			})
	],
	forFindingRawMaterialStockLog: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await RAW_MATERIAL_STOCK_LOG.findOne({ where: { unique_id: unique_id, status: default_status } });
				if (!data) return Promise.reject('Raw Material Stock Log not found!');
			})
	],
	forFindingRawMaterialStockLogFalsy: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await RAW_MATERIAL_STOCK_LOG.findOne({ where: { unique_id: unique_id, status: default_delete_status } });
				if (!data) return Promise.reject('Raw Material Stock Log not found!');
			})
	],
	forFindingRawMaterialStockLogAlt: [
		check('raw_material_stock_log_unique_id', "Raw Material Stock Log Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (raw_material_stock_log_unique_id: string, { req }) => {
				const data = await RAW_MATERIAL_STOCK_LOG.findOne({ where: { unique_id: raw_material_stock_log_unique_id, status: default_status } });
				if (!data) return Promise.reject('Raw Material Stock Log not found!');
			})
	],
}