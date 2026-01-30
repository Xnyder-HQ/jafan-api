import { Request, Response } from "express";
import { Op } from "sequelize";
import { check } from 'express-validator';
import moment from 'moment';
import PRODUCT from "../models/products.model";
import { default_status, default_delete_status, strip_text, check_length_TEXT } from '../config/config';

export const ProductRules = {
	forFindingProductInternal: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await PRODUCT.findOne({ where: { unique_id: unique_id } });
				if (!data) return Promise.reject('Product not found!');
			})
	],
	forFindingProduct: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await PRODUCT.findOne({ where: { unique_id: unique_id, status: default_status } });
				if (!data) return Promise.reject('Product not found!');
			})
	],
	forFindingProductFalsy: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await PRODUCT.findOne({ where: { unique_id: unique_id, status: default_delete_status } });
				if (!data) return Promise.reject('Product not found!');
			})
	],
	forFindingProductAlt: [
		check('product_unique_id', "Product Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (product_unique_id: string, { req }) => {
				const data = await PRODUCT.findOne({ where: { unique_id: product_unique_id, status: default_status } });
				if (!data) return Promise.reject('Product not found!');
			})
	],
	forFindingProductAltOptional: [
		check('product_unique_id')
			.optional({ checkFalsy: false })
			.bail()
			.custom(async (product_unique_id: string, { req }) => {
				const data = await PRODUCT.findOne({ where: { unique_id: product_unique_id, status: default_status } });
				if (!data) return Promise.reject('Product not found!');
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
		check('quantity', "Quantity is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isFloat()
			.custom(quantity => {
				if (quantity < 0) return false;
				else return true;
			})
			.withMessage("Quantity invalid"),
		check('total_quantity')
			.optional({ checkFalsy: false })
			.bail()
			.isFloat()
			.custom(total_quantity => {
				if (total_quantity < 0) return false;
				else return true;
			})
			.withMessage("Total Quantity invalid"),
		check('price', "Price is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isFloat()
			.custom(price => {
				if (price < 0) return false;
				else return true;
			})
			.withMessage("Price invalid"),
		check('cost_price')
			.optional({ checkFalsy: false })
			.bail()
			.isFloat()
			.custom(cost_price => {
				if (cost_price < 0) return false;
				else return true;
			})
			.withMessage("Cost Price invalid"),
		check('is_outside_town_eligible', "Is Outside Town Eligible is required")
			.exists({ checkNull: true, checkFalsy: false })
			.bail()
			.isBoolean()
			.withMessage("Value should be true or false"),
		check('is_inventory_tracked', "Is Inventory Tracked is required")
			.exists({ checkNull: true, checkFalsy: false })
			.bail()
			.isBoolean()
			.withMessage("Value should be true or false"),
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
	forUpdatingPrice: [
		check('price', "Price is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isFloat()
			.custom(price => {
				if (price < 0) return false;
				else return true;
			})
			.withMessage("Price invalid"),
		check('cost_price')
			.optional({ checkFalsy: false })
			.bail()
			.isFloat()
			.custom(cost_price => {
				if (cost_price < 0) return false;
				else return true;
			})
			.withMessage("Cost Price invalid")
	],
	forUpdatingQuantity: [
		check('quantity', "Quantity is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isFloat()
			.custom(quantity => {
				if (quantity < 0) return false;
				else return true;
			})
			.withMessage("Quantity invalid"),
		check('total_quantity', "Total Quantity is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isFloat()
			.custom(total_quantity => {
				if (total_quantity < 0) return false;
				else return true;
			})
			.withMessage("Total Quantity invalid"),
	], 
	forUpdatingToggles: [
		check('is_outside_town_eligible', "Is Outside Town Eligible is required")
			.exists({ checkNull: true, checkFalsy: false })
			.bail()
			.isBoolean()
			.withMessage("Value should be true or false"),
		check('is_inventory_tracked', "Is Inventory Tracked is required")
			.exists({ checkNull: true, checkFalsy: false })
			.bail()
			.isBoolean()
			.withMessage("Value should be true or false"),
	]
}