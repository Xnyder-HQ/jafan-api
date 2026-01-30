import { Request, Response } from "express";
import { Op } from "sequelize";
import { check } from 'express-validator';
import moment from 'moment';
import RAW_MATERIAL from "../models/rawMaterials.model";
import FUEL_PURCHASE from "../models/fuelPurchases.model";
import { default_status, default_delete_status, strip_text, check_length_TEXT, validate_fuel_type, fuel_type, validate_fuel_delivery_status, fuel_delivery_status, } from '../config/config';

export const FuelPurchaseRules = {
	forFindingFuelPurchaseInternal: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await FUEL_PURCHASE.findOne({ where: { unique_id: unique_id } });
				if (!data) return Promise.reject('Fuel Purchase not found!');
			})
	],
	forFindingFuelPurchase: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await FUEL_PURCHASE.findOne({ where: { unique_id: unique_id, status: default_status } });
				if (!data) return Promise.reject('Fuel Purchase not found!');
			})
	],
	forFindingFuelPurchaseFalsy: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await FUEL_PURCHASE.findOne({ where: { unique_id: unique_id, status: default_delete_status } });
				if (!data) return Promise.reject('Fuel Purchase not found!');
			})
	],
	forFindingFuelPurchaseAlt: [
		check('fuel_purchase_unique_id', "Fuel Purchase Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (fuel_purchase_unique_id: string, { req }) => {
				const data = await FUEL_PURCHASE.findOne({ where: { unique_id: fuel_purchase_unique_id, status: default_status } });
				if (!data) return Promise.reject('Fuel Purchase not found!');
			})
	],
	forFindingFuelPurchaseAltOptional: [
		check('fuel_purchase_unique_id')
			.optional({ checkFalsy: false })
			.bail()
			.custom(async (fuel_purchase_unique_id: string, { req }) => {
				const data = await FUEL_PURCHASE.findOne({ where: { unique_id: fuel_purchase_unique_id, status: default_status } });
				if (!data) return Promise.reject('Fuel Purchase not found!');
			})
	],
	forAdding: [
		check('raw_material_unique_id')
			.optional({ checkFalsy: false })
			.bail()
			.custom(async (raw_material_unique_id: string, { req }) => {
				const data = await RAW_MATERIAL.findOne({ where: { unique_id: raw_material_unique_id, status: default_status } });
				if (!data) return Promise.reject('Raw Material not found!');
			}),
		check('fuel_type', "Fuel Type is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 3, max: 20 })
			.withMessage("Invalid length (3 - 20) characters")
			.bail()
			.custom(fuel_type => !!validate_fuel_type(fuel_type))
			.withMessage(`Invalid fuel type, accepted types (${fuel_type.diesel} or ${fuel_type.petrol})`),
		check('liters_purchased', "Liters Purchased is required")
			.exists({ checkNull: true, checkFalsy: false })
			.bail()
			.isFloat()
			.custom(liters_purchased => {
				if (liters_purchased < 0) return false;
				else return true;
			})
			.withMessage("Liters Purchased invalid"),
		// check('price_per_liter')
		// 	.optional({ checkFalsy: false })
		// 	.custom(async (price_per_liter: string, { req }) => {
		// 		if (req.body.fuel_type === fuel_type.electric || req.body.fuel_type === fuel_type.electric) return false;
		// 		else return true;
		// 	})
		// 	.withMessage("Price Per Liter is required")
		// 	.bail()
		// 	.isFloat()
		// 	.custom(price_per_liter => {
		// 		if (price_per_liter < 0) return false;
		// 		else return true;
		// 	})
		// 	.withMessage("Price Per Liter invalid"),
		check('purchase_date', "Purchase Date is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(purchase_date => {
				const later = moment(purchase_date, "YYYY-MM-DD", true);
				return later.isValid();
			})
			.withMessage("Invalid purchase date format (YYYY-MM-DD)"),
		check('notes')
			.optional({ checkFalsy: false })
			.bail()
			.isString().isLength({ min: 1, max: check_length_TEXT })
			.withMessage(`Invalid length (1 - ${check_length_TEXT}) characters`),
		check('receipt_image')
			.optional({ checkFalsy: false }),
		check('receipt_image_public_id')
			.optional({ checkFalsy: false }), 
	],
	forUpdatingFuelType: [
		check('fuel_type', "Fuel Type is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 3, max: 20 })
			.withMessage("Invalid length (3 - 20) characters")
			.bail()
			.custom(fuel_type => !!validate_fuel_type(fuel_type))
			.withMessage(`Invalid fuel type, accepted types (${fuel_type.diesel} or ${fuel_type.petrol})`),
	], 
	forUpdatingLiters: [
		check('liters_purchased', "Liters Purchased is required")
			.exists({ checkNull: true, checkFalsy: false })
			.bail()
			.isFloat()
			.custom(liters_purchased => {
				if (liters_purchased < 0) return false;
				else return true;
			})
			.withMessage("Liters Purchased invalid"),
		// check('price_per_liter')
		// 	.optional({ checkFalsy: false })
		// 	.bail()
		// 	.isFloat()
		// 	.custom(price_per_liter => {
		// 		if (price_per_liter < 0) return false;
		// 		else return true;
		// 	})
		// 	.withMessage("Price Per Liter invalid"),
	], 
	forUpdatingPurchaseDate: [
		check('purchase_date', "Purchase Date is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(purchase_date => {
				const later = moment(purchase_date, "YYYY-MM-DD", true);
				return later.isValid();
			})
			.withMessage("Invalid purchase date format (YYYY-MM-DD)"),
	], 
	forUpdatingNotes: [
		check('notes')
			.optional({ checkFalsy: false })
			.bail()
			.isLength({ min: 2, max: check_length_TEXT })
			.withMessage(`Invalid length (2 - ${check_length_TEXT}) characters`),
	], 
	forReceiptImageUpload: [
		check('receipt_image')
			.optional({ checkFalsy: false }),
		check('receipt_image_public_id')
			.optional({ checkFalsy: false }), 
	], 
	forUpdatingRawMaterial: [
		check('raw_material_unique_id')
			.optional({ checkFalsy: false })
			.bail()
			.custom(async (raw_material_unique_id: string, { req }) => {
				const data = await RAW_MATERIAL.findOne({ where: { unique_id: raw_material_unique_id, status: default_status } });
				if (!data) return Promise.reject('Raw Material not found!');
			}),
	], 
	forUpdatingDeliveryStatus: [
		check('delivery_status', "Delivery Status is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 3, max: 20 })
			.withMessage("Invalid length (3 - 20) characters")
			.bail()
			.custom(delivery_status => !!validate_fuel_delivery_status(delivery_status))
			.withMessage(`Invalid delivery status, accepted statuses (${fuel_delivery_status.partially_delivered} or ${fuel_delivery_status.delivered})`),
	], 
}