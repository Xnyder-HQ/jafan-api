import { Request, Response } from "express";
import { Op } from "sequelize";
import { check } from 'express-validator';
import moment from 'moment';
import ROLE from "../models/roles.model";
import { default_status, default_delete_status, strip_text } from '../config/config';

export const RoleRules = {
	forFindingRoleInternal: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await ROLE.findOne({ where: { unique_id: unique_id } });
				if (!data) return Promise.reject('Role not found!');
			})
	],
	forFindingRole: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await ROLE.findOne({ where: { unique_id: unique_id, status: default_status } });
				if (!data) return Promise.reject('Role not found!');
			})
	],
	forFindingRoleFalsy: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await ROLE.findOne({ where: { unique_id: unique_id, status: default_delete_status } });
				if (!data) return Promise.reject('Role not found!');
			})
	],
	forFindingRoleAlt: [
		check('role_unique_id', "Role Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (role_unique_id: string, { req }) => {
				const data = await ROLE.findOne({ where: { unique_id: role_unique_id, status: default_status } });
				if (!data) return Promise.reject('Role not found!');
			})
	],
	forFindingRoleAltOptional: [
		check('role_unique_id')
			.optional({ checkFalsy: false })
			.bail()
			.custom(async (role_unique_id: string, { req }) => {
				const data = await ROLE.findOne({ where: { unique_id: role_unique_id, status: default_status } });
				if (!data) return Promise.reject('Role not found!');
			})
	],
	forAdding: [
		check('name', "Name is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 2, max: 200 })
			.withMessage("Invalid length (2 - 200) characters")
			.bail()
			.custom(async (name: string, { req }) => {
				const data = await ROLE.findOne({ 
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
				if (data) return Promise.reject('Role already exists!');
			}),
		check('description')
			.optional({ checkFalsy: false })
			.bail()
			.isString().isLength({ min: 2, max: 3000 })
			.withMessage("Invalid length (2 - 3000) characters")
	],
	forUpdatingDetails: [
		check('name', "Name is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 2, max: 200 })
			.withMessage("Invalid length (2 - 200) characters")
			.bail()
			.custom(async (name: string, { req }) => {
				const data = await ROLE.findOne({ 
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
				if (data) return Promise.reject('Role already exists!');
			})
	],
	forUpdatingDescription: [
		check('description')
			.optional({ checkFalsy: false })
			.bail()
			.isString().isLength({ min: 2, max: 3000 })
			.withMessage("Invalid length (2 - 3000) characters")
	],
	forFindingViaStripped: [
		check('stripped', "Stripped is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 2, max: 200 })
			.withMessage("Invalid length (2 - 200) characters")
			.bail()
			.custom(async (stripped: string, { req }) => {
				const data = await ROLE.findOne({ where: { stripped: stripped } });
				if (!data) return Promise.reject('Role not found!');
			}),
	]
}