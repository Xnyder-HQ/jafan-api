import { Request, Response } from "express";
import { Op } from "sequelize";
import { check } from 'express-validator';
import moment from 'moment';
import PRODUCTION_BATCH from "../models/productionBatches.model";
import { default_status, default_delete_status, strip_text, check_length_TEXT } from '../config/config';

export const ProductionBatchRules = {
	forFindingProductionBatchInternal: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await PRODUCTION_BATCH.findOne({ where: { unique_id: unique_id } });
				if (!data) return Promise.reject('Production Batch not found!');
			})
	],
	forFindingProductionBatch: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await PRODUCTION_BATCH.findOne({ where: { unique_id: unique_id, status: default_status } });
				if (!data) return Promise.reject('Production Batch not found!');
			})
	],
	forFindingProductionBatchFalsy: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await PRODUCTION_BATCH.findOne({ where: { unique_id: unique_id, status: default_delete_status } });
				if (!data) return Promise.reject('Production Batch not found!');
			})
	],
	forFindingProductionBatchAlt: [
		check('production_batch_unique_id', "Production Batch Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (production_batch_unique_id: string, { req }) => {
				const data = await PRODUCTION_BATCH.findOne({ where: { unique_id: production_batch_unique_id, status: default_status } });
				if (!data) return Promise.reject('Production Batch not found!');
			})
	],
	forAddingAndUpdating: [
		check('quantity_produced', "Quantity Produced is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isFloat()
			.custom(quantity_produced => {
				if (quantity_produced < 0) return false;
				else return true;
			})
			.withMessage("Quantity Produced invalid"),
		check('production_date', "Production Date is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(production_date => {
				const later = moment(production_date, "YYYY-MM-DD", true);
				return later.isValid();
			})
			.withMessage("Invalid production date format (YYYY-MM-DD)"),
		check('shift')
			.optional({ checkFalsy: false })
			.bail()
			.isString().isLength({ min: 1, max: 20 })
			.withMessage("Invalid length (1 - 20) characters"),	
		check('notes')
			.optional({ checkFalsy: false })
			.bail()
			.isLength({ min: 2, max: check_length_TEXT })
			.withMessage(`Invalid length (2 - ${check_length_TEXT}) characters`),
	],
}