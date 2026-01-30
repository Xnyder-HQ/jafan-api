import { Request, Response } from "express";
import { Op } from "sequelize";
import { check } from 'express-validator';
import moment from 'moment';
import EXPENSE from "../models/expenses.model";
import { default_status, default_delete_status, strip_text, check_length_TEXT } from '../config/config';

export const ExpenseRules = {
	forFindingExpenseInternal: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await EXPENSE.findOne({ where: { unique_id: unique_id } });
				if (!data) return Promise.reject('Expense not found!');
			})
	],
	forFindingExpense: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await EXPENSE.findOne({ where: { unique_id: unique_id, status: default_status } });
				if (!data) return Promise.reject('Expense not found!');
			})
	],
	forFindingExpenseFalsy: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await EXPENSE.findOne({ where: { unique_id: unique_id, status: default_delete_status } });
				if (!data) return Promise.reject('Expense not found!');
			})
	],
	forFindingExpenseAlt: [
		check('expense_unique_id', "Expense Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (expense_unique_id: string, { req }) => {
				const data = await EXPENSE.findOne({ where: { unique_id: expense_unique_id, status: default_status } });
				if (!data) return Promise.reject('Expense not found!');
			})
	],
	forAdding: [
		check('category', "Category is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 2, max: 50 })
			.withMessage("Invalid length (2 - 50) characters"), 
		check('amount', "Amount is required")
			.exists({ checkNull: true, checkFalsy: false })
			.bail()
			.isFloat()
			.custom(amount => {
				if (amount < 0) return false;
				else return true;
			})
			.withMessage("Amount invalid"),
		check('expense_date', "Expense Date is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(expense_date => {
				const later = moment(expense_date, "YYYY-MM-DD", true);
				return later.isValid();
			})
			.withMessage("Invalid expense date format (YYYY-MM-DD)"),
		check('notes')
			.optional({ checkFalsy: false })
			.bail()
			.isLength({ min: 2, max: check_length_TEXT })
			.withMessage(`Invalid length (2 - ${check_length_TEXT}) characters`),
		check('receipt_image')
			.optional({ checkFalsy: false }),
		check('receipt_image_public_id')
			.optional({ checkFalsy: false }), 
	], 
	forUpdatingNotes: [
		check('notes')
			.optional({ checkFalsy: false })
			.bail()
			.isLength({ min: 2, max: check_length_TEXT })
			.withMessage(`Invalid length (2 - ${check_length_TEXT}) characters`),
	], 
	forReceiptImageUpload: [
		check('receipt_image')
			.optional({ checkFalsy: false }),
		check('receipt_image_public_id')
			.optional({ checkFalsy: false }), 
	],
}