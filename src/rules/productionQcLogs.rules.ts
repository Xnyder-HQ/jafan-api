import { Request, Response } from "express";
import { Op } from "sequelize";
import { check } from 'express-validator';
import moment from 'moment';
import PRODUCTION_QC_LOG from "../models/productionQcLogs.model";
import { default_status, default_delete_status, strip_text, check_length_TEXT } from '../config/config';

export const ProductionQcLogRules = {
	forFindingProductionQcLogInternal: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await PRODUCTION_QC_LOG.findOne({ where: { unique_id: unique_id } });
				if (!data) return Promise.reject('Production QC Log not found!');
			})
	],
	forFindingProductionQcLog: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await PRODUCTION_QC_LOG.findOne({ where: { unique_id: unique_id, status: default_status } });
				if (!data) return Promise.reject('Production QC Log not found!');
			})
	],
	forFindingProductionQcLogFalsy: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await PRODUCTION_QC_LOG.findOne({ where: { unique_id: unique_id, status: default_delete_status } });
				if (!data) return Promise.reject('Production QC Log not found!');
			})
	],
	forFindingProductionQcLogAlt: [
		check('production_qc_log_unique_id', "Production QC Log Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (production_qc_log_unique_id: string, { req }) => {
				const data = await PRODUCTION_QC_LOG.findOne({ where: { unique_id: production_qc_log_unique_id, status: default_status } });
				if (!data) return Promise.reject('Production QC Log not found!');
			})
	],
	forAddingAndUpdating: [
		check('defective_quantity', "Defective Quantity is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isFloat()
			.custom(defective_quantity => {
				if (defective_quantity < 0) return false;
				else return true;
			})
			.withMessage("Defective Quantity invalid"),
		check('qc_date', "QC Date is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(qc_date => {
				const later = moment(qc_date, "YYYY-MM-DD", true);
				return later.isValid();
			})
			.withMessage("Invalid qc date format (YYYY-MM-DD)"),
		check('notes')
			.optional({ checkFalsy: false })
			.bail()
			.isLength({ min: 2, max: check_length_TEXT })
			.withMessage(`Invalid length (2 - ${check_length_TEXT}) characters`),
	],
}