import { Request, Response } from "express";
import { Op } from "sequelize";
import { check } from 'express-validator';
import moment from 'moment';
import VEHICLE from "../models/vehicles.model";
import { default_status, default_delete_status, strip_text, check_length_TEXT, validate_fuel_type, fuel_type, validate_vehicle_type, vehicle_type, validate_vehicle_availability_status, vehicle_availability_status } from '../config/config';

export const VehicleRules = {
	forFindingVehicleInternal: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await VEHICLE.findOne({ where: { unique_id: unique_id } });
				if (!data) return Promise.reject('Vehicle not found!');
			})
	],
	forFindingVehicle: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await VEHICLE.findOne({ where: { unique_id: unique_id, status: default_status } });
				if (!data) return Promise.reject('Vehicle not found!');
			})
	],
	forFindingVehicleFalsy: [
		check('unique_id', "Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (unique_id: string, { req }) => {
				const data = await VEHICLE.findOne({ where: { unique_id: unique_id, status: default_delete_status } });
				if (!data) return Promise.reject('Vehicle not found!');
			})
	],
	forFindingVehicleAlt: [
		check('vehicle_unique_id', "Vehicle Unique Id is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.custom(async (vehicle_unique_id: string, { req }) => {
				const data = await VEHICLE.findOne({ where: { unique_id: vehicle_unique_id, status: default_status } });
				if (!data) return Promise.reject('Vehicle not found!');
			})
	],
	forFindingVehicleAltOptional: [
		check('vehicle_unique_id')
			.optional({ checkFalsy: false })
			.bail()
			.custom(async (vehicle_unique_id: string, { req }) => {
				const data = await VEHICLE.findOne({ where: { unique_id: vehicle_unique_id, status: default_status } });
				if (!data) return Promise.reject('Vehicle not found!');
			})
	],
	forAdding: [
		check('code', "Vehicle Code is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 1, max: 50 })
			.withMessage("Invalid length (1 - 50) characters"),
		check('plate_number', "Vehicle Code is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 1, max: 20 })
			.withMessage("Invalid length (1 - 20) characters"),
		check('type', "Type is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 1, max: 50 })
			.withMessage("Invalid length (1 - 50) characters")
			.bail()
			.custom(type => !!validate_vehicle_type(type))
			.withMessage(`Invalid type, accepted types (${vehicle_type.block_truck}, ${vehicle_type.tipper} or ${vehicle_type.water_tanker})`),
		check('capacity_unit', "Capacity Unit is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 1, max: 50 })
			.withMessage("Invalid length (1 - 50) characters"),
		check('capacity_value', "Capacity Value is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isFloat()
			.custom(capacity_value => {
				if (capacity_value < 0) return false;
				else return true;
			})
			.withMessage("Capacity Value invalid"),
		check('fuel_type', "Fuel Type is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 3, max: 20 })
			.withMessage("Invalid length (3 - 20) characters")
			.bail()
			.custom(fuel_type => !!validate_fuel_type(fuel_type))
			.withMessage(`Invalid fuel type, accepted types (${fuel_type.diesel} or ${fuel_type.petrol})`),
		check('benchmark_fuel_liters', "Benchmark Fuel Liters is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isFloat()
			.custom(benchmark_fuel_liters => {
				if (benchmark_fuel_liters < 0) return false;
				else return true;
			})
			.withMessage("Benchmark Fuel Liters invalid"),
		check('expected_trips_per_benchmark', "Expected Trips Per Benchmark is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isFloat()
			.custom(expected_trips_per_benchmark => {
				if (expected_trips_per_benchmark < 0) return false;
				else return true;
			})
			.withMessage("Expected Trips Per Benchmark invalid"),
		check('purchase_date')
			.optional({ checkFalsy: false })
			.bail()
			.custom(purchase_date => {
				const later = moment(purchase_date, "YYYY-MM-DD", true);
				return later.isValid();
			})
			.withMessage("Invalid purchase date format (YYYY-MM-DD)"),
		check('availability_status', "Availability Status is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 3, max: 20 })
			.withMessage("Invalid length (3 - 20) characters")
			.bail()
			.custom(availability_status => !!validate_vehicle_availability_status(availability_status))
			.withMessage(`Invalid availability status, accepted statuses (${vehicle_availability_status.available}, ${vehicle_availability_status.inactive}, ${vehicle_availability_status.maintenance} or ${vehicle_availability_status.on_delivery})`),
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
		check('code', "Vehicle Code is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 1, max: 50 })
			.withMessage("Invalid length (1 - 50) characters"),
		check('plate_number', "Vehicle Code is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 1, max: 20 })
			.withMessage("Invalid length (1 - 20) characters"),
		check('type', "Type is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 1, max: 50 })
			.withMessage("Invalid length (1 - 50) characters")
			.bail()
			.custom(type => !!validate_vehicle_type(type))
			.withMessage(`Invalid type, accepted types (${vehicle_type.block_truck}, ${vehicle_type.tipper} or ${vehicle_type.water_tanker})`),
		check('fuel_type', "Fuel Type is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 3, max: 20 })
			.withMessage("Invalid length (3 - 20) characters")
			.bail()
			.custom(fuel_type => !!validate_fuel_type(fuel_type))
			.withMessage(`Invalid fuel type, accepted types (${fuel_type.diesel} or ${fuel_type.petrol})`),
		check('purchase_date')
			.optional({ checkFalsy: false })
			.bail()
			.custom(purchase_date => {
				const later = moment(purchase_date, "YYYY-MM-DD", true);
				return later.isValid();
			})
			.withMessage("Invalid purchase date format (YYYY-MM-DD)"),
	],
	forUpdatingOtherDetails: [
		check('capacity_unit', "Capacity Unit is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 1, max: 50 })
			.withMessage("Invalid length (1 - 50) characters"),
		check('capacity_value', "Capacity Value is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isFloat()
			.custom(capacity_value => {
				if (capacity_value < 0) return false;
				else return true;
			})
			.withMessage("Capacity Value invalid"),
		check('benchmark_fuel_liters', "Benchmark Fuel Liters is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isFloat()
			.custom(benchmark_fuel_liters => {
				if (benchmark_fuel_liters < 0) return false;
				else return true;
			})
			.withMessage("Benchmark Fuel Liters invalid"),
		check('expected_trips_per_benchmark', "Expected Trips Per Benchmark is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isFloat()
			.custom(expected_trips_per_benchmark => {
				if (expected_trips_per_benchmark < 0) return false;
				else return true;
			})
			.withMessage("Expected Trips Per Benchmark invalid"),
	], 
	forUpdatingAvailabilityStatus: [
		check('availability_status', "Availability Status is required")
			.exists({ checkNull: true, checkFalsy: true })
			.bail()
			.isString().isLength({ min: 3, max: 20 })
			.withMessage("Invalid length (3 - 20) characters")
			.bail()
			.custom(availability_status => !!validate_vehicle_availability_status(availability_status))
			.withMessage(`Invalid availability status, accepted statuses (${vehicle_availability_status.available}, ${vehicle_availability_status.inactive}, ${vehicle_availability_status.maintenance} or ${vehicle_availability_status.on_delivery})`),
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