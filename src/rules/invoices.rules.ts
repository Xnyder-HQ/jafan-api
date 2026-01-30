import { Request, Response } from "express";
import { Op } from "sequelize";
import { check } from 'express-validator';
import moment from 'moment';
import INVOICE from "../models/invoices.model";
import { default_status, default_delete_status, strip_text, check_length_TEXT, validate_invoice_type, invoice_type, validate_invoice_status, invoice_status } from '../config/config';

export const InvoiceRules = {
	forFindingInvoiceInternal: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await INVOICE.findOne({ where: { unique_id: unique_id } });
				if (!data) return Promise.reject('Invoice not found!');
			})
	],
	forFindingInvoice: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await INVOICE.findOne({ where: { unique_id: unique_id, status: default_status } });
				if (!data) return Promise.reject('Invoice not found!');
			})
	],
	forFindingInvoiceFalsy: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await INVOICE.findOne({ where: { unique_id: unique_id, status: default_delete_status } });
				if (!data) return Promise.reject('Invoice not found!');
			})
	],
	forFindingInvoiceAlt: [
		check('invoice_unique_id', "Invoice Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (invoice_unique_id: string, { req }) => {
				const data = await INVOICE.findOne({ where: { unique_id: invoice_unique_id, status: default_status } });
				if (!data) return Promise.reject('Invoice not found!');
			})
	],
	forAdding: [
		check('invoice_date', "Invoice Date is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(invoice_date => {
				const later = moment(invoice_date, "YYYY-MM-DD", true);
				return later.isValid();
			})
			.withMessage("Invalid invoice date format (YYYY-MM-DD)"),
		check('due_date', "Due Date is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(due_date => {
				const later = moment(due_date, "YYYY-MM-DD", true);
				return later.isValid();
			})
			.withMessage("Invalid due date format (YYYY-MM-DD)"),
		check('invoice_type', "Invoice Type is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 3, max: 20 })
			.withMessage("Invalid length (3 - 20) characters")
			.bail()
			.custom(invoice_type => !!validate_invoice_type(invoice_type))
			.withMessage(`Invalid invoice type, accepted types (${invoice_type.credit} & ${invoice_type.immediate})`),
		check('notes')
			.optional({ checkFalsy: false })
			.bail()
			.isString().isLength({ min: 1, max: check_length_TEXT })
			.withMessage(`Invalid length (1 - ${check_length_TEXT}) characters`),
	],
	forUpdatingNotes: [
		check('notes')
			.optional({ checkFalsy: false })
			.bail()
			.isLength({ min: 2, max: check_length_TEXT })
			.withMessage(`Invalid length (2 - ${check_length_TEXT}) characters`),
	],
	forUpdatingDueDate: [
		check('due_date', "Due Date is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(due_date => {
				const later = moment(due_date, "YYYY-MM-DD", true);
				return later.isValid();
			})
			.withMessage("Invalid due date format (YYYY-MM-DD)"),
	], 
	forUpdatingInvoiceType: [
		check('invoice_type', "Invoice Type is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 3, max: 20 })
			.withMessage("Invalid length (3 - 20) characters")
			.bail()
			.custom(invoice_type => !!validate_invoice_type(invoice_type))
			.withMessage(`Invalid invoice type, accepted types (${invoice_type.credit} & ${invoice_type.immediate})`),
	], 
	forUpdatingInvoiceStatus: [
		check('invoice_status', "Invoice Status is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 3, max: 20 })
			.withMessage("Invalid length (3 - 20) characters")
			.bail()
			.custom(invoice_status => !!validate_invoice_status(invoice_status))
			.withMessage(`Invalid invoice status, accepted statuses (${invoice_status.cancelled}, ${invoice_status.paid}, ${invoice_status.partially_paid} & ${invoice_status.unpaid})`),
	],
}