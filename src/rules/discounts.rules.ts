import { Request, Response } from "express";
import { Op } from "sequelize";
import { check } from 'express-validator';
import moment from 'moment';
import DISCOUNT from "../models/discounts.model";
import { default_status, default_delete_status, strip_text, check_length_TEXT } from '../config/config';

export const DiscountRules = {
	forFindingDiscountInternal: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await DISCOUNT.findOne({ where: { unique_id: unique_id } });
				if (!data) return Promise.reject('Discount not found!');
			})
	],
	forFindingDiscount: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await DISCOUNT.findOne({ where: { unique_id: unique_id, status: default_status } });
				if (!data) return Promise.reject('Discount not found!');
			})
	],
	forFindingDiscountFalsy: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await DISCOUNT.findOne({ where: { unique_id: unique_id, status: default_delete_status } });
				if (!data) return Promise.reject('Discount not found!');
			})
	],
	forFindingDiscountAlt: [
		check('discount_unique_id', "Discount Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (discount_unique_id: string, { req }) => {
				const data = await DISCOUNT.findOne({ where: { unique_id: discount_unique_id, status: default_status } });
				if (!data) return Promise.reject('Discount not found!');
			})
	],
	forAddingAndUpdating: [
		check('discount_amount', "Discount Amount is required")
			.exists({ checkNull: true, checkFalsy: false })
			.bail()
			.isFloat()
			.custom(discount_amount => {
				if (discount_amount < 0) return false;
				else return true;
			})
			.withMessage("Discount Amount invalid"),
		check('reason')
			.optional({ checkFalsy: false })
			.bail()
			.isString().isLength({ min: 1, max: 1000 })
			.withMessage("Invalid length (1 - 1000) characters"),
	],
}