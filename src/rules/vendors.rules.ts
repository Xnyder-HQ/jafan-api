import { Request, Response } from "express";
import { Op } from "sequelize";
import { check } from 'express-validator';
import moment from 'moment';
import VENDOR from "../models/vendors.model";
import { default_status, default_delete_status, check_length_TEXT, format_phone_number } from '../config/config';

export const VendorRules = {
	forFindingVendorInternal: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await VENDOR.findOne({ where: { unique_id: unique_id } });
				if (!data) return Promise.reject('Vendor not found!');
			})
	],
	forFindingVendor: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await VENDOR.findOne({ where: { unique_id: unique_id, status: default_status } });
				if (!data) return Promise.reject('Vendor not found!');
			})
	],
	forFindingVendorFalsy: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await VENDOR.findOne({ where: { unique_id: unique_id, status: default_delete_status } });
				if (!data) return Promise.reject('Vendor not found!');
			})
	],
	forFindingVendorAlt: [
		check('vendor_unique_id', "Vendor Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (vendor_unique_id: string, { req }) => {
				const data = await VENDOR.findOne({ where: { unique_id: vendor_unique_id, status: default_status } });
				if (!data) return Promise.reject('Vendor not found!');
			})
	],
	forFindingVendorAltOptional: [
		check('vendor_unique_id')
			.optional({ checkFalsy: false })
			.bail()
			.custom(async (vendor_unique_id: string, { req }) => {
				const data = await VENDOR.findOne({ where: { unique_id: vendor_unique_id, status: default_status } });
				if (!data) return Promise.reject('Vendor not found!');
			})
	],
	forFindingVendorViaPhoneNumber: [
		check('phone_number', "Phone Number is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (phone_number: string, { req }) => {
				const data = await VENDOR.findOne({ where: { [Op.or]: [{ phone_number: phone_number }, { phone_number: format_phone_number(phone_number) }], status: default_status } });
				if (!data) return Promise.reject('Vendor not found!');
			})
	],
	forAdding: [
		check('type', "Type is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 2, max: 50 })
			.withMessage("Invalid length (2 - 50) characters"),
		check('name', "Name is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 2, max: 200 })
			.withMessage("Invalid length (2 - 200) characters"),
		check('contact_person')
			.optional({ checkFalsy: false })
			.bail()
			.isString().isLength({ min: 2, max: 200 })
			.withMessage("Invalid length (2 - 200) characters"),
		check('email')
			.optional({ checkFalsy: false })
			.bail()
			.isEmail()
			.withMessage('Invalid email format'),
			// .bail()
			// .custom(async (email: string, { req }) => {
			// 	const data = await VENDOR.findOne({ where: { email: email, status: default_delete_status } });
			// 	if (data) return Promise.reject('Email already exists!');
			// }),
		check('phone_number', "Phone Number is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isMobilePhone("any")
			.withMessage('Invalid phone number'),
			// .bail()
			// .custom(async (phone_number: string, { req }) => {
			// 	const data = await VENDOR.findOne({ where: { [Op.or]: [{ phone_number: phone_number }, { phone_number: format_phone_number(phone_number) } ], status: default_delete_status } });
			// 	if (data) return Promise.reject('Phone number already exists!');
			// }),
		check('alt_phone_number')
			.optional({ checkFalsy: false })
			.bail()
			.isMobilePhone("any")
			.withMessage("Invalid phone number"),
		check('address')
			.optional({ checkFalsy: false })
			.bail()
			.isString().isLength({ min: 2, max: 300 })
			.withMessage("Invalid length (2 - 300) characters"),
		check('total_spend')
			.optional({ checkFalsy: false })
			.bail()
			.isFloat()
			.custom(total_spend => {
				if (total_spend < 0) return false;
				else return true;
			})
			.withMessage("Total Spend invalid")
	],
	forUpdatingDetails: [
		check('name', "Name is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 2, max: 200 })
			.withMessage("Invalid length (2 - 200) characters"),
		check('contact_person')
			.optional({ checkFalsy: false })
			.bail()
			.isString().isLength({ min: 2, max: 200 })
			.withMessage("Invalid length (2 - 200) characters"),
		check('email')
			.optional({ checkFalsy: false })
			.bail()
			.isEmail()
			.withMessage('Invalid email format'),
			// .bail()
			// .custom(async (email: string, { req }) => {
			// 	const data = await VENDOR.findOne({ where: { email: email, status: default_delete_status } });
			// 	if (data) return Promise.reject('Email already exists!');
			// }),
		check('phone_number', "Phone Number is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isMobilePhone("any")
			.withMessage('Invalid phone number'),
			// .bail()
			// .custom(async (phone_number: string, { req }) => {
			// 	const data = await VENDOR.findOne({ where: { [Op.or]: [{ phone_number: phone_number }, { phone_number: format_phone_number(phone_number) } ], status: default_delete_status } });
			// 	if (data) return Promise.reject('Phone number already exists!');
			// }),
		check('alt_phone_number')
			.optional({ checkFalsy: false })
			.bail()
			.isMobilePhone("any")
			.withMessage("Invalid phone number"),
	], 
	forUpdatingTotalSpend: [
		check('total_spend', "Total Spend is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isFloat()
			.custom(total_spend => {
				if (total_spend < 0) return false;
				else return true;
			})
			.withMessage("Total Spend invalid")
	], 
	forProfileImageUpload: [
		check('profile_image', "Profile Image is required (url)")
			.exists({ checkNull: true, checkFalsy: true }),
		check('profile_image_public_id', "Profile Image Public Id is required")
			.exists({ checkNull: true, checkFalsy: true })
	],
	forUpdatingAddress: [
		check('address')
			.optional({ checkFalsy: false })
			.bail()
			.isString().isLength({ min: 2, max: 300 })
			.withMessage("Invalid length (2 - 300) characters"),
	],
	forSearching: [
		check('search', "Search is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 2, max: 500 })
			.withMessage("Invalid length (2 - 500) characters"),
	],
	forEmail: [
		check('email', "Email is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isEmail()
			.withMessage('Invalid email format')
	],
	forPhoneNumber: [
		check('phone_number', "Phone Number is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isMobilePhone("any")
			.withMessage('Invalid phone number')
	],
}