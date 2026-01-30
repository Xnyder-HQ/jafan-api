import { Request, Response } from "express";
import { Op } from "sequelize";
import { check } from 'express-validator';
import moment from 'moment';
import RAW_MATERIAL from "../models/rawMaterials.model";
import { default_status, default_delete_status, strip_text, check_length_TEXT } from '../config/config';

export const RawMaterialRules = {
	forFindingRawMaterialInternal: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await RAW_MATERIAL.findOne({ where: { unique_id: unique_id } });
				if (!data) return Promise.reject('Raw Material not found!');
			})
	],
	forFindingRawMaterial: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await RAW_MATERIAL.findOne({ where: { unique_id: unique_id, status: default_status } });
				if (!data) return Promise.reject('Raw Material not found!');
			})
	],
	forFindingRawMaterialFalsy: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await RAW_MATERIAL.findOne({ where: { unique_id: unique_id, status: default_delete_status } });
				if (!data) return Promise.reject('Raw Material not found!');
			})
	],
	forFindingRawMaterialAlt: [
		check('raw_material_unique_id', "Raw Material Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (raw_material_unique_id: string, { req }) => {
				const data = await RAW_MATERIAL.findOne({ where: { unique_id: raw_material_unique_id, status: default_status } });
				if (!data) return Promise.reject('Raw Material not found!');
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
		check('unit_of_measure')
			.optional({ checkFalsy: false })
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
		check('reorder_level')
			.optional({ checkFalsy: false })
			.bail()
			.isFloat()
			.custom(reorder_level => {
				if (reorder_level < 0) return false;
				else return true;
			})
			.withMessage("Reorder Level invalid"),
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
		check('unit_of_measure')
			.optional({ checkFalsy: false })
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
	forUpdatingReorderLevel: [
		check('reorder_level')
			.optional({ checkFalsy: false })
			.bail()
			.isFloat()
			.custom(reorder_level => {
				if (reorder_level < 0) return false;
				else return true;
			})
			.withMessage("Reorder Level invalid"),
	]
}