import { Request, Response } from "express";
import { Op } from "sequelize";
import { check } from 'express-validator';
import moment from 'moment';
import BUSINESS_RULE from "../models/businessRules.model";
import { default_status, default_delete_status, strip_text, check_length_TEXT, validate_business_rule_value_type, business_rule_value_type } from '../config/config';

export const BusinessRuleRules = {
	forFindingBusinessRuleInternal: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await BUSINESS_RULE.findOne({ where: { unique_id: unique_id } });
				if (!data) return Promise.reject('Business Rule not found!');
			})
	],
	forFindingBusinessRule: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await BUSINESS_RULE.findOne({ where: { unique_id: unique_id, status: default_status } });
				if (!data) return Promise.reject('Business Rule not found!');
			})
	],
	forFindingBusinessRuleFalsy: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await BUSINESS_RULE.findOne({ where: { unique_id: unique_id, status: default_delete_status } });
				if (!data) return Promise.reject('Business Rule not found!');
			})
	],
	forFindingBusinessRuleAlt: [
		check('business_rule_unique_id', "Business Rule Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (business_rule_unique_id: string, { req }) => {
				const data = await BUSINESS_RULE.findOne({ where: { unique_id: business_rule_unique_id, status: default_status } });
				if (!data) return Promise.reject('Business Rule not found!');
			})
	],
	forFindingBusinessRuleAltOptional: [
		check('business_rule_unique_id')
			.optional({ checkFalsy: false })
			.bail()
			.custom(async (business_rule_unique_id: string, { req }) => {
				const data = await BUSINESS_RULE.findOne({ where: { unique_id: business_rule_unique_id, status: default_status } });
				if (!data) return Promise.reject('Business Rule not found!');
			})
	],
	forAdding: [
		check('rule_key', "Rule Key is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 1, max: 100 })
			.withMessage("Invalid length (1 - 100) characters"),
		check('rule_value', "Rule Value is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isFloat()
			.custom(rule_value => {
				if (rule_value < 0) return false;
				else return true;
			})
			.withMessage("Rule Value invalid"),
		check('value_type', "Value Type is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 1, max: 20 })
			.withMessage("Invalid length (1 - 20) characters")
			.bail()
			.custom(value_type => !!validate_business_rule_value_type(value_type))
			.withMessage(`Invalid value type, accepted types (${business_rule_value_type.number} or ${business_rule_value_type.percentage})`),
		check('applies_to', "Applies To is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 1, max: 100 })
			.withMessage("Invalid length (1 - 100) characters"),
		check('notes')
			.optional({ checkFalsy: false })
			.bail()
			.isLength({ min: 2, max: check_length_TEXT })
			.withMessage(`Invalid length (2 - ${check_length_TEXT}) characters`),
		check('is_active', "Is Active is required")
			.exists({ checkNull: true, checkFalsy: false })
			.bail()
			.isBoolean()
			.withMessage("Value should be true or false"),
	],
	forUpdatingDetails: [
		check('rule_key', "Rule Key is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 1, max: 100 })
			.withMessage("Invalid length (1 - 100) characters"),
		check('rule_value', "Rule Value is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isFloat()
			.custom(rule_value => {
				if (rule_value < 0) return false;
				else return true;
			})
			.withMessage("Rule Value invalid"),
		check('value_type', "Value Type is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 1, max: 20 })
			.withMessage("Invalid length (1 - 20) characters")
			.bail()
			.custom(value_type => !!validate_business_rule_value_type(value_type))
			.withMessage(`Invalid value type, accepted types (${business_rule_value_type.number} or ${business_rule_value_type.percentage})`),
		check('applies_to', "Applies To is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 1, max: 100 })
			.withMessage("Invalid length (1 - 100) characters"),
	], 
	forUpdatingRuleValue: [
		check('rule_value', "Rule Value is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isFloat()
			.custom(rule_value => {
				if (rule_value < 0) return false;
				else return true;
			})
			.withMessage("Rule Value invalid"),
		check('value_type', "Value Type is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 1, max: 20 })
			.withMessage("Invalid length (1 - 20) characters")
			.bail()
			.custom(value_type => !!validate_business_rule_value_type(value_type))
			.withMessage(`Invalid value type, accepted types (${business_rule_value_type.number} or ${business_rule_value_type.percentage})`),
	], 
	forUpdatingAppliesTo: [
		check('applies_to', "Applies To is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 1, max: 100 })
			.withMessage("Invalid length (1 - 100) characters"),
	], 
	forUpdatingNotes: [
		check('notes')
			.optional({ checkFalsy: false })
			.bail()
			.isLength({ min: 2, max: check_length_TEXT })
			.withMessage(`Invalid length (2 - ${check_length_TEXT}) characters`),
	],
	forUpdatingToggles: [
		check('is_active', "Is Active is required")
			.exists({ checkNull: true, checkFalsy: false })
			.bail()
			.isBoolean()
			.withMessage("Value should be true or false"),
	]
}