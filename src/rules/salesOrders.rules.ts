import { Request, Response } from "express";
import { Op } from "sequelize";
import { check } from 'express-validator';
import moment from 'moment';
import SALES_ORDER from "../models/salesOrders.model";
import { default_status, default_delete_status, strip_text, check_length_TEXT } from '../config/config';

export const SalesOrderRules = {
	forFindingSalesOrderInternal: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await SALES_ORDER.findOne({ where: { unique_id: unique_id } });
				if (!data) return Promise.reject('Sales Order not found!');
			})
	],
	forFindingSalesOrder: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await SALES_ORDER.findOne({ where: { unique_id: unique_id, status: default_status } });
				if (!data) return Promise.reject('Sales Order not found!');
			})
	],
	forFindingSalesOrderFalsy: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await SALES_ORDER.findOne({ where: { unique_id: unique_id, status: default_delete_status } });
				if (!data) return Promise.reject('Sales Order not found!');
			})
	],
	forFindingSalesOrderAlt: [
		check('sales_order_unique_id', "Sales Order Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (sales_order_unique_id: string, { req }) => {
				const data = await SALES_ORDER.findOne({ where: { unique_id: sales_order_unique_id, status: default_status } });
				if (!data) return Promise.reject('Sales Order not found!');
			})
	],
	forAdding: [
		check('total_amount', "Total Amount is required")
			.exists({ checkNull: true, checkFalsy: false })
			.bail()
			.isFloat()
			.custom(total_amount => {
				if (total_amount < 0) return false;
				else return true;
			})
			.withMessage("Total Amount invalid"),
		check('discount_amount')
			.optional({ checkFalsy: false })
			.bail()
			.isFloat()
			.custom(discount_amount => {
				if (discount_amount < 0) return false;
				else return true;
			})
			.withMessage("Discount Amount invalid"),
		check('discount_reason')
			.optional({ checkFalsy: false })
			.custom(async (discount_reason: string, { req }) => {
				if (req.body.discount_amount > 0) return false;
				else return true;
			})
			.withMessage("Discount Reason is required")
			.bail()
			.isString().isLength({ min: 1, max: 1000 })
			.withMessage("Invalid length (1 - 1000) characters"),
		check('outside_town', "Outside Town is required")
			.exists({ checkNull: true, checkFalsy: false })
			.bail()
			.isBoolean()
			.withMessage("Value should be true or false"),
		check('outside_town_location')
			.optional({ checkFalsy: false })
			.custom(async (outside_town_location: string, { req }) => {
				if (req.body.outside_town === true || req.body.outside_town === 1) return false;
				else return true;
			})
			.withMessage("Outside Town Location is required")
			.bail()
			.isString().isLength({ min: 1, max: 300 })
			.withMessage("Invalid length (1 - 300) characters"),
		check('estimated_trip_liters')
			.optional({ checkFalsy: false })
			.bail()
			.isFloat()
			.custom(estimated_trip_liters => {
				if (estimated_trip_liters < 0) return false;
				else return true;
			})
			.withMessage("Estimated Trip Liter invalid"),
		// check('outside_town_surcharge')
		// 	.optional({ checkFalsy: false })
		// 	.custom(async (outside_town_surcharge: string, { req }) => {
		// 		if (req.body.outside_town === true || req.body.outside_town === 1) return false;
		// 		else return true;
		// 	})
		// 	.withMessage("Outside Town Surcharge is required")
		// 	.bail()
		// 	.isFloat()
		// 	.custom(outside_town_surcharge => {
		// 		if (outside_town_surcharge < 0) return false;
		// 		else return true;
		// 	})
		// 	.withMessage("Outside Town Surcharge invalid"),
		check('amount_payable', "Amount Payable is required")
			.exists({ checkNull: true, checkFalsy: false })
			.bail()
			.isFloat()
			.custom(amount_payable => {
				if (amount_payable < 0) return false;
				else return true;
			})
			.withMessage("Amount Payable invalid"),
		check('total_items_ordered', "Total Items Ordered is required")
			.exists({ checkNull: true, checkFalsy: false })
			.bail()
			.isFloat()
			.custom(total_items_ordered => {
				if (total_items_ordered < 0) return false;
				else return true;
			})
			.withMessage("Total Items Ordered invalid"),
		check('total_items_dropped', "Total Items Dropped is required")
			.exists({ checkNull: true, checkFalsy: false })
			.bail()
			.isFloat()
			.custom(total_items_dropped => {
				if (total_items_dropped < 0) return false;
				else return true;
			})
			.withMessage("Total Items Dropped invalid"),
		check('notes')
			.optional({ checkFalsy: false })
			.bail()
			.isString().isLength({ min: 1, max: check_length_TEXT })
			.withMessage(`Invalid length (1 - ${check_length_TEXT}) characters`),
	],
	forUpdatingDiscount: [
		check('discount_amount')
			.optional({ checkFalsy: false })
			.bail()
			.isFloat()
			.custom(discount_amount => {
				if (discount_amount < 0) return false;
				else return true;
			})
			.withMessage("Discount Amount invalid"),
		check('discount_reason')
			.optional({ checkFalsy: false })
			.custom(async (discount_reason: string, { req }) => {
				if (req.body.discount_amount > 0) return false;
				else return true;
			})
			.withMessage("Discount Reason is required")
			.bail()
			.isString().isLength({ min: 1, max: 1000 })
			.withMessage("Invalid length (1 - 1000) characters"),
	],
	forUpdatingEstimatedTripLiters: [
		check('estimated_trip_liters')
			.optional({ checkFalsy: false })
			.bail()
			.isFloat()
			.custom(estimated_trip_liters => {
				if (estimated_trip_liters < 0) return false;
				else return true;
			})
			.withMessage("Estimated Trip Liter invalid"),
	], 
	forUpdatingOutsideTownDetails: [
		check('outside_town', "Outside Town is required")
			.exists({ checkNull: true, checkFalsy: false })
			.bail()
			.isBoolean()
			.withMessage("Value should be true or false"),
		check('outside_town_location')
			.optional({ checkFalsy: false })
			.custom(async (outside_town_location: string, { req }) => {
				if (req.body.outside_town === true || req.body.outside_town === 1) return false;
				else return true;
			})
			.withMessage("Outside Town Location is required")
			.bail()
			.isString().isLength({ min: 1, max: 300 })
			.withMessage("Invalid length (1 - 300) characters"),
		// check('outside_town_surcharge')
		// 	.optional({ checkFalsy: false })
		// 	.custom(async (outside_town_surcharge: string, { req }) => {
		// 		if (req.body.outside_town === true || req.body.outside_town === 1) return false;
		// 		else return true;
		// 	})
		// 	.withMessage("Outside Town Surcharge is required")
		// 	.bail()
		// 	.isFloat()
		// 	.custom(outside_town_surcharge => {
		// 		if (outside_town_surcharge < 0) return false;
		// 		else return true;
		// 	})
		// 	.withMessage("Outside Town Surcharge invalid"),
	], 
	forUpdatingNotes: [
		check('notes')
			.optional({ checkFalsy: false })
			.bail()
			.isLength({ min: 2, max: check_length_TEXT })
			.withMessage(`Invalid length (2 - ${check_length_TEXT}) characters`),
	],
	forUpdatingTotalItemsDropped: [
		check('total_items_dropped', "Total Items Dropped is required")
			.exists({ checkNull: true, checkFalsy: false })
			.bail()
			.isFloat()
			.custom(total_items_dropped => {
				if (total_items_dropped < 0) return false;
				else return true;
			})
			.withMessage("Total Items Dropped invalid")
	],
}