import { Request, Response } from "express";
import { Op } from "sequelize";
import { check } from 'express-validator';
import moment from 'moment';
import ACL from "../models/acls.model";
import { default_status, default_delete_status } from '../config/config';

export const AclRules = {
	forFindingAclInternal: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await ACL.findOne({ where: { unique_id: unique_id } });
				if (!data) return Promise.reject('Acl not found!');
			})
	],
	forFindingAcl: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await ACL.findOne({ where: { unique_id: unique_id, status: default_status } });
				if (!data) return Promise.reject('Acl not found!');
			})
	],
	forFindingAclFalsy: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await ACL.findOne({ where: { unique_id: unique_id, status: default_delete_status } });
				if (!data) return Promise.reject('Acl not found!');
			})
	],
	forFindingAclAlt: [
		check('acl_unique_id', "Acl Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (acl_unique_id: string, { req }) => {
				const data = await ACL.findOne({ where: { unique_id: acl_unique_id, status: default_status } });
				if (!data) return Promise.reject('Acl not found!');
			})
	],
	forFindingAclAltOptional: [
		check('acl_unique_id')
			.optional({ checkFalsy: false })
			.bail()
			.custom(async (acl_unique_id: string, { req }) => {
				const data = await ACL.findOne({ where: { unique_id: acl_unique_id, status: default_status } });
				if (!data) return Promise.reject('Acl not found!');
			})
	],
	forAddingAndUpdating: [
		// check('view', "view is required")
		// 	.exists({ checkNull: true, checkFalsy: false })
		// 	.bail()
		// 	.isBoolean()
		// 	.withMessage("Value should be true or false"),
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
		check('elevated_role', "Elevated  is required")
			.exists({ checkNull: true, checkFalsy: false })
			.bail()
			.isBoolean()
			.withMessage("Value should be true or false"),
	], 
	forMultipleAdding: [
		check('acls', "Acls are required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isArray({ min: 1 })
			.withMessage("Must be an array of objects that include - module_unique_id, sub_module_unique_id, add, edit, delete, elevated_role and acl_expiring variables (not empty)"),
	], 
	forAclExpiring: [
		check('acl_expiring', "ACL Expiring Date is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(acl_expiring => {
				const later = moment(acl_expiring, "YYYY-MM-DD HH:mm", true);
				return later.isValid();
			})
			.withMessage("Invalid acl expiring datetime format (YYYY-MM-DD HH:mm)"),
	], 
	forAclExpiringOptional: [
		check('acl_expiring')
			.optional({ checkFalsy: false })
			.bail()
			.custom(acl_expiring => {
				const later = moment(acl_expiring, "YYYY-MM-DD HH:mm", true);
				return later.isValid();
			})
			.withMessage("Invalid acl expiring datetime format (YYYY-MM-DD HH:mm)"),
	]
}