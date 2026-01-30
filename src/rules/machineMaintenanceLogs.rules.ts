import { Request, Response } from "express";
import { Op } from "sequelize";
import { check } from 'express-validator';
import moment from 'moment';
import MACHINE_MAINTENANCE_LOG from "../models/machineMaintenanceLogs.model";
import { default_status, default_delete_status, strip_text, check_length_TEXT } from '../config/config';

export const MachineMaintenanceLogRules = {
	forFindingMachineMaintenanceLogInternal: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await MACHINE_MAINTENANCE_LOG.findOne({ where: { unique_id: unique_id } });
				if (!data) return Promise.reject('Machine Maintenance Log not found!');
			})
	],
	forFindingMachineMaintenanceLog: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await MACHINE_MAINTENANCE_LOG.findOne({ where: { unique_id: unique_id, status: default_status } });
				if (!data) return Promise.reject('Machine Maintenance Log not found!');
			})
	],
	forFindingMachineMaintenanceLogFalsy: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await MACHINE_MAINTENANCE_LOG.findOne({ where: { unique_id: unique_id, status: default_delete_status } });
				if (!data) return Promise.reject('Machine Maintenance Log not found!');
			})
	],
	forFindingMachineMaintenanceLogAlt: [
		check('machine_maintenance_log_unique_id', "Machine Maintenance Log Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (machine_maintenance_log_unique_id: string, { req }) => {
				const data = await MACHINE_MAINTENANCE_LOG.findOne({ where: { unique_id: machine_maintenance_log_unique_id, status: default_status } });
				if (!data) return Promise.reject('Machine Maintenance Log not found!');
			})
	],
	forAddingAndUpdating: [
		check('service_date', "Service Date is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(service_date => {
				const later = moment(service_date, "YYYY-MM-DD", true);
				return later.isValid();
			})
			.withMessage("Invalid service date format (YYYY-MM-DD)"),
		check('cost', "Cost is required")
			.exists({ checkNull: true, checkFalsy: false })
			.bail()
			.isFloat()
			.custom(cost => {
				if (cost < 0) return false;
				else return true;
			})
			.withMessage("Cost invalid"),
		check('next_service_date')
			.optional({ checkFalsy: false })
			.bail()
			.custom(next_service_date => {
				const later = moment(next_service_date, "YYYY-MM-DD", true);
				return later.isValid();
			})
			.withMessage("Invalid next service date format (YYYY-MM-DD)"),
		check('notes', "Notes is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isLength({ min: 2, max: check_length_TEXT })
			.withMessage(`Invalid length (2 - ${check_length_TEXT}) characters`),
	],
}