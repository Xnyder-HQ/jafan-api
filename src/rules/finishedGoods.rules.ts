import { Request, Response } from "express";
import { Op } from "sequelize";
import { check } from 'express-validator';
import moment from 'moment';
import FINISHED_GOOD from "../models/finishedGoods.model";
import { default_status, default_delete_status, strip_text, check_length_TEXT } from '../config/config';

export const FinishedGoodRules = {
	forFindingFinishedGoodInternal: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await FINISHED_GOOD.findOne({ where: { unique_id: unique_id } });
				if (!data) return Promise.reject('Finished Good not found!');
			})
	],
	forFindingFinishedGood: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await FINISHED_GOOD.findOne({ where: { unique_id: unique_id, status: default_status } });
				if (!data) return Promise.reject('Finished Good not found!');
			})
	],
	forFindingFinishedGoodFalsy: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await FINISHED_GOOD.findOne({ where: { unique_id: unique_id, status: default_delete_status } });
				if (!data) return Promise.reject('Finished Good not found!');
			})
	],
	forFindingFinishedGoodAlt: [
		check('finished_good_unique_id', "Finished Good Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (finished_good_unique_id: string, { req }) => {
				const data = await FINISHED_GOOD.findOne({ where: { unique_id: finished_good_unique_id, status: default_status } });
				if (!data) return Promise.reject('Finished Good not found!');
			})
	],
	forAdding: [
		check('name', "Name is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 1, max: 300 })
			.withMessage("Invalid length (1 - 300) characters"),
		check('type')
			.optional({ checkFalsy: false })
			.bail()
			.isString().isLength({ min: 1, max: 50 })
			.withMessage("Invalid length (1 - 50) characters"),
		check('description')
			.optional({ checkFalsy: false })
			.bail()
			.isLength({ min: 2, max: check_length_TEXT })
			.withMessage(`Invalid length (2 - ${check_length_TEXT}) characters`),
		check('unit_of_measure', "Unit Of Measure is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 1, max: 100 })
			.withMessage("Invalid length (1 - 100) characters"),
		check('current_quantity', "Current Quantity is required")
			.exists({ checkNull: true, checkFalsy: false })
			.bail()
			.isFloat()
			.custom(current_quantity => {
				if (current_quantity < 0) return false;
				else return true;
			})
			.withMessage("Current Quantity invalid"),
		check('unit_cost', "Unit Cost is required")
			.exists({ checkNull: true, checkFalsy: false })
			.bail()
			.isFloat()
			.custom(unit_cost => {
				if (unit_cost < 0) return false;
				else return true;
			})
			.withMessage("Unit Cost invalid"),
		check('selling_price', "Selling Price is required")
			.exists({ checkNull: true, checkFalsy: false })
			.bail()
			.isFloat()
			.custom(selling_price => {
				if (selling_price < 0) return false;
				else return true;
			})
			.withMessage("Selling Price invalid"),
	],
	forUpdatingName: [
		check('name', "Name is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 1, max: 300 })
			.withMessage("Invalid length (1 - 300) characters"),
	],
	forUpdatingType: [
		check('type')
			.optional({ checkFalsy: false })
			.bail()
			.isString().isLength({ min: 1, max: 50 })
			.withMessage("Invalid length (1 - 50) characters"),
	], 
	forUpdatingUnitOfMeasure: [
		check('unit_of_measure', "Unit Of Measure is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 1, max: 100 })
			.withMessage("Invalid length (1 - 100) characters"),
	], 
	forUpdatingDescription: [
		check('description')
			.optional({ checkFalsy: false })
			.bail()
			.isLength({ min: 2, max: check_length_TEXT })
			.withMessage(`Invalid length (2 - ${check_length_TEXT}) characters`),
	],
	forUpdatingCurrentQuantity: [
		check('current_quantity', "Current Quantity is required")
			.exists({ checkNull: true, checkFalsy: false })
			.bail()
			.isFloat()
			.custom(current_quantity => {
				if (current_quantity < 0) return false;
				else return true;
			})
			.withMessage("Current Quantity invalid"),
	], 
	forUpdatingCost: [
		check('unit_cost', "Unit Cost is required")
			.exists({ checkNull: true, checkFalsy: false })
			.bail()
			.isFloat()
			.custom(unit_cost => {
				if (unit_cost < 0) return false;
				else return true;
			})
			.withMessage("Unit Cost invalid"),
		check('selling_price', "Selling Price is required")
			.exists({ checkNull: true, checkFalsy: false })
			.bail()
			.isFloat()
			.custom(selling_price => {
				if (selling_price < 0) return false;
				else return true;
			})
			.withMessage("Selling Price invalid"),
	]
}