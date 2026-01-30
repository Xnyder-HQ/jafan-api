import { Request, Response } from "express";
import { Op } from "sequelize";
import { check } from 'express-validator';
import moment from 'moment';
import RAW_MATERIAL from "../models/rawMaterials.model";
import PURCHASE_ORDER from "../models/purchaseOrders.model";
import { default_status, default_delete_status, strip_text, check_length_TEXT, validate_po_type, po_type, validate_po_delivery_status, po_delivery_status } from '../config/config';

export const PurchaseOrderRules = {
	forFindingPurchaseOrderInternal: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await PURCHASE_ORDER.findOne({ where: { unique_id: unique_id } });
				if (!data) return Promise.reject('Purchase Order not found!');
			})
	],
	forFindingPurchaseOrder: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await PURCHASE_ORDER.findOne({ where: { unique_id: unique_id, status: default_status } });
				if (!data) return Promise.reject('Purchase Order not found!');
			})
	],
	forFindingPurchaseOrderFalsy: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await PURCHASE_ORDER.findOne({ where: { unique_id: unique_id, status: default_delete_status } });
				if (!data) return Promise.reject('Purchase Order not found!');
			})
	],
	forFindingPurchaseOrderAlt: [
		check('purchase_order_unique_id', "Purchase Order Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (purchase_order_unique_id: string, { req }) => {
				const data = await PURCHASE_ORDER.findOne({ where: { unique_id: purchase_order_unique_id, status: default_status } });
				if (!data) return Promise.reject('Purchase Order not found!');
			})
	],
	forFindingPurchaseOrderAltOptional: [
		check('purchase_order_unique_id')
			.optional({ checkFalsy: false })
			.bail()
			.custom(async (purchase_order_unique_id: string, { req }) => {
				const data = await PURCHASE_ORDER.findOne({ where: { unique_id: purchase_order_unique_id, status: default_status } });
				if (!data) return Promise.reject('Purchase Order not found!');
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
		check('quantity')
			.optional({ checkFalsy: false })
			.custom(async (quantity: string, { req }) => {
				if (req.body.raw_material_unique_id) return false;
				else return true;
			})
			.withMessage("Quantity is required")
			.bail()
			.isFloat()
			.custom(quantity => {
				if (quantity < 0) return false;
				else return true;
			})
			.withMessage("Quantity invalid"),
		check('po_type', "PO Type is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 3, max: 20 })
			.withMessage("Invalid length (3 - 20) characters")
			.bail()
			.custom(po_type => !!validate_po_type(po_type))
			.withMessage(`Invalid po type, accepted types (${po_type.cement}, ${po_type.general} & ${po_type.maintenance})`),
		check('total_amount', "Total Amount is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isFloat()
			.custom(total_amount => {
				if (total_amount < 0) return false;
				else return true;
			})
			.withMessage("Total Amount invalid"),
		check('order_date', "Order Date is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(order_date => {
				const later = moment(order_date, "YYYY-MM-DD", true);
				return later.isValid();
			})
			.withMessage("Invalid order date format (YYYY-MM-DD)"),
		check('expected_delivery_date')
			.optional({ checkFalsy: false })
			.bail()
			.custom(expected_delivery_date => {
				const later = moment(expected_delivery_date, "YYYY-MM-DD", true);
				return later.isValid();
			})
			.withMessage("Invalid expected delivery date format (YYYY-MM-DD)"),
		check('notes')
			.optional({ checkFalsy: false })
			.bail()
			.isString().isLength({ min: 1, max: check_length_TEXT })
			.withMessage(`Invalid length (1 - ${check_length_TEXT}) characters`),
	],
	forUpdatingPOType: [
		check('po_type', "PO Type is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 3, max: 20 })
			.withMessage("Invalid length (3 - 20) characters")
			.bail()
			.custom(po_type => !!validate_po_type(po_type))
			.withMessage(`Invalid po type, accepted types (${po_type.cement}, ${po_type.general} & ${po_type.maintenance})`),
	], 
	forUpdatingTotalAmount: [
		check('total_amount', "Total Amount is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isFloat()
			.custom(total_amount => {
				if (total_amount < 0) return false;
				else return true;
			})
			.withMessage("Total Amount invalid"),
	], 
	forUpdatingDates: [
		check('order_date', "Order Date is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(order_date => {
				const later = moment(order_date, "YYYY-MM-DD", true);
				return later.isValid();
			})
			.withMessage("Invalid order date format (YYYY-MM-DD)"),
		check('expected_delivery_date')
			.optional({ checkFalsy: false })
			.bail()
			.custom(expected_delivery_date => {
				const later = moment(expected_delivery_date, "YYYY-MM-DD", true);
				return later.isValid();
			})
			.withMessage("Invalid expected delivery date format (YYYY-MM-DD)"),
	], 
	forUpdatingRawMaterial: [
		check('raw_material_unique_id')
			.optional({ checkFalsy: false })
			.bail()
			.custom(async (raw_material_unique_id: string, { req }) => {
				const data = await RAW_MATERIAL.findOne({ where: { unique_id: raw_material_unique_id, status: default_status } });
				if (!data) return Promise.reject('Raw Material not found!');
			}),
		check('quantity')
			.optional({ checkFalsy: false })
			.custom(async (quantity: string, { req }) => {
				if (req.body.raw_material_unique_id) return false;
				else return true;
			})
			.withMessage("Quantity is required")
			.bail()
			.isFloat()
			.custom(quantity => {
				if (quantity < 0) return false;
				else return true;
			})
			.withMessage("Quantity invalid"),
	], 
	forUpdatingNotes: [
		check('notes')
			.optional({ checkFalsy: false })
			.bail()
			.isLength({ min: 2, max: check_length_TEXT })
			.withMessage(`Invalid length (2 - ${check_length_TEXT}) characters`),
	], 
	forUpdatingDeliveryStatus: [
		check('delivery_status', "Delivery Status is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 3, max: 20 })
			.withMessage("Invalid length (3 - 20) characters")
			.bail()
			.custom(delivery_status => !!validate_po_delivery_status(delivery_status))
			.withMessage(`Invalid delivery status, accepted statuses (${po_delivery_status.partially_delivered} or ${po_delivery_status.delivered})`),
	], 
}