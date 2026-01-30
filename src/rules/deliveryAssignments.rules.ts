import { Request, Response } from "express";
import { Op } from "sequelize";
import { check } from 'express-validator';
import moment from 'moment';
import DELIVERY_ASSIGNMENT from "../models/deliveryAssignments.model";
import { default_status, default_delete_status, strip_text, validate_delivery_assignment_status, delivery_assignment_status, check_length_TEXT } from '../config/config';

export const DeliveryAssignmentRules = {
	forFindingDeliveryAssignmentInternal: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await DELIVERY_ASSIGNMENT.findOne({ where: { unique_id: unique_id } });
				if (!data) return Promise.reject('Delivery Assignment not found!');
			})
	],
	forFindingDeliveryAssignment: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await DELIVERY_ASSIGNMENT.findOne({ where: { unique_id: unique_id, status: default_status } });
				if (!data) return Promise.reject('Delivery Assignment not found!');
			})
	],
	forFindingDeliveryAssignmentFalsy: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await DELIVERY_ASSIGNMENT.findOne({ where: { unique_id: unique_id, status: default_delete_status } });
				if (!data) return Promise.reject('Delivery Assignment not found!');
			})
	],
	forFindingDeliveryAssignmentAlt: [
		check('delivery_assignment_unique_id', "Delivery Assignment Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (delivery_assignment_unique_id: string, { req }) => {
				const data = await DELIVERY_ASSIGNMENT.findOne({ where: { unique_id: delivery_assignment_unique_id, status: default_status } });
				if (!data) return Promise.reject('Delivery Assignment not found!');
			})
	],
	forAdding: [
		check('scheduled_date', "Scheduled Date is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(scheduled_date => {
				const later = moment(scheduled_date, "YYYY-MM-DD", true);
				return later.isValid();
			})
			.withMessage("Invalid scheduled date format (YYYY-MM-DD)"),
	], 
	forUpdatingScheduledDate: [
		check('scheduled_date', "Scheduled Date is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(scheduled_date => {
				const later = moment(scheduled_date, "YYYY-MM-DD", true);
				return later.isValid();
			})
			.withMessage("Invalid scheduled date format (YYYY-MM-DD)"),
	], 
	forUpdatingAssignmentStatus: [
		check('assignment_status', "Assignment Status is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 3, max: 20 })
			.withMessage("Invalid length (3 - 20) characters")
			.bail()
			.custom(assignment_status => !!validate_delivery_assignment_status(assignment_status))
			.withMessage(`Invalid assignment status, accepted statuses (${delivery_assignment_status.cancelled}, ${delivery_assignment_status.in_transit} & ${delivery_assignment_status.completed})`),
	], 
	forUpdatingNotes: [
		check('notes')
			.optional({ checkFalsy: false })
			.bail()
			.isLength({ min: 2, max: check_length_TEXT })
			.withMessage(`Invalid length (2 - ${check_length_TEXT}) characters`),
	],
}