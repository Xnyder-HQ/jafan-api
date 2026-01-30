import { Request, Response } from "express";
import { Op } from "sequelize";
import { check } from 'express-validator';
import moment from 'moment';
import MACHINE from "../models/machines.model";
import { default_status, default_delete_status, strip_text, check_length_TEXT } from '../config/config';

export const MachineRules = {
	forFindingMachineInternal: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await MACHINE.findOne({ where: { unique_id: unique_id } });
				if (!data) return Promise.reject('Machine not found!');
			})
	],
	forFindingMachine: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await MACHINE.findOne({ where: { unique_id: unique_id, status: default_status } });
				if (!data) return Promise.reject('Machine not found!');
			})
	],
	forFindingMachineFalsy: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await MACHINE.findOne({ where: { unique_id: unique_id, status: default_delete_status } });
				if (!data) return Promise.reject('Machine not found!');
			})
	],
	forFindingMachineAlt: [
		check('machine_unique_id', "Machine Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (machine_unique_id: string, { req }) => {
				const data = await MACHINE.findOne({ where: { unique_id: machine_unique_id, status: default_status } });
				if (!data) return Promise.reject('Machine not found!');
			})
	],
	forFindingMachineAltOptional: [
		check('machine_unique_id')
			.optional({ checkFalsy: false })
			.bail()
			.custom(async (machine_unique_id: string, { req }) => {
				const data = await MACHINE.findOne({ where: { unique_id: machine_unique_id, status: default_status } });
				if (!data) return Promise.reject('Machine not found!');
			})
	],
	forAdding: [
		check('name', "Name is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 1, max: 300 })
			.withMessage("Invalid length (1 - 300) characters"),
		check('code', "Machine Code is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 1, max: 50 })
			.withMessage("Invalid length (1 - 50) characters"),
		check('type', "Type is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 1, max: 50 })
			.withMessage("Invalid length (1 - 50) characters"),
		check('description')
			.optional({ checkFalsy: false })
			.bail()
			.isLength({ min: 2, max: check_length_TEXT })
			.withMessage(`Invalid length (2 - ${check_length_TEXT}) characters`),
		check('supported_block_types', "Supported Block Types are required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isArray({ min: 1 })
			.withMessage("Must be an array of strings (not empty)"), 
		check('expected_blocks_per_day')
			.optional({ checkFalsy: false })
			.bail()
			.isFloat()
			.custom(expected_blocks_per_day => {
				if (expected_blocks_per_day < 0) return false;
				else return true;
			})
			.withMessage("Expected Blocks Per Day invalid"),
		check('fuel_type', "Fuel Type is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 1, max: 50 })
			.withMessage("Invalid length (1 - 50) characters"),
		check('installed_date')
			.optional({ checkFalsy: false })
			.bail()
			.custom(installed_date => {
				const later = moment(installed_date, "YYYY-MM-DD", true);
				return later.isValid();
			})
			.withMessage("Invalid installed date format (YYYY-MM-DD)"),
		check('is_active', "Is Active is required")
			.exists({ checkNull: true, checkFalsy: false })
			.bail()
			.isBoolean()
			.withMessage("Value should be true or false"),
	],
	forUpdatingDetails: [
		check('name', "Name is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 1, max: 300 })
			.withMessage("Invalid length (1 - 300) characters"),
		check('code', "Machine Code is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 1, max: 50 })
			.withMessage("Invalid length (1 - 50) characters"),
		check('type', "Type is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 1, max: 50 })
			.withMessage("Invalid length (1 - 50) characters"),
		check('fuel_type', "Fuel Type is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 1, max: 50 })
			.withMessage("Invalid length (1 - 50) characters"),
	],
	forUpdatingSupportedBlockTypes: [
		check('supported_block_types', "Supported Block Types are required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isArray({ min: 1 })
			.withMessage("Must be an array of strings (not empty)"), 
	], 
	forUpdatingOtherDetails: [
		check('expected_blocks_per_day')
			.optional({ checkFalsy: false })
			.bail()
			.isFloat()
			.custom(expected_blocks_per_day => {
				if (expected_blocks_per_day < 0) return false;
				else return true;
			})
			.withMessage("Expected Blocks Per Day invalid"),
		check('installed_date')
			.optional({ checkFalsy: false })
			.bail()
			.custom(installed_date => {
				const later = moment(installed_date, "YYYY-MM-DD", true);
				return later.isValid();
			})
			.withMessage("Invalid installed date format (YYYY-MM-DD)"),
	], 
	forUpdatingDescription: [
		check('description')
			.optional({ checkFalsy: false })
			.bail()
			.isLength({ min: 2, max: check_length_TEXT })
			.withMessage(`Invalid length (2 - ${check_length_TEXT}) characters`),
	],
	forUpdatingToggles: [
		check('is_active', "Is Active is required")
			.exists({ checkNull: true, checkFalsy: false })
			.bail()
			.isBoolean()
			.withMessage("Value should be true or false"),
	]
}