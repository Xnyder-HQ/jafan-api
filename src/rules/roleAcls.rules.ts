import { Request, Response } from "express";
import { Op } from "sequelize";
import { check } from 'express-validator';
import moment from 'moment';
import ROLE_ACL from "../models/roleAcls.model";
import { default_status, default_delete_status } from '../config/config';

export const RoleAclRules = {
	forFindingRoleAclInternal: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await ROLE_ACL.findOne({ where: { unique_id: unique_id } });
				if (!data) return Promise.reject('Role Acl not found!');
			})
	],
	forFindingRoleAcl: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await ROLE_ACL.findOne({ where: { unique_id: unique_id, status: default_status } });
				if (!data) return Promise.reject('Role Acl not found!');
			})
	],
	forFindingRoleAclFalsy: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await ROLE_ACL.findOne({ where: { unique_id: unique_id, status: default_delete_status } });
				if (!data) return Promise.reject('Role Acl not found!');
			})
	],
	forFindingRoleAclAlt: [
		check('role_acl_unique_id', "Role Acl Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (role_acl_unique_id: string, { req }) => {
				const data = await ROLE_ACL.findOne({ where: { unique_id: role_acl_unique_id, status: default_status } });
				if (!data) return Promise.reject('Role Acl not found!');
			})
	],
	forFindingRoleAclAltOptional: [
		check('role_acl_unique_id')
			.optional({ checkFalsy: false })
			.bail()
			.custom(async (role_acl_unique_id: string, { req }) => {
				const data = await ROLE_ACL.findOne({ where: { unique_id: role_acl_unique_id, status: default_status } });
				if (!data) return Promise.reject('Role Acl not found!');
			})
	],
	forAddingAndUpdating: [
		check('add', "Add is required")
			.exists({ checkNull: true, checkFalsy: false })
			.bail()
			.isBoolean()
			.withMessage("Value should be true or false"),
		check('edit', "Edit is required")
			.exists({ checkNull: true, checkFalsy: false })
			.bail()
			.isBoolean()
			.withMessage("Value should be true or false"),
		check('delete', "Delete is required")
			.exists({ checkNull: true, checkFalsy: false })
			.bail()
			.isBoolean()
			.withMessage("Value should be true or false"),
		check('elevated_role', "Elevated Role is required")
			.exists({ checkNull: true, checkFalsy: false })
			.bail()
			.isBoolean()
			.withMessage("Value should be true or false"),
	], 
	forMultipleAdding: [
		check('role_acls', "Role Acls are required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isArray({ min: 1 })
			.withMessage("Must be an array of objects that include - module_unique_id, sub_module_unique_id, add, edit, delete and elevated_role variables (not empty)"),
	]
}