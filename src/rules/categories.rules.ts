import { Request, Response } from "express";
import { Op } from "sequelize";
import { check } from 'express-validator';
import moment from 'moment';
import CATEGORY from "../models/categories.model";
import { default_status, default_delete_status, strip_text } from '../config/config';

export const CategoryRules = {
	forFindingCategoryInternal: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await CATEGORY.findOne({ where: { unique_id: unique_id } });
				if (!data) return Promise.reject('Category not found!');
			})
	],
	forFindingCategory: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await CATEGORY.findOne({ where: { unique_id: unique_id, status: default_status } });
				if (!data) return Promise.reject('Category not found!');
			})
	],
	forFindingCategoryFalsy: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await CATEGORY.findOne({ where: { unique_id: unique_id, status: default_delete_status } });
				if (!data) return Promise.reject('Category not found!');
			})
	],
	forFindingCategoryAlt: [
		check('category_unique_id', "Category Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (category_unique_id: string, { req }) => {
				const data = await CATEGORY.findOne({ where: { unique_id: category_unique_id, status: default_status } });
				if (!data) return Promise.reject('Category not found!');
			})
	],
	forFindingCategoryAltOptional: [
		check('category_unique_id')
			.optional({ checkFalsy: false })
			.bail()
			.custom(async (category_unique_id: string, { req }) => {
				const data = await CATEGORY.findOne({ where: { unique_id: category_unique_id, status: default_status } });
				if (!data) return Promise.reject('Category not found!');
			})
	],
	forAdding: [
		check('name', "Name is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 3, max: 200 })
			.withMessage("Invalid length (3 - 200) characters")
			.bail()
			.custom(async (name: string, { req }) => {
				const data = await CATEGORY.findOne({ 
					where: { 
						[Op.or]: [
							{
								name: {
									[Op.like]: `%${name}`
								}
							},
							{
								stripped: strip_text(name),
							}
						],
						status: default_status
					} 
				});
				if (data) return Promise.reject('Category already exists!');
			})
	],
	forUpdatingDetails: [
		check('name', "Name is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 3, max: 200 })
			.withMessage("Invalid length (3 - 200) characters")
			.bail()
			.custom(async (name: string, { req }) => {
				const data = await CATEGORY.findOne({ 
					where: { 
						[Op.or]: [
							{
								name: {
									[Op.like]: `%${name}`
								}
							},
							{
								stripped: strip_text(name),
							}
						],
						unique_id: {
							[Op.ne]: req.query?.unique_id || req.body.unique_id || '',
						},
						status: default_status
					} 
				});
				if (data) return Promise.reject('Category already exists!');
			})
	],
	forFindingViaStripped: [
		check('stripped', "Stripped is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 3, max: 200 })
			.withMessage("Invalid length (3 - 200) characters")
			.bail()
			.custom(async (stripped: string, { req }) => {
				const data = await CATEGORY.findOne({ where: { stripped: stripped } });
				if (!data) return Promise.reject('Category not found!');
			}),
	]
}