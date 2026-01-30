import { Request, Response } from "express";
import { Op } from "sequelize";
import { check } from 'express-validator';
import moment from 'moment';
import SALES_ORDER_ITEM from "../models/salesOrderItems.model";
import { default_status, default_delete_status, strip_text } from '../config/config';

export const SalesOrderItemRules = {
	forFindingSalesOrderItemInternal: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await SALES_ORDER_ITEM.findOne({ where: { unique_id: unique_id } });
				if (!data) return Promise.reject('Sales Order Item not found!');
			})
	],
	forFindingSalesOrderItem: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await SALES_ORDER_ITEM.findOne({ where: { unique_id: unique_id, status: default_status } });
				if (!data) return Promise.reject('Sales Order Item not found!');
			})
	],
	forFindingSalesOrderItemFalsy: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await SALES_ORDER_ITEM.findOne({ where: { unique_id: unique_id, status: default_delete_status } });
				if (!data) return Promise.reject('Sales Order Item not found!');
			})
	],
	forFindingSalesOrderItemAlt: [
		check('sales_order_item_unique_id', "Sales Order Item Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (sales_order_item_unique_id: string, { req }) => {
				const data = await SALES_ORDER_ITEM.findOne({ where: { unique_id: sales_order_item_unique_id, status: default_status } });
				if (!data) return Promise.reject('Sales Order Item not found!');
			})
	],
	forAdding: [
		check('quantity_ordered', "Quantity Ordered is required")
			.exists({ checkNull: true, checkFalsy: false })
			.bail()
			.isFloat()
			.custom(quantity_ordered => {
				if (quantity_ordered < 0) return false;
				else return true;
			})
			.withMessage("Quantity Ordered invalid"),
	],
	forAddingMultiple: [
		check('items', "Items are required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isArray({ min: 1 })
			.withMessage("Must be an array of objects that include - product_unique_id and quantity_ordered variables (not empty)"),
	], 
	forUpdatingQuantitySupplied: [
		check('quantity_supplied', "Quantity Supplied is required")
			.exists({ checkNull: true, checkFalsy: false })
			.bail()
			.isFloat()
			.custom(quantity_supplied => {
				if (quantity_supplied < 0) return false;
				else return true;
			})
			.withMessage("Quantity Supplied invalid"),
	],
}