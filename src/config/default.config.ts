import { v4 as uuidv4 } from 'uuid';
import { logger } from '../common/index';
import bycrypt from "bcryptjs";
import API_KEY, { IApiKey } from "../models/apiKeys.model";
import APP_DEFAULT, { IAppDefault } from "../models/appDefaults.model";
import MODULE, { IModule } from "../models/modules.model";
import SUB_MODULE, { ISubModule } from "../models/subModules.model";
import USER, { IUser } from "../models/users.model";
import ROLE, { IRole } from "../models/roles.model";
import ROLE_ACL, { IRoleAcl } from "../models/roleAcls.model";
import ACL, { IACL } from "../models/acls.model";
import BUSINESS_RULE, { IBusinessRule } from "../models/businessRules.model";
import { default_status, default_app_values, random_uuid, default_modules, return_modules, return_sub_modules, access_granted, createRoleAndAcls, default_business_rules } from './config';

const { hashSync } = bycrypt;

export async function createAppDefaults() {

	const count = await APP_DEFAULT.count();

	if (count <= 0) {
		try {
			await APP_DEFAULT.sequelize?.transaction((t) => {
				const appDefaults = APP_DEFAULT.bulkCreate(default_app_values, { transaction: t });
				return appDefaults;
			})
			logger.info('Added app defaults');
		} catch (error) {
			logger.error(error)
			logger.error('Error adding app defaults');
		}
	}
};

export async function createApiKeys() {

	const details = [
		{
			unique_id: uuidv4(),
			type: "Root",
			alias: "Main",
			api_key: random_uuid(20),
			status: default_status
		},
		{
			unique_id: uuidv4(),
			type: "Internal",
			alias: "Main",
			api_key: random_uuid(20),
			status: default_status
		}
	];

	const count = await API_KEY.count();

	if (count <= 0) {
		try {
			await API_KEY.sequelize?.transaction((t) => {
				const apikey = API_KEY.bulkCreate(details, { transaction: t });
				return apikey;
			})
			logger.info('Added api keys defaults');
		} catch (error) {
			logger.error('Error adding api keys defaults');
		}
	}
};

export async function createModulesAndSubModules() {

	const count = await MODULE.count();

	if (count <= 0) {
		try {
			const the_default_modules = default_modules;

			const save_default_modules = return_modules(the_default_modules);
			const save_default_sub_modules = return_sub_modules(the_default_modules);

			if (save_default_modules && save_default_sub_modules) {
				await MODULE.sequelize?.transaction((t) => {
					const modules = MODULE.bulkCreate(save_default_modules, { transaction: t });
					const sub_modules = SUB_MODULE.bulkCreate(save_default_sub_modules, { transaction: t });
					return modules;
				})
				logger.info('Added modules and sub modules');
			} else {
				logger.error('Error getting modules and sub modules');
			}
		} catch (error) {
			logger.error(error)
			logger.error('Error adding modules and sub modules');
		}
	}
};

export async function createDefaultUser() {

	const user_unique_id = "353249fa-aa3b-4190-bb04-40e31ee5e490";
	const role_unique_id = uuidv4();

	const count = await USER.count();

	const { acls, role, roleAcls } = createRoleAndAcls(user_unique_id, role_unique_id);

	if (count <= 0) {
		try {
			const adminRoleExists = await ROLE.findOne({ where: { name: role.name, stripped: role.stripped } });

			if (adminRoleExists) {
				await USER.sequelize?.transaction(async (t) => {
					const removeCurrentAcls = await ACL.destroy( { where: { role_unique_id: adminRoleExists.unique_id, status: default_status }, transaction: t } );
					const removeCurrentRoleAcls = await ROLE_ACL.destroy( { where: { role_unique_id: adminRoleExists.unique_id, status: default_status }, transaction: t } );
					const removeCurrentRole = await ROLE.destroy( { where: { unique_id: adminRoleExists.unique_id, status: default_status }, transaction: t } );
					
					const roleRes = await ROLE.create(role, { transaction: t });
					const user = await USER.create({
						unique_id: user_unique_id,
						role_unique_id: role_unique_id,
						method: "Default",
						firstname: "Administrator",
						middlename: null,
						lastname: "Jafan",
						username: "admin",
						email: "admin@jafan.com",
						phone_number: null,
						alt_phone_number: null,
						gender: null,
						date_of_birth: null,
						privates: hashSync("Abcd-1234", 8),
						access: access_granted,
						status: default_status
					}, { transaction: t });
	
					const roleAclsRes = await ROLE_ACL.bulkCreate(roleAcls, { transaction: t });
					const aclsRes = await ACL.bulkCreate(acls, { transaction: t });
					return user;
				})
				logger.info('Added user default, roles, roleAcls and acls (removed already existing ones)');
			} else {
				await USER.sequelize?.transaction(async (t) => {
					const roleRes = await ROLE.create(role, { transaction: t });
					const user = await USER.create({
						unique_id: user_unique_id,
						role_unique_id: role_unique_id,
						method: "Default",
						firstname: "Administrator",
						middlename: null,
						lastname: "Jafan",
						username: "admin",
						email: "admin@jafan.com",
						phone_number: null,
						alt_phone_number: null,
						gender: null,
						date_of_birth: null,
						privates: hashSync("Abcd-1234", 8),
						access: access_granted,
						status: default_status
					}, { transaction: t });
	
					const roleAclsRes = await ROLE_ACL.bulkCreate(roleAcls, { transaction: t });
					const aclsRes = await ACL.bulkCreate(acls, { transaction: t });
					return user;
				})
				logger.info('Added user default, roles, roleAcls and acls');
			}
		} catch (error) {
			console.log(error);
			logger.error('Error adding user default, roles, roleAcls and acls');
		}
	}
};

export async function createBusinessRules() {

	const count = await BUSINESS_RULE.count();

	if (count <= 0) {
		try {
			await BUSINESS_RULE.sequelize?.transaction((t) => {
				const businessRules = BUSINESS_RULE.bulkCreate(default_business_rules, { transaction: t });
				return businessRules;
			})
			logger.info('Added business rules');
		} catch (error) {
			logger.error(error)
			logger.error('Error adding business rules');
		}
	}
};