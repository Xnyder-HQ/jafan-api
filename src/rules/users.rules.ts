import { Request, Response } from "express";
import { Op } from "sequelize";
import { check } from 'express-validator';
import moment from 'moment';
import USER from "../models/users.model";
import { default_status, default_delete_status, check_length_TEXT, format_phone_number, password_options } from '../config/config';

export const UserRules = {
	forFindingUserInternal: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await USER.findOne({ where: { unique_id: unique_id } });
				if (!data) return Promise.reject('User not found!');
			})
	],
	forFindingUser: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await USER.findOne({ where: { unique_id: unique_id, status: default_status } });
				if (!data) return Promise.reject('User not found!');
			})
	],
	forFindingUserFalsy: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await USER.findOne({ where: { unique_id: unique_id, status: default_status } });
				if (!data) return Promise.reject('User not found!');
			})
	],
	forFindingUserAlt: [
		check('user_unique_id', "User Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (user_unique_id: string, { req }) => {
				const data = await USER.findOne({ where: { unique_id: user_unique_id, status: default_status } });
				if (!data) return Promise.reject('User not found!');
			})
	],
	forFindingUserViaPhoneNumber: [
		check('phone_number', "Phone Number is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (phone_number: string, { req }) => {
				const data = await USER.findOne({ where: { [Op.or]: [{ phone_number: phone_number }, { phone_number: format_phone_number(phone_number) }], status: default_status } });
				if (!data) return Promise.reject('User not found!');
			})
	],
	forAdding: [
		check('firstname', "Firstname is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 3, max: 50 })
			.withMessage("Invalid length (3 - 50) characters"),
		check('middlename')
			.optional({ checkFalsy: false })
			.bail()
			.isString().isLength({ min: 3, max: 50 })
			.withMessage("Invalid length (3 - 50) characters"),
		check('lastname', "Lastname is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 3, max: 50 })
			.withMessage("Invalid length (3 - 50) characters"),
		check('email', "Email is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isEmail()
			.withMessage('Invalid email format')
			.bail()
			.custom(async (email: string, { req }) => {
				const data = await USER.findOne({ where: { email: email, status: default_status } });
				if (data) return Promise.reject('Email already exists!');
			}),
		check('phone_number')
			.optional({ checkFalsy: false })
			.bail()
			.isMobilePhone("any")
			.withMessage('Invalid phone number')
			.bail()
			.custom(async (phone_number: string, { req }) => {
				const data = await USER.findOne({ where: { [Op.or]: [{ phone_number: phone_number }, { phone_number: format_phone_number(phone_number) } ], status: default_status } });
				if (data) return Promise.reject('Phone number already exists!');
			}),
		check('alt_phone_number')
			.optional({ checkFalsy: false })
			.bail()
			.isMobilePhone("any")
			.withMessage("Invalid phone number"),
		check('gender', "Gender is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 3, max: 20 })
			.withMessage("Invalid length (3 - 20) characters"),
		check('date_of_birth')
			.optional({ checkFalsy: false })
			.bail()
			.custom(date_of_birth => {
				const later = moment(date_of_birth, "YYYY-MM-DD", true);
				return later.isValid();
			})
			.withMessage("Invalid Date of Birth format (YYYY-MM-DD)"),
		check('address')
			.optional({ checkFalsy: false })
			.bail()
			.isString().isLength({ min: 3, max: 300 })
			.withMessage("Invalid length (3 - 300) characters"),
		check('country')
			.optional({ checkFalsy: false })
			.bail()
			.isString().isLength({ min: 3, max: 50 })
			.withMessage("Invalid length (3 - 50) characters"),
		check('state')
			.optional({ checkFalsy: false })
			.bail()
			.isString().isLength({ min: 3, max: 50 })
			.withMessage("Invalid length (3 - 50) characters"),
		check('city')
			.optional({ checkFalsy: false })
			.bail()
			.isString().isLength({ min: 3, max: 50 })
			.withMessage("Invalid length (3 - 50) characters"),
		check('password', "Password is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isStrongPassword(password_options)
			.withMessage('Invalid password (must be 8 characters or more and contain one or more uppercase, lowercase, number and special character)'),
		check('confirmPassword', "Confirm Password is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().custom((confirmPassword, { req }) => req.body.password === confirmPassword)
			.withMessage('Passwords are different')
	],
	forAddingViaOther: [
		check('firstname', "Firstname is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 3, max: 50 })
			.withMessage("Invalid length (3 - 50) characters"),
		check('middlename')
			.optional({ checkFalsy: false })
			.bail()
			.isString().isLength({ min: 3, max: 50 })
			.withMessage("Invalid length (3 - 50) characters"),
		check('lastname', "Lastname is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 3, max: 50 })
			.withMessage("Invalid length (3 - 50) characters"),
		check('email', "Email is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isEmail()
			.withMessage('Invalid email format')
			.bail()
			.custom(async (email: string, { req }) => {
				const data = await USER.findOne({ where: { email: email, status: default_status } });
				if (data) return Promise.reject('Email already exists!');
			}),
		check('phone_number')
			.optional({ checkFalsy: false })
			.bail()
			.isMobilePhone("any")
			.withMessage('Invalid phone number')
			.bail()
			.custom(async (phone_number: string, { req }) => {
				const data = await USER.findOne({ where: { [Op.or]: [{ phone_number: phone_number }, { phone_number: format_phone_number(phone_number) } ], status: default_status } });
				if (data) return Promise.reject('Phone number already exists!');
			}),
		check('alt_phone_number')
			.optional({ checkFalsy: false })
			.bail()
			.isMobilePhone("any")
			.withMessage("Invalid phone number"),
		check('gender', "Gender is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 3, max: 20 })
			.withMessage("Invalid length (3 - 20) characters"),
		check('date_of_birth')
			.optional({ checkFalsy: false })
			.bail()
			.custom(date_of_birth => {
				const later = moment(date_of_birth, "YYYY-MM-DD", true);
				return later.isValid();
			})
			.withMessage("Invalid Date of Birth format (YYYY-MM-DD)"),
		check('address')
			.optional({ checkFalsy: false })
			.bail()
			.isString().isLength({ min: 3, max: 300 })
			.withMessage("Invalid length (3 - 300) characters"),
		check('country')
			.optional({ checkFalsy: false })
			.bail()
			.isString().isLength({ min: 3, max: 50 })
			.withMessage("Invalid length (3 - 50) characters"),
		check('state')
			.optional({ checkFalsy: false })
			.bail()
			.isString().isLength({ min: 3, max: 50 })
			.withMessage("Invalid length (3 - 50) characters"),
		check('city')
			.optional({ checkFalsy: false })
			.bail()
			.isString().isLength({ min: 3, max: 50 })
			.withMessage("Invalid length (3 - 50) characters"),
		check('profile_image', "Profile Image is required (url)")
			.exists({ checkNull: true, checkFalsy: true }),
	],
	forEmailLogin: [
		check('email', "Email is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isEmail()
			.withMessage('Invalid email format'),
		check('password').exists().isString().withMessage("Password is required"),
		check('remember_me')
			.optional({ checkFalsy: false })
			.bail()
			.isBoolean()
			.withMessage("Value should be true or false")
	],
	forEmailLoginAlt: [
		check('email', "Email is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isEmail()
			.withMessage('Invalid email format'),
		check('remember_me')
			.optional({ checkFalsy: false })
			.bail()
			.isBoolean()
			.withMessage("Value should be true or false")
	],
	forUpdatingNames: [
		check('firstname', "Firstname is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 2, max: 50 })
			.withMessage("Invalid length (2 - 50) characters"),
		check('middlename')
			.optional({ checkFalsy: false })
			.bail()
			.isString().isLength({ min: 2, max: 50 })
			.withMessage("Invalid length (2 - 50) characters"),
		check('lastname', "Lastname is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 2, max: 50 })
			.withMessage("Invalid length (2 - 50) characters"),
	],
	forChangingPassword: [
		check('oldPassword', "Old Password is required")
			.exists({ checkNull: true, checkFalsy: true })
			.isString()
			.withMessage("Invalid old password"),
		check('password', "Password is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isStrongPassword(password_options)
			.withMessage('Invalid password (must be 8 characters or more and contain one or more uppercase, lowercase, number and special character)'),
		check('confirmPassword', "Confirm Password is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().custom((confirmPassword, { req }) => req.body.password === confirmPassword)
			.withMessage('Passwords are different')
	],
	forProfileImageUpload: [
		check('profile_image', "Profile Image is required (url)")
			.exists({ checkNull: true, checkFalsy: true }),
		check('profile_image_public_id', "Profile Image Public Id is required")
			.exists({ checkNull: true, checkFalsy: true })
	],
	forUpdatingAddressDetails: [
		check('country', "Country is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 3, max: 50 })
			.withMessage("Invalid length (3 - 50) characters"),
		check('state', "State is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 3, max: 50 })
			.withMessage("Invalid length (3 - 50) characters"),
		check('city', "City is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 3, max: 50 })
			.withMessage("Invalid length (3 - 50) characters"),
		check('address')
			.optional({ checkFalsy: false })
			.bail()
			.isString().isLength({ min: 3, max: 300 })
			.withMessage("Invalid length (3 - 300) characters"),
	],
	forUpdatingDetails: [
		check('phone_number', "Phone number is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isMobilePhone("any")
			.bail()
			.custom(async (phone_number: string, { req }) => {
				const data = await USER.findOne({ 
					where: { 
						[Op.or]: [
							{ phone_number: phone_number }, 
							{ phone_number: format_phone_number(phone_number) } 
						], 
						unique_id: {
							[Op.ne]: req.query?.unique_id || req.body.unique_id || req.USER_UNIQUE_ID || '',
						},
						status: default_status 
					} 
				});
				if (data) return Promise.reject('Phone number already exists!');
			}),
		check('alt_phone_number')
			.optional({ checkFalsy: false })
			.bail()
			.isMobilePhone("any")
			.withMessage("Invalid phone number"),
		check('gender', "Gender is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 3, max: 20 })
			.withMessage("Invalid length (3 - 20) characters"),
		check('date_of_birth', "Date of Birth is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(date_of_birth => {
				const later = moment(date_of_birth, "YYYY-MM-DD", true);
				return later.isValid();
			})
			.withMessage("Invalid Date of Birth format (YYYY-MM-DD)"),
	],
	forUpdatingUsername: [
		check('username', "Username is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 2, max: 100 })
			.withMessage("Invalid length (2 - 100) characters"),
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
	forEmailPasswordReset: [
		check('email', "Email is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isEmail()
			.withMessage('Invalid email format')
			.bail()
			.custom(async (email: string, { req }) => {
				const data = await USER.findOne({ where: { email: email, status: default_status } });
				if (!data) return Promise.reject('Email not found!');
			}),
	],
}