import { Request, Response } from "express";
import { Op } from "sequelize";
import { check } from 'express-validator';
import moment from 'moment';
import INVOICE_PAYMENT from "../models/invoicePayments.model";
import USER from "../models/users.model";
import { default_status, default_delete_status, strip_text, check_length_TEXT, validate_invoice_payment_method, invoice_payment_method, validate_invoice_status, invoice_status } from '../config/config';

export const InvoicePaymentRules = {
	forFindingInvoicePaymentInternal: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await INVOICE_PAYMENT.findOne({ where: { unique_id: unique_id } });
				if (!data) return Promise.reject('Invoice Payment not found!');
			})
	],
	forFindingInvoicePayment: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await INVOICE_PAYMENT.findOne({ where: { unique_id: unique_id, status: default_status } });
				if (!data) return Promise.reject('Invoice Payment not found!');
			})
	],
	forFindingInvoicePaymentFalsy: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await INVOICE_PAYMENT.findOne({ where: { unique_id: unique_id, status: default_delete_status } });
				if (!data) return Promise.reject('Invoice Payment not found!');
			})
	],
	forFindingInvoicePaymentAlt: [
		check('invoice_payment_unique_id', "Invoice Payment Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (invoice_payment_unique_id: string, { req }) => {
				const data = await INVOICE_PAYMENT.findOne({ where: { unique_id: invoice_payment_unique_id, status: default_status } });
				if (!data) return Promise.reject('Invoice Payment not found!');
			})
	],
	forAdding: [
		check('payment_date', "Payment Date is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(payment_date => {
				const later = moment(payment_date, "YYYY-MM-DD", true);
				return later.isValid();
			})
			.withMessage("Invalid payment date format (YYYY-MM-DD)"),
		check('payment_method', "Payment Method is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 3, max: 20 })
			.withMessage("Invalid length (3 - 20) characters")
			.bail()
			.custom(payment_method => !!validate_invoice_payment_method(payment_method))
			.withMessage(`Invalid payment method, accepted methods (${invoice_payment_method.account_balance}, ${invoice_payment_method.cash}, ${invoice_payment_method.cheque}, ${invoice_payment_method.pos} & ${invoice_payment_method.transfer})`),
		check('amount_paid', "Amount Paid is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isFloat()
			.custom(amount_paid => {
				if (amount_paid < 0) return false;
				else return true;
			})
			.withMessage("Amount Paid invalid"),
		check('receipt_reference')
			.optional({ checkFalsy: false })
			.bail()
			.isString().isLength({ min: 1, max: 200 })
			.withMessage(`Invalid length (1 - 200) characters`),
		check('notes')
			.optional({ checkFalsy: false })
			.bail()
			.isString().isLength({ min: 1, max: check_length_TEXT })
			.withMessage(`Invalid length (1 - ${check_length_TEXT}) characters`),
		check('receipt_image')
			.optional({ checkFalsy: false }),
		check('receipt_image_public_id')
			.optional({ checkFalsy: false }), 
		check('received_by')
			.optional({ checkFalsy: false })
			.bail()
			.custom(async (received_by: string, { req }) => {
				const data = await USER.findOne({ where: { unique_id: received_by, status: default_status } });
				if (!data) return Promise.reject('User not found!');
			})
	],
	forUpdatingNotes: [
		check('notes')
			.optional({ checkFalsy: false })
			.bail()
			.isLength({ min: 2, max: check_length_TEXT })
			.withMessage(`Invalid length (2 - ${check_length_TEXT}) characters`),
	],
	forUpdatingReceiptReference: [
		check('receipt_reference')
			.optional({ checkFalsy: false })
			.bail()
			.isString().isLength({ min: 1, max: 200 })
			.withMessage(`Invalid length (1 - 200) characters`),
	], 
	forReceiptImageUpload: [
		check('receipt_image', "Receipt Image is required (url)")
			.exists({ checkNull: true, checkFalsy: true }),
		check('receipt_image_public_id', "Receipt Image Public Id is required")
			.exists({ checkNull: true, checkFalsy: true })
	],
	forUpdatingInvoicePaymentStatus: [
		check('invoice_status', "Invoice Payment Status is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 3, max: 20 })
			.withMessage("Invalid length (3 - 20) characters")
			.bail()
			.custom(invoice_status => !!validate_invoice_status(invoice_status))
			.withMessage(`Invalid invoice status, accepted statuses (${invoice_status.cancelled}, ${invoice_status.paid}, ${invoice_status.partially_paid} & ${invoice_status.unpaid})`),
	],
}