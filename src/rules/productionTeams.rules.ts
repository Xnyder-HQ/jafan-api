import { Request, Response } from "express";
import { Op } from "sequelize";
import { check } from 'express-validator';
import moment from 'moment';
import PRODUCTION_TEAM from "../models/productionTeams.model";
import { default_status, default_delete_status, strip_text, check_length_TEXT } from '../config/config';

export const ProductionTeamRules = {
	forFindingProductionTeamInternal: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await PRODUCTION_TEAM.findOne({ where: { unique_id: unique_id } });
				if (!data) return Promise.reject('Production Team not found!');
			})
	],
	forFindingProductionTeam: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await PRODUCTION_TEAM.findOne({ where: { unique_id: unique_id, status: default_status } });
				if (!data) return Promise.reject('Production Team not found!');
			})
	],
	forFindingProductionTeamFalsy: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await PRODUCTION_TEAM.findOne({ where: { unique_id: unique_id, status: default_delete_status } });
				if (!data) return Promise.reject('Production Team not found!');
			})
	],
	forFindingProductionTeamAlt: [
		check('production_team_unique_id', "Production Team Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (production_team_unique_id: string, { req }) => {
				const data = await PRODUCTION_TEAM.findOne({ where: { unique_id: production_team_unique_id, status: default_status } });
				if (!data) return Promise.reject('Production Team not found!');
			})
	],
	forAddingAndUpdating: [
		check('name', "Name is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 1, max: 300 })
			.withMessage("Invalid length (1 - 300) characters"),
		check('is_active', "Is Active is required")
			.exists({ checkNull: true, checkFalsy: false })
			.bail()
			.isBoolean()
			.withMessage("Value should be true or false"),
	],
}