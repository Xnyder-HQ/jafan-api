import { Request, Response } from "express";
import { Op } from "sequelize";
import { check } from 'express-validator';
import moment from 'moment';
import { default_status, validate_past_date, validate_future_end_date } from '../config/config';

export const DefaultRules = {
	forSearching: [
		check('search', "Search is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 2, max: 500 })
			.withMessage("Invalid length (2 - 500) characters"),
	],
	forMessasge: [
		check('message', "Message is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 3, max: 1000 })
			.withMessage("Invalid length (3 - 1000) characters")
	],
	forFiltering: [
		check('start_date', "Start Date is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(start_date => {
				const later = moment(start_date, "YYYY-MM-DD", true);
				return later.isValid();
			})
			.withMessage("Invalid start datetime format (YYYY-MM-DD)")
			.bail()
			.custom(start_date => !!validate_past_date(start_date))
			.withMessage("Invalid start datetime"),
		check('end_date', "End Date is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(end_date => {
				const later = moment(end_date, "YYYY-MM-DD", true);
				return later.isValid();
			})
			.withMessage("Invalid end datetime format (YYYY-MM-DD)")
			.bail()
			.custom((end_date: string, { req }) => !!validate_future_end_date(req.query?.start_date || req.body?.start_date || '', end_date)),
	],
	forEmail: [
		check('email', "Email is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isEmail()
			.withMessage('Invalid email format')
	], 
	forLoginId: [
		check('login_id').exists().isString().withMessage("Login ID is required"),
	], 
	forPassword: [
		check('password').exists().isString().withMessage("Password is required"),
		check('remember_me')
			.optional({ checkFalsy: false })
			.bail()
			.isBoolean()
			.withMessage("Value should be true or false")
	]
}