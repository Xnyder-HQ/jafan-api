import { Request, Response } from "express";
import { Op } from "sequelize";
import { check } from 'express-validator';
import moment from 'moment';
import VENDOR_PAYMENT from "../models/vendorPayments.model";
import USER from "../models/users.model";
import { default_status, default_delete_status, strip_text, check_length_TEXT, validate_vendor_payment_method, vendor_payment_method } from '../config/config';

export const VendorPaymentRules = {
	forFindingVendorPaymentInternal: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await VENDOR_PAYMENT.findOne({ where: { unique_id: unique_id } });
				if (!data) return Promise.reject('Vendor Payment not found!');
			})
	],
	forFindingVendorPayment: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await VENDOR_PAYMENT.findOne({ where: { unique_id: unique_id, status: default_status } });
				if (!data) return Promise.reject('Vendor Payment not found!');
			})
	],
	forFindingVendorPaymentFalsy: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await VENDOR_PAYMENT.findOne({ where: { unique_id: unique_id, status: default_delete_status } });
				if (!data) return Promise.reject('Vendor Payment not found!');
			})
	],
	forFindingVendorPaymentAlt: [
		check('vendor_payment_unique_id', "Vendor Payment Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (vendor_payment_unique_id: string, { req }) => {
				const data = await VENDOR_PAYMENT.findOne({ where: { unique_id: vendor_payment_unique_id, status: default_status } });
				if (!data) return Promise.reject('Vendor Payment not found!');
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
			.custom(payment_method => !!validate_vendor_payment_method(payment_method))
			.withMessage(`Invalid payment method, accepted methods (${vendor_payment_method.cash}, ${vendor_payment_method.cheque}, ${vendor_payment_method.pos} & ${vendor_payment_method.transfer})`),
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
		check('facilitated_by')
			.optional({ checkFalsy: false })
			.bail()
			.custom(async (facilitated_by: string, { req }) => {
				const data = await USER.findOne({ where: { unique_id: facilitated_by, status: default_status } });
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
}