import { Request, Response } from "express";
import { Op } from "sequelize";
import { check } from 'express-validator';
import moment from 'moment';
import APPROVAL from "../models/approvals.model";
import { default_status, default_delete_status } from '../config/config';

export const ApprovalRules = {
	forFindingApprovalInternal: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await APPROVAL.findOne({ where: { unique_id: unique_id } });
				if (!data) return Promise.reject('Approval not found!');
			})
	],
	forFindingApproval: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await APPROVAL.findOne({ where: { unique_id: unique_id, status: default_status } });
				if (!data) return Promise.reject('Approval not found!');
			})
	],
	forFindingApprovalFalsy: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await APPROVAL.findOne({ where: { unique_id: unique_id, status: default_delete_status } });
				if (!data) return Promise.reject('Approval not found!');
			})
	],
	forFindingApprovalAlt: [
		check('approval_unique_id', "Approval Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (approval_unique_id: string, { req }) => {
				const data = await APPROVAL.findOne({ where: { unique_id: approval_unique_id, status: default_status } });
				if (!data) return Promise.reject('Approval not found!');
			})
	],
	forFindingApprovalAltOptional: [
		check('approval_unique_id')
			.optional({ checkFalsy: false })
			.bail()
			.custom(async (approval_unique_id: string, { req }) => {
				const data = await APPROVAL.findOne({ where: { unique_id: approval_unique_id, status: default_status } });
				if (!data) return Promise.reject('Approval not found!');
			})
	],
	forAddingAndUpdating: [
		check('view', "view is required")
			.exists({ checkNull: true, checkFalsy: false })
			.bail()
			.isBoolean()
			.withMessage("Value should be true or false"),
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