import { Request, Response } from "express";
import { Op } from "sequelize";
import { check } from 'express-validator';
import moment from 'moment';
import PRODUCTION_FUEL_LOG from "../models/productionFuelLogs.model";
import { default_status, default_delete_status, strip_text, check_length_TEXT, validate_fuel_type, fuel_type } from '../config/config';

export const ProductionFuelLogRules = {
	forFindingProductionFuelLogInternal: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await PRODUCTION_FUEL_LOG.findOne({ where: { unique_id: unique_id } });
				if (!data) return Promise.reject('Production Fuel Log not found!');
			})
	],
	forFindingProductionFuelLog: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await PRODUCTION_FUEL_LOG.findOne({ where: { unique_id: unique_id, status: default_status } });
				if (!data) return Promise.reject('Production Fuel Log not found!');
			})
	],
	forFindingProductionFuelLogFalsy: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await PRODUCTION_FUEL_LOG.findOne({ where: { unique_id: unique_id, status: default_delete_status } });
				if (!data) return Promise.reject('Production Fuel Log not found!');
			})
	],
	forFindingProductionFuelLogAlt: [
		check('production_fuel_log_unique_id', "Production Fuel Log Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (production_fuel_log_unique_id: string, { req }) => {
				const data = await PRODUCTION_FUEL_LOG.findOne({ where: { unique_id: production_fuel_log_unique_id, status: default_status } });
				if (!data) return Promise.reject('Production Fuel Log not found!');
			})
	],
	forAddingAndUpdating: [
		check('fuel_type', "Fuel Type is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 2, max: 20 })
			.withMessage("Invalid length (2 - 20) characters")
			.bail()
			.custom(fuel_type => !!validate_fuel_type(fuel_type))
			.withMessage(`Invalid fuel type, accepted types (${fuel_type.diesel}, ${fuel_type.electric} or ${fuel_type.petrol})`),
		check('liters_dispensed', "Liters Dispensed is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isFloat()
			.custom(liters_dispensed => {
				if (liters_dispensed < 0) return false;
				else return true;
			})
			.withMessage("Liters Dispensed invalid"),
		check('destination', "Destination is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 1, max: 100 })
			.withMessage("Invalid length (1 - 100) characters"),
		check('dispensed_date', "Dispensed Date is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(dispensed_date => {
				const later = moment(dispensed_date, "YYYY-MM-DD", true);
				return later.isValid();
			})
			.withMessage("Invalid dispensed date format (YYYY-MM-DD)"),
		check('notes')
			.optional({ checkFalsy: false })
			.bail()
			.isLength({ min: 2, max: check_length_TEXT })
			.withMessage(`Invalid length (2 - ${check_length_TEXT}) characters`),
	],
}