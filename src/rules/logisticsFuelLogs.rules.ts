import { Request, Response } from "express";
import { Op } from "sequelize";
import { check } from 'express-validator';
import moment from 'moment';
import LOGISTICS_FUEL_LOG from "../models/logisticsFuelLogs.model";
import { default_status, default_delete_status, strip_text, check_length_TEXT, validate_fuel_type, fuel_type } from '../config/config';

export const LogisticsFuelLogRules = {
	forFindingLogisticsFuelLogInternal: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await LOGISTICS_FUEL_LOG.findOne({ where: { unique_id: unique_id } });
				if (!data) return Promise.reject('Logistics Fuel Log not found!');
			})
	],
	forFindingLogisticsFuelLog: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await LOGISTICS_FUEL_LOG.findOne({ where: { unique_id: unique_id, status: default_status } });
				if (!data) return Promise.reject('Logistics Fuel Log not found!');
			})
	],
	forFindingLogisticsFuelLogFalsy: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await LOGISTICS_FUEL_LOG.findOne({ where: { unique_id: unique_id, status: default_delete_status } });
				if (!data) return Promise.reject('Logistics Fuel Log not found!');
			})
	],
	forFindingLogisticsFuelLogAlt: [
		check('logistics_fuel_log_unique_id', "Logistics Fuel Log Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (logistics_fuel_log_unique_id: string, { req }) => {
				const data = await LOGISTICS_FUEL_LOG.findOne({ where: { unique_id: logistics_fuel_log_unique_id, status: default_status } });
				if (!data) return Promise.reject('Logistics Fuel Log not found!');
			})
	],
	forAddingAndUpdating: [
		check('fuel_type')
			.optional({ checkFalsy: false })
			.bail()
			.isString().isLength({ min: 3, max: 20 })
			.withMessage("Invalid length (3 - 20) characters")
			.bail()
			.custom(fuel_type => !!validate_fuel_type(fuel_type))
			.withMessage(`Invalid fuel type, accepted types (${fuel_type.diesel} or ${fuel_type.petrol})`),
		check('liters_dispensed', "Liters Dispensed is required")
			.exists({ checkNull: true, checkFalsy: false })
			.bail()
			.isFloat()
			.custom(liters_dispensed => {
				if (liters_dispensed < 0) return false;
				else return true;
			})
			.withMessage("Liters Dispensed invalid"),
		// check('benchmark_liters', "Benchmark Liters is required")
		// 	.exists({ checkNull: true, checkFalsy: true })
		// 	.bail()
		// 	.isFloat()
		// 	.custom(benchmark_liters => {
		// 		if (benchmark_liters < 0) return false;
		// 		else return true;
		// 	})
		// 	.withMessage("Benchmark Liters invalid"),
		// check('expected_trips', "Expected Trips is required")
		// 	.exists({ checkNull: true, checkFalsy: true })
		// 	.bail()
		// 	.isFloat()
		// 	.custom(expected_trips => {
		// 		if (expected_trips < 0) return false;
		// 		else return true;
		// 	})
		// 	.withMessage("Expected Trips invalid"),
		check('actual_trips', "Actual Trips is required")
			.exists({ checkNull: true, checkFalsy: false })
			.bail()
			.isFloat()
			.custom(actual_trips => {
				if (actual_trips < 0) return false;
				else return true;
			})
			.withMessage("Actual Trips invalid"),
		check('dispense_date', "Dispense Date is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(dispense_date => {
				const later = moment(dispense_date, "YYYY-MM-DD HH:mm", true);
				return later.isValid();
			})
			.withMessage("Invalid dispense date format (YYYY-MM-DD HH:mm)"),
		check('notes')
			.optional({ checkFalsy: false })
			.bail()
			.isLength({ min: 2, max: check_length_TEXT })
			.withMessage(`Invalid length (2 - ${check_length_TEXT}) characters`),
	],
}