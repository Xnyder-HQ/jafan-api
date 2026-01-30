import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export const primary_domain: string = "https://jafan.com";
export const admin_domain: string = "https://admin.jafan.com";
export const test_primary_domain: string = "https://jafan.netlify.app";
export const test_admin_domain: string = "https://admin.jafan.com";
export const mailer_url: string = "https://mailerapi.xnyder.com";
export const clouder_url: string = "https://clouderapi.xnyder.com";
export const default_path: string = "jafan";

export const anonymous: string = "Anonymous";
export const tag_root: string = "Root";
export const tag_internal_api_key: string = "Internal";
export const db_start: string = "jafan_";
export const db_end: string = "_tbl";

export const jafan_header_key: string = "jafan-access-key";
export const jafan_header_token: string = "jafan-access-token";

// Password options
export const password_options = {
	minLength: 8,
	maxLength: 30,
	minLowercase: 1,
	minNumbers: 1,
	minSymbols: 1,
	minUppercase: 1
};

// App Defaults 
export const app_defaults = {
	api_whitelist: "Api_Whitelist",
	paystack_public_key: "Paystack_Public_Key",
	paystack_secret_key: "Paystack_Secret_Key",
	squad_public_key: "Squad_Public_Key",
	squad_secret_key: "Squad_Secret_Key",
	stripe_public_key: "Stripe_Public_Key",
	stripe_secret_key: "Stripe_Secret_Key",
	dodo_public_key: "Dodo_Public_Key",
	dodo_secret_key: "Dodo_Secret_Key",
	paddle_public_key: "Paddle_Public_Key",
	paddle_secret_key: "Paddle_Secret_Key",
	flutterwave_public_key: "Flutterwave_Public_Key",
	flutterwave_secret_key: "Flutterwave_Secret_Key",
	users_emails: "Users_Emails",
	users_phone_numbers: "Users_Phone_Numbers",
	maintenance: "Maintenance"
};

export const default_app_values: Array<{ unique_id: string, criteria: string, data_type: string, value: any, status: number }> = [
	{
		unique_id: uuidv4(),
		criteria: "Maintenance",
		data_type: "BOOLEAN",
		value: false,
		status: 1
	},
	{
		unique_id: uuidv4(),
		criteria: "Paystack_Secret_Key",
		data_type: "STRING",
		value: null,
		status: 1
	},
	{
		unique_id: uuidv4(),
		criteria: "Paystack_Public_Key",
		data_type: "STRING",
		value: null,
		status: 1
	},
	{
		unique_id: uuidv4(),
		criteria: "Squad_Secret_Key",
		data_type: "STRING",
		value: null,
		status: 1
	},
	{
		unique_id: uuidv4(),
		criteria: "Squad_Public_Key",
		data_type: "STRING",
		value: null,
		status: 1
	},
	{
		unique_id: uuidv4(),
		criteria: "Stripe_Public_Key",
		data_type: "STRING",
		value: null,
		status: 1
	},
	{
		unique_id: uuidv4(),
		criteria: "Stripe_Secret_Key",
		data_type: "STRING",
		value: null,
		status: 1
	},
	{
		unique_id: uuidv4(),
		criteria: "Dodo_Public_Key",
		data_type: "STRING",
		value: null,
		status: 1
	},
	{
		unique_id: uuidv4(),
		criteria: "Dodo_Secret_Key",
		data_type: "STRING",
		value: null,
		status: 1
	},
	{
		unique_id: uuidv4(),
		criteria: "Paddle_Public_Key",
		data_type: "STRING",
		value: null,
		status: 1
	},
	{
		unique_id: uuidv4(),
		criteria: "Paddle_Secret_Key",
		data_type: "STRING",
		value: null,
		status: 1
	},
	{
		unique_id: uuidv4(),
		criteria: "Flutterwave_Public_Key",
		data_type: "STRING",
		value: null,
		status: 1
	},
	{
		unique_id: uuidv4(),
		criteria: "Flutterwave_Secret_Key",
		data_type: "STRING",
		value: null,
		status: 1
	},
	{
		unique_id: uuidv4(),
		criteria: "Users_Emails",
		data_type: "ARRAY",
		value: null,
		status: 1
	},
	{
		unique_id: uuidv4(),
		criteria: "Users_Phone_Numbers",
		data_type: "ARRAY",
		value: null,
		status: 1
	},
	{
		unique_id: uuidv4(),
		criteria: "Api_Whitelist",
		data_type: "ARRAY",
		value: null,
		status: 1
	}
];
// End - App Defaults

// Default Actions
export const completed: string = "Completed";
export const processing: string = "Processing";
export const cancelled: string = "Cancelled";
export const refunded: string = "Refunded";
export const active: string = "Active";
export const approved: string = "Approved";
export const denied: string = "Denied";
export const pending: string = "Pending";
export const ongoing = "Ongoing";
export const payment_methods = {
	card: "Credit/Debit Card",
	wallet: "Wallet",
	transfer: "Transfer",
};
export const webhook_channels = {
	paystack: "PAYSTACK",
	dodo: "DODO",
	flutterwave: "FLUTTERWAVE",
	stripe: "STRIPE",
	paddle: "PADDLE",
	squad: "SQUAD",
};
export const gateways = {
	paystack: "PAYSTACK",
	flutterwave: "FLUTTERWAVE",
	squad: "SQUAD",
	stripe: "STRIPE",
	dodo: "DODO",
	internal: "INTERNAL"
};
export const invoice_status = {
	unpaid: "Unpaid",
	partially_paid: "Partially Paid",
	paid: "Paid",
	cancelled: "Cancelled"
};
export const invoice_type = {
	immediate: "Immediate",
	credit: "Credit"
};
export const invoice_payment_method = {
	cash: "Cash",
	transfer: "Transfer",
	pos: "POS",
	cheque: "Cheque",
	account_balance: "Account Balance"
};
export const po_type = {
	cement: "Cement",
	general: "General",
	maintenance: "Maintenance"
};
export const po_payment_status = {
	unpaid: "Unpaid",
	partially_paid: "Partially Paid",
	paid: "Paid"
};
export const po_delivery_status = {
	pending: "Pending",
	partially_delivered: "Partially Delivered",
	delivered: "Delivered"
};
export const vendor_payment_method = {
	cash: "Cash",
	transfer: "Transfer",
	pos: "POS",
	cheque: "Cheque"
};
export const fuel_type = {
	diesel: "Diesel",
	electric: "Electric",
	petrol: "Petrol"
};
export const fuel_delivery_status = {
	pending: "Pending",
	partially_delivered: "Partially Delivered",
	delivered: "Delivered"
};
export const stock_log_movement_type = {
	in: "IN",
	out: "OUT",
	adjustment: "ADJUSTMENT",
	breakage: "BREAKAGE"
};
export const vehicle_type = {
	tipper: "Tipper",
	block_truck: "Block Truck",
	water_tanker: "Water Tanker"
};
export const vehicle_availability_status = {
	available: "Available",
	on_delivery: "On Delivery",
	inactive: "Inactive",
	maintenance: "Maintenance"
};
export const business_rule_value_type = {
	number: "Number",
	percentage: "Percentage",
};
export const delivery_assignment_status = {
	pending: "Pending",
	in_transit: "In Transit",
	cancelled: "Cancelled",
	completed: "Completed"
};
export const ratings: Array<{rate: string, value: number}> = [
	{
		rate: "Very Bad",
		value: 1
	},
	{
		rate: "Bad",
		value: 2
	},
	{
		rate: "Ok",
		value: 3
	},
	{
		rate: "Good",
		value: 4
	},
	{
		rate: "Very Good",
		value: 5
	}
];
// End - Default Actions

// Default Transaction Types
export const withdrawal: string = "Withdrawal";
export const deposit: string = "Deposit";
export const refund: string = "Refund";
export const payment: string = "Payment";
export const reversal: string = "Reversal";
export const transfer: string = "Transfer";
export const subscription: string = "Subscription";
export const subscribed: string = "Subscribed";
export const fees = "Fees";
export const charges: string = "Charges";
export const shipped: string = "Shipped";
export const received: string = "Received";
export const shipping: string = "Shipping";
export const disputed: string = "Disputed";
export const refund_denied: string = "Refund Denied";
export const checked_out: string = "Checked Out";
export const paid: string = "Paid";
export const unpaid: string = "Unpaid";
export const transaction_types = { fees, unpaid, paid, withdrawal, deposit, refund, payment, reversal, transfer, subscription, subscribed, charges };
// End - Default Transaction Types

// Default Currency
export const currency: string = "USD"; // USD - US Dollars
export const currency_alt: string = "NGN"; // NGN - Naira
// End - Default Currency

// Default Language
export const language: string = "en";
// End - Default Language

export const app_defaults_data_type: Array<string> = ['STRING', 'INTEGER', 'BIGINT', 'BOOLEAN'];

export const false_status: boolean = false;
export const true_status: boolean = true;

export const zero: number = 0;

export const default_status: number = 1;
export const default_delete_status: number = 0;
export const default_pending_status: number = 2;

export const check_length_TINYTEXT: number = 255;
export const check_length_TEXT: number = 65535;
export const check_length_MEDIUMTEXT: number = 16777215;
export const check_length_LONGTEXT: number = 4294967295;

// Accesses
export const access_granted = 1;
export const access_suspended = 2;
export const access_revoked = 3;
export const all_access = [access_granted, access_suspended, access_revoked];
// End - Accesses

export const paginate_limit: number = 20;

export interface IPagination {
	page?: number;
	size?: number;
	orderBy?: string;
	sortBy?: string;
	search?: string;
	module_unique_id?: string;
	sub_module_unique_id?: string;
	[key: string]: any; // Allows dynamic filtering with any key-value pair
};

export const pagination_defaults = ['sortBy', 'page', 'orderBy', 'search', 'size', 'module_unique_id', 'sub_module_unique_id', 'start_date', 'end_date'];

export function dynamicWhere(queryParams: IPagination, exemptKeys: string[] = []) {
	const effectiveDefaults = pagination_defaults.filter(key => !exemptKeys.includes(key));
	return Object.keys(queryParams)
		.filter(key => !effectiveDefaults.includes(key))
		.reduce((acc: { [key: string]: any }, key) => {
			acc[key] = queryParams[key];
			return acc;
		}, {});
};

export interface ISearch {
	[key: string]: any;
};

// File lengths
export const file_length_5Mb: number = 5000000;
export const file_length_10Mb: number = 10000000;
export const file_length_15Mb: number = 15000000;
export const file_length_20Mb: number = 20000000;
export const file_length_25Mb: number = 25000000;
export const file_length_30Mb: number = 30000000;

export const today_str = () => {
	const d = new Date();
	const date_str = d.getFullYear() + "-" + ((d.getUTCMonth() + 1) < 10 ? "0" + (d.getUTCMonth() + 1) : (d.getUTCMonth() + 1)) + "-" + (d.getDate() < 10 ? "0" + d.getDate() : d.getDate());
	return date_str;
};

export const today_str_alt = (date: Date) => {
	const d = new Date(date);
	const date_str = d.getFullYear() + "-" + ((d.getUTCMonth() + 1) < 10 ? "0" + (d.getUTCMonth() + 1) : (d.getUTCMonth() + 1)) + "-" + (d.getDate() < 10 ? "0" + d.getDate() : d.getDate());
	return date_str;
};

export const todays_date = () => {
	const d = new Date();
	return d.toDateString();
};

export const year_str = () => {
	const d = new Date();
	const date_str = d.getFullYear();
	return date_str;
};

export const timestamp_str = (date: any) => {
	const d = new Date(date * 1000);
	return {
		fulldate: d.toDateString() + " at " + d.toLocaleTimeString(),
		date: d.toDateString(),
		time: d.toLocaleTimeString(),
	};
};

export const timestamp_str_alt = (date: any) => {
	const d = new Date(date);
	const date_ = d.getFullYear() + "-" + ((d.getUTCMonth() + 1) < 10 ? "0" + (d.getUTCMonth() + 1) : (d.getUTCMonth() + 1)) + "-" + (d.getDate() < 10 ? "0" + d.getDate() : d.getDate());
	const time_ = (d.getHours() < 10 ? "0" + d.getHours() : d.getHours()) + ":" + (d.getMinutes() < 10 ? "0" + d.getMinutes() : d.getMinutes()) + ":" + (d.getSeconds() < 10 ? "0" + d.getSeconds() : d.getSeconds());
	return date_ + " " + time_;
};

export const time_zero_hundred = () => {
	const d = new Date();
	const time_str = (d.getHours() < 10 ? "0" + d.getHours() : d.getHours()) + "00";
	return time_str;
};

export const random_uuid = (length: number) => {
	if (length === undefined || length === null || length === 0) {
		let values = crypto.randomBytes(20).toString('hex');
		return values;
	} else {
		let values = crypto.randomBytes(length).toString('hex');
		return values;
	}
};

export const random_numbers = (length: number) => {
	if (length === undefined || length === null || length === 0) {
		return 0;
	} else {
		let rand_number = "";
		for (let index = 0; index < length; index++) {
			rand_number += Math.floor(Math.random() * 10);
		}
		return rand_number;
	}
};

export const test_all_regex = (data: any, regex: RegExp) => {
	if (!data) {
		return false;
	}

	const valid = regex.test(data);
	if (!valid) {
		return false;
	}

	return true;
};

export const digit_filter = (digits: number) => {
	return digits.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const strip_text = (text: string) => {
	//Lower case everything
	let string = text.toLowerCase();
	//Make alphanumeric (removes all other characters)
	string = string.replace(/[^a-z0-9_\s-]/g, "");
	//Clean up multiple dashes or whitespaces
	string = string.replace(/[\s-]+/g, " ");
	//Convert whitespaces and underscore to dash
	string = string.replace(/[\s_]/g, "-");
	return string;
};

export const strip_response = (text: string) => {
	// Lower case everything
	let string = text;
	// Make alphanumeric (removes all other characters)
	string = string.replace(/[`']/g, "");
	// Clean up multiple dashes or whitespaces
	string = string.replace(/\n+/g, "");
	// Convert whitespaces and underscore to dash
	string = string.replace(/json/g, "");
	return string;
};

export const parseAIResponse = (response: string) => {
	try {
		const parsed = JSON.parse(strip_response(response));
		return parsed;
	} catch (error) {
		return null;
	}
};

export const format_phone_number = (phoneNumber: string | undefined | null): string => {
	if (!phoneNumber) return '';
	return phoneNumber.replace(/\s+/g, '').replace(/^\+/, '');
};

export const unstrip_text = (text: string) => {
	let string = text.replace(/[-_]/g, " ");
	return string;
};

export const unstrip_text_alt = (text: string) => {
	let string = text.replace(/[-_]/g, "");
	return string;
};

export const filterBytes = (bytes: any) => {
	if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '0 bytes';
	var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
		number = Math.floor(Math.log(bytes) / Math.log(1024));
	return (bytes / Math.pow(1024, Math.floor(number))).toFixed(1) + " " + units[number];
};

export const getFileExtension = (filename: string) => {
	let lastDot = filename.lastIndexOf('.');
	let ext = filename.substring(lastDot + 1);
	return ext;
};

export const strip_text_underscore = (text: string) => {
	let string = text.replace(/[\s]/g, "_");
	return string;
};

export const return_first_letter_uppercase = (str: any) => {
	return str.toLowerCase().replace(/(^\w{1})|(\s+\w{1})/g, (letter: string) => letter.toUpperCase());
};

export const return_first_letter_uppercase_alt = (_str: any) => {
	const str = unstrip_text(_str);
	return str.toLowerCase().replace(/(^\w{1})|(\s+\w{1})/g, (letter: string) => letter.toUpperCase());
};

export const return_all_letters_uppercase = (str: any) => {
	return str ? str.toUpperCase() : str;
};

export const return_all_letters_lowercase = (str: any) => {
	return str && str.length > 0 ? str.toLowerCase() : str;
};

export const return_trimmed_data = (str: any) => {
	return str.trim();
};

export const return_sort_by = (str: any) => {
	if (!str) return "desc";
	else if (str.toLowerCase() !== "asc" && str.toLowerCase() !== "desc") return "desc";
	else return str.toLowerCase();
};

export const return_order_by_for_others = (str: any) => {
	if (!str) return "createdAt";
	else if (str !== "updatedAt") return "createdAt";
	else return (str === "updatedAt") ? str : str.toLowerCase();
};

export const generate_reference = () => {
	const d = new Date();
	const first_up = "TX";
	const date_stamp = d.getFullYear() + "" + ((d.getUTCMonth() + 1) < 10 ? "0" + (d.getUTCMonth() + 1) : (d.getUTCMonth() + 1)) + "" + (d.getDate() < 10 ? "0" + d.getDate() : d.getDate());
	const full_code = first_up + date_stamp + "V" + random_numbers(5);
	return full_code;
};

export const generate_product_reference = () => {
	const d = new Date();
	const first_up = "PR";
	const date_stamp = d.getFullYear() + "" + ((d.getUTCMonth() + 1) < 10 ? "0" + (d.getUTCMonth() + 1) : (d.getUTCMonth() + 1)) + "" + (d.getDate() < 10 ? "0" + d.getDate() : d.getDate());
	const full_code = first_up + date_stamp + "-" + random_numbers(5);
	return full_code;
};

export const generate_customer_reference = () => {
	const d = new Date();
	const first_up = "CU";
	const full_code = first_up + "-" + random_numbers(6);
	return full_code;
};

export const generate_vendor_reference = () => {
	const d = new Date();
	const first_up = "VD";
	const full_code = first_up + "-" + random_numbers(6);
	return full_code;
};

export const generate_raw_material_reference = () => {
	const d = new Date();
	const first_up = "RM";
	const date_stamp = d.getFullYear() + "" + ((d.getUTCMonth() + 1) < 10 ? "0" + (d.getUTCMonth() + 1) : (d.getUTCMonth() + 1)) + "" + (d.getDate() < 10 ? "0" + d.getDate() : d.getDate());
	const full_code = first_up + date_stamp + "-" + random_numbers(5);
	return full_code;
};

export const generate_finished_good_reference = () => {
	const d = new Date();
	const first_up = "FG";
	const date_stamp = d.getFullYear() + "" + ((d.getUTCMonth() + 1) < 10 ? "0" + (d.getUTCMonth() + 1) : (d.getUTCMonth() + 1)) + "" + (d.getDate() < 10 ? "0" + d.getDate() : d.getDate());
	const full_code = first_up + date_stamp + "-" + random_numbers(5);
	return full_code;
};

export const generate_machine_reference = () => {
	const d = new Date();
	const first_up = "MC";
	const date_stamp = d.getFullYear() + "" + ((d.getUTCMonth() + 1) < 10 ? "0" + (d.getUTCMonth() + 1) : (d.getUTCMonth() + 1)) + "" + (d.getDate() < 10 ? "0" + d.getDate() : d.getDate());
	const full_code = first_up + date_stamp + "-" + random_numbers(5);
	return full_code;
};

export const generate_vehicle_reference = () => {
	const d = new Date();
	const first_up = "VH";
	const date_stamp = d.getFullYear() + "" + ((d.getUTCMonth() + 1) < 10 ? "0" + (d.getUTCMonth() + 1) : (d.getUTCMonth() + 1)) + "" + (d.getDate() < 10 ? "0" + d.getDate() : d.getDate());
	const full_code = first_up + date_stamp + "-" + random_numbers(5);
	return full_code;
};

export const validate_future_date = (date: any) => {
	const d = new Date(date);
	const today = new Date();
	if (typeof d === "string" && d === "Invalid Date") return false;
	if (today.getTime() > d.getTime()) return false;
	return true;
};

export const validate_past_date = (date: any) => {
	const d = new Date(date);
	const today = new Date();
	if (typeof d === "string" && d === "Invalid Date") return false;
	if (today.getTime() < d.getTime()) return false;
	return true;
};

export const validate_future_end_date = (_start: any, _end: any) => {
	const start = new Date(_start);
	const end = new Date(_end);
	if (typeof start === "string" && start === "Invalid Date") return false;
	if (typeof end === "string" && end === "Invalid Date") return false;
	if (start.getTime() >= end.getTime()) return false;
	return true;
};

export const validate_future_end_date_alt = (_start: any, _end: any) => {
	const start = new Date(_start);
	const end = new Date(_end * 1000);
	if (typeof start === "string" && start === "Invalid Date") return false;
	if (typeof end === "string" && end === "Invalid Date") return false;
	if (start.getTime() >= end.getTime()) return false;
	return true;
};

export const validate_invoice_type = (obj: string) => {
	const method = obj;
	if (
		method !== invoice_type.immediate &&
		method !== invoice_type.credit
	) return false;
	return true;
};

export const validate_invoice_status = (obj: string) => {
	const method = obj;
	if (
		method !== invoice_status.cancelled &&
		method !== invoice_status.paid &&
		method !== invoice_status.partially_paid &&
		method !== invoice_status.unpaid
	) return false;
	return true;
};

export const validate_invoice_payment_method = (obj: string) => {
	const method = obj;
	if (
		method !== invoice_payment_method.account_balance &&
		method !== invoice_payment_method.cash &&
		method !== invoice_payment_method.cheque &&
		method !== invoice_payment_method.pos &&
		method !== invoice_payment_method.transfer
	) return false;
	return true;
};

export const validate_po_type = (obj: string) => {
	const method = obj;
	if (
		method !== po_type.cement &&
		method !== po_type.general &&
		method !== po_type.maintenance
	) return false;
	return true;
};

export const validate_po_payment_status = (obj: string) => {
	const method = obj;
	if (
		method !== po_payment_status.paid &&
		method !== po_payment_status.partially_paid &&
		method !== po_payment_status.unpaid
	) return false;
	return true;
};

export const validate_po_delivery_status = (obj: string) => {
	const method = obj;
	if (
		method !== po_delivery_status.delivered &&
		method !== po_delivery_status.partially_delivered &&
		method !== po_delivery_status.pending
	) return false;
	return true;
};

export const validate_fuel_delivery_status = (obj: string) => {
	const method = obj;
	if (
		method !== fuel_delivery_status.delivered &&
		method !== fuel_delivery_status.partially_delivered &&
		method !== fuel_delivery_status.pending
	) return false;
	return true;
};

export const validate_vendor_payment_method = (obj: string) => {
	const method = obj;
	if (
		method !== vendor_payment_method.cash &&
		method !== vendor_payment_method.cheque &&
		method !== vendor_payment_method.pos &&
		method !== vendor_payment_method.transfer
	) return false;
	return true;
};

export const validate_fuel_type = (obj: string) => {
	const method = obj;
	if (
		method !== fuel_type.diesel &&
		method !== fuel_type.electric &&
		method !== fuel_type.petrol
	) return false;
	return true;
};

export const validate_vehicle_type = (obj: string) => {
	const method = obj;
	if (
		method !== vehicle_type.block_truck &&
		method !== vehicle_type.tipper &&
		method !== vehicle_type.water_tanker
	) return false;
	return true;
};

export const validate_vehicle_availability_status = (obj: string) => {
	const method = obj;
	if (
		method !== vehicle_availability_status.available &&
		method !== vehicle_availability_status.inactive &&
		method !== vehicle_availability_status.maintenance &&
		method !== vehicle_availability_status.on_delivery
	) return false;
	return true;
};

export const validate_business_rule_value_type = (obj: string) => {
	const method = obj;
	if (
		method !== business_rule_value_type.number &&
		method !== business_rule_value_type.percentage
	) return false;
	return true;
};

export const validate_delivery_assignment_status = (obj: string) => {
	const method = obj;
	if (
		method !== delivery_assignment_status.cancelled &&
		method !== delivery_assignment_status.completed &&
		method !== delivery_assignment_status.in_transit &&
		method !== delivery_assignment_status.pending
	) return false;
	return true;
};

export const validate_app_default_type = (app_default: string) => {
	if (!app_defaults_data_type.includes(app_default)) return false;
	return true;
};

export const validate_app_default_value = (value: any, data_type: string) => {
	if (data_type === "BOOLEAN" && typeof value === "boolean") return true
	else if (data_type === "STRING" && typeof value === "string") return true
	else if (data_type === "INTEGER" && typeof value === "number") return true
	else if (data_type === "BIGINT" && typeof value === "bigint") return true
	else if (data_type === "ARRAY" && Array.isArray(value) && value.length !== 0) return true
	else if (data_type === "MAP" && typeof value === "object") return true
	else return false
};

export const convert_app_default_name = (text: string) => {
	let first_convert = return_first_letter_uppercase(unstrip_text(text));
	let second_convert = strip_text_underscore(first_convert);

	return second_convert;
};

export const return_bulk_role_acls_array = (acls: any[], data: any) => {
	var results = [];
	for (let index = 0; index < acls.length; index++) {
		const element = acls[index];

		results.push({
			unique_id: uuidv4(),
			role_unique_id: data.role_unique_id,
			module_unique_id: element.module_unique_id,
			sub_module_unique_id: element.sub_module_unique_id ? element.sub_module_unique_id : null,
			view: true_status,
			add: element.add,
			edit: element.edit,
			delete: element.delete,
			elevated_role: element.elevated_role,
			status: 1
		});

		if (index === acls.length - 1) return results;
	}
};

export const return_bulk_acls_array = (acls: any[], data: any) => {
	var results = [];
	for (let index = 0; index < acls.length; index++) {
		const element = acls[index];

		results.push({
			unique_id: uuidv4(),
			user_unique_id: data.user_unique_id,
			module_unique_id: element.module_unique_id,
			sub_module_unique_id: element.sub_module_unique_id ? element.sub_module_unique_id : null,
			view: true_status,
			add: element.add,
			edit: element.edit,
			delete: element.delete,
			elevated_role: element.elevated_role,
			acl_expiring: element.acl_expiring ? element.acl_expiring : null,
			status: 1
		});

		if (index === acls.length - 1) return results;
	}
};

export const return_bulk_acls_from_role_acls_array = (acls: any[], data: any) => {
	var results = [];
	for (let index = 0; index < acls.length; index++) {
		const element = acls[index];

		results.push({
			unique_id: uuidv4(),
			user_unique_id: data.user_unique_id,
			role_unique_id: element.role_unique_id,
			module_unique_id: element.module_unique_id,
			sub_module_unique_id: element.sub_module_unique_id ? element.sub_module_unique_id : null,
			view: element.view,
			add: element.add,
			edit: element.edit,
			delete: element.delete,
			elevated_role: element.elevated_role,
			acl_expiring: null,
			status: 1
		});

		if (index === acls.length - 1) return results;
	}
};

export const get_quantity_ordered = (product_unique_id: string, items: Array<{ product_unique_id: string, quantity_ordered: number }>): number | null => {
	const item = items.find(element => element.product_unique_id === product_unique_id);
	return item ? item.quantity_ordered : null;
};

export const return_bulk_sales_order_items_array = (products: any[], items: any[], data: any) => {
	var results = [];
	for (let index = 0; index < products.length; index++) {
		const element = products[index];

		var quantity_ordered = get_quantity_ordered(element.unique_id, items) || 0;

		results.push({
			unique_id: uuidv4(),
			sales_order_unique_id: data.sales_order_unique_id,
			product_unique_id: element.unique_id,
			product_name: element.name,
			unit_price: element.price,
			quantity_ordered: quantity_ordered,
			quantity_supplied: zero,
			total_price: element.price * quantity_ordered,
			status: 1
		});

		if (index === products.length - 1) return results;
	}
};

export const calculate_total_price_amount = (salesOrderItems: Array<{ unique_id: string, sales_order_unique_id: string, product_unique_id: string, product_name: string, unit_price: number, quantity_ordered: number, quantity_supplied: number, total_price: number, status: number }>): number => {
	return salesOrderItems.reduce((sum, item) => sum + item.total_price, 0);
};

export const calculate_total_items_ordered = (salesOrderItems: Array<{ unique_id: string, sales_order_unique_id: string, product_unique_id: string, product_name: string, unit_price: number, quantity_ordered: number, quantity_supplied: number, total_price: number, status: number }>): number => {
	return salesOrderItems.reduce((sum, item) => sum + item.quantity_ordered, 0);
};

export const return_courses_from_payments = (payments: any[]) => {
	var results = [];
	for (let index = 0; index < payments.length; index++) {
		const element = payments[index];

		results.push(element.course_unique_id);

		if (index === payments.length - 1) return results;
	}
};

export const return_products_from_sale_order_items = (sale_order_items: any[]) => {
	var results = [];
	for (let index = 0; index < sale_order_items.length; index++) {
		const element = sale_order_items[index];

		results.push(element.product_unique_id);

		if (index === sale_order_items.length - 1) return results;
	}
};

// Sub Modules
export const default_role_sub_modules: Array<{ unique_id: string, name: string, stripped: string, status: number }> = [
	{
		unique_id: "7f6fae6a-25bb-42bf-b348-9b68be4aba1b",
		name: "Overview",
		stripped: strip_text("Roles - Overview"),
		status: 1
	},
	{
		unique_id: "63261508-51b9-4f32-80c4-9fb753947c98",
		name: "All Roles",
		stripped: strip_text("All Roles"),
		status: 1
	},
	{
		unique_id: "26010b60-7027-4509-854f-67eb8ca9aeb5",
		name: "Role ACLs",
		stripped: strip_text("Role ACLs"),
		status: 1
	},
];
export const default_sales_and_customer_management_sub_modules: Array<{ unique_id: string, name: string, stripped: string, status: number }> = [
	{
		unique_id: "6869b663-933c-4ab0-9a47-f51dd9ce1010",
		name: "Overview",
		stripped: strip_text("Sales & Customer Management - Overview"),
		status: 1
	},
	{
		unique_id: "6db6b5f3-0813-42c5-b737-8e08aa82e2a4",
		name: "Customers",
		stripped: strip_text("Customers"),
		status: 1
	},
	{
		unique_id: "e09e684c-7773-495a-a37f-d36ff1f5e8e7",
		name: "Products",
		stripped: strip_text("Products"),
		status: 1
	},
	{
		unique_id: "54c33ff3-f70a-4b7d-b5ac-793c87dfcfb3",
		name: "Sales Orders",
		stripped: strip_text("Sales Orders"),
		status: 1
	},
	{
		unique_id: "de74feff-291f-4656-a658-6e3a83a186c1",
		name: "Invoices",
		stripped: strip_text("Invoices"),
		status: 1
	},
	{
		unique_id: "2fdd67e1-ea7a-405e-9776-36d79bf5c3e1",
		name: "Invoice Payments",
		stripped: strip_text("Invoice Payments"),
		status: 1
	},
	{
		unique_id: "b1b90c54-2ea6-485a-8028-3c20c55eff62",
		name: "Discounts",
		stripped: strip_text("Discounts"),
		status: 1
	},
	{
		unique_id: "04d9971c-6a37-45ae-a97a-9edb037d7c94",
		name: "Block Creditors Report",
		stripped: strip_text("Block Creditors Report"),
		status: 1
	},
];
export const default_procurement_and_vendor_management_sub_modules: Array<{ unique_id: string, name: string, stripped: string, status: number }> = [
	{
		unique_id: "74e75744-2650-494a-8807-e92110a389bc",
		name: "Overview",
		stripped: strip_text("Procurement & Vendor Management - Overview"),
		status: 1
	},
	{
		unique_id: "543e32df-0ff8-4a62-8677-cb82475ed2e5",
		name: "Vendors",
		stripped: strip_text("Vendors"),
		status: 1
	},
	{
		unique_id: "803ed2f30792-cfaf-452f-8541-6cfbf099",
		name: "Purchase Orders",
		stripped: strip_text("Purchase Orders"),
		status: 1
	},
	{
		unique_id: "53b7988b-d208-478a-9bff-68504892bad0",
		name: "Vendor Payments",
		stripped: strip_text("Vendor Payments"),
		status: 1
	},
	{
		unique_id: "acda7ea4-b29c-4f72-b3df-f0783e183875",
		name: "Fuel Purchases",
		stripped: strip_text("Fuel Purchases"),
		status: 1
	},
	{
		unique_id: "351e6a00-65ff-4649-a9c4-03ca5318c2bc",
		name: "Expenses",
		stripped: strip_text("Expenses"),
		status: 1
	},
];
export const default_inventory_and_stock_management_sub_modules: Array<{ unique_id: string, name: string, stripped: string, status: number }> = [
	{
		unique_id: "24ff0ad4-0dbf-4d1f-992f-68f3ac594bf2",
		name: "Overview",
		stripped: strip_text("Inventory & Stock Management - Overview"),
		status: 1
	},
	{
		unique_id: "06f2d64d-a682-4058-8dba-29c848cd52c8",
		name: "Raw Materials",
		stripped: strip_text("Raw Materials"),
		status: 1
	},
	{
		unique_id: "73d046a3-7b84-4939-925e-c9d144329bee",
		name: "Raw Material Stock Logs",
		stripped: strip_text("Raw Material Stock Logs"),
		status: 1
	},
	{
		unique_id: "f9c5cae1-816a-4ee9-95b1-a127e9657c0a",
		name: "Finished Goods",
		stripped: strip_text("Finished Goods"),
		status: 1
	},
	{
		unique_id: "e52a8579-0112-484a-a646-d7746cd5f059",
		name: "Finished Goods Stock Logs",
		stripped: strip_text("Finished Goods Stock Logs"),
		status: 1
	},
];
export const default_production_and_quality_control_sub_modules: Array<{ unique_id: string, name: string, stripped: string, status: number }> = [
	{
		unique_id: "5cee6551-f6d4-47cf-a671-c43c52d4cec6",
		name: "Overview",
		stripped: strip_text("Production & Quality Control - Overview"),
		status: 1
	},
	{
		unique_id: "a5840fce-4624-4cc6-9ba9-864daf71f8e2",
		name: "Batches",
		stripped: strip_text("Production Batches"),
		status: 1
	},
	{
		unique_id: "753a8644-bc98-443a-bbbf-8e4e7e12c1c2",
		name: "Teams",
		stripped: strip_text("Production Teams"),
		status: 1
	},
	{
		unique_id: "e4aaf59d-80a8-4c01-b6c7-461186eb4ef6",
		name: "QC Logs",
		stripped: strip_text("Production QC Logs"),
		status: 1
	},
	{
		unique_id: "5af6c868-8cab-40bf-92f6-8c3b80b63a41",
		name: "Fuel Logs",
		stripped: strip_text("Production Fuel Logs"),
		status: 1
	},
	{
		unique_id: "7d043cff-73bc-4694-aa87-81e7ce1f49d2",
		name: "Machine Maintenance Logs",
		stripped: strip_text("Machine Maintenance Logs"),
		status: 1
	},
	{
		unique_id: "b422da24-18f3-492c-a195-11b6474ad2f4",
		name: "Stacking Logs",
		stripped: strip_text("Stacking Logs"),
		status: 1
	},
];
export const default_logistics_and_supply_chain_sub_modules: Array<{ unique_id: string, name: string, stripped: string, status: number }> = [
	{
		unique_id: "692b96e2-5213-42fe-8cca-d18fcaa1c73f",
		name: "Overview",
		stripped: strip_text("Logistics & Supply Chain - Overview"),
		status: 1
	},
	{
		unique_id: "bb16199f-902b-42f4-9622-39d6e5142aa0",
		name: "Delivery Assignments",
		stripped: strip_text("Delivery Assignments"),
		status: 1
	},
	{
		unique_id: "b73a7f91-49fd-44a9-9309-bb7c89fc12e7",
		name: "Supply Logs",
		stripped: strip_text("Supply Logs"),
		status: 1
	},
	{
		unique_id: "98dffb8a-be4e-4d92-ad13-21d96989ffe0",
		name: "Logistics Fuel Logs",
		stripped: strip_text("Logistics Fuel Logs"),
		status: 1
	},
];
export const default_acl_sub_modules: Array<{ unique_id: string, name: string, stripped: string, status: number }> = [
	{
		unique_id: "84ee72a6-c54a-453a-b860-a89cd204ced4",
		name: "Overview",
		stripped: strip_text("ACLs - Overview"),
		status: 1
	},
	{
		unique_id: "19fd66f7-aa3b-4237-a860-fefe40efa429",
		name: "All ACLs",
		stripped: strip_text("All ACLs"),
		status: 1
	},
];
export const default_log_sub_modules: Array<{ unique_id: string, name: string, stripped: string, status: number }> = [
	{
		unique_id: "9ff980d0-df13-4ae6-a0b5-12f87293abfa",
		name: "Overview",
		stripped: strip_text("Logs - Overview"),
		status: 1
	},
	{
		unique_id: "48241354-b26b-4170-82ac-7a3d007542aa",
		name: "All Logs",
		stripped: strip_text("All Logs"),
		status: 1
	},
];
export const default_approval_sub_modules: Array<{ unique_id: string, name: string, stripped: string, status: number }> = [
	{
		unique_id: "85774ce0-593c-41a2-8d2f-e939478fe09e",
		name: "Overview",
		stripped: strip_text("Approvals - Overview"),
		status: 1
	},
	{
		unique_id: "2de8839b-073a-48eb-9c95-79757971f930",
		name: "All Approvals",
		stripped: strip_text("All Approvals"),
		status: 1
	},
];
export const default_administration_sub_modules: Array<{ unique_id: string, name: string, stripped: string, status: number }> = [
	{
		unique_id: "5a9a9024-b270-4ebb-8af4-eb13955f962e",
		name: "Overview",
		stripped: strip_text("Administration - Overview"),
		status: 1
	},
	{
		unique_id: "b3c1b172-c13c-4a9d-a734-c48df4bf1016",
		name: "Users",
		stripped: strip_text("Users"),
		status: 1
	},
	{
		unique_id: "03b8a031-8619-41e4-8ab7-d68b74de220b",
		name: "Machines",
		stripped: strip_text("Machines"),
		status: 1
	},
	{
		unique_id: "c880d8c2-ea5b-45c1-a466-4d30529143c8",
		name: "Vehicles",
		stripped: strip_text("Vehicles"),
		status: 1
	},
	{
		unique_id: "a7362919-d524-40df-9bb0-7c711f2dd791",
		name: "Business Rules",
		stripped: strip_text("Business Rules"),
		status: 1
	},
];
// End - Sub Modules

// Modules
export const default_modules: Array<{ unique_id: string, name: string, stripped: string, status: number, sub_modules: Array<{ unique_id: string, name: string, stripped: string, status: number }> }> = [
	{
		unique_id: "642192dd-a421-4206-a703-62566b4c6c15",
		name: "ACLs",
		stripped: strip_text("ACLs"),
		sub_modules: default_acl_sub_modules,
		status: 1
	},
	{
		unique_id: "8345c3aa-c27c-4af6-941d-7d9fa353acdc",
		name: "Roles",
		stripped: strip_text("Roles"),
		sub_modules: default_role_sub_modules,
		status: 1
	},
	{
		unique_id: "a2659229-8ac7-462c-8d0b-0c4dc7fbb875",
		name: "Approvals",
		stripped: strip_text("Approvals"),
		sub_modules: default_approval_sub_modules,
		status: 1
	},
	{
		unique_id: "4ca5ed1d-c3a9-4b73-850b-09ea49ce7035",
		name: "Logs",
		stripped: strip_text("Logs"),
		sub_modules: default_log_sub_modules,
		status: 1
	},
	{
		unique_id: "449348bd-1126-4390-9efb-f6a13fd93314",
		name: "Sales & Customer Management",
		stripped: strip_text("Sales & Customer Management"),
		sub_modules: default_sales_and_customer_management_sub_modules,
		status: 1
	},
	{
		unique_id: "08457963-70e6-490a-b935-b171113c2ca4",
		name: "Procurement & Vendor Management",
		stripped: strip_text("Procurement & Vendor Management"),
		sub_modules: default_procurement_and_vendor_management_sub_modules,
		status: 1
	},
	{
		unique_id: "d4cc1607-eff1-4284-a5ec-1100e114472d",
		name: "Inventory & Stock Management",
		stripped: strip_text("Inventory & Stock Management"),
		sub_modules: default_inventory_and_stock_management_sub_modules,
		status: 1
	},
	{
		unique_id: "ca691ef7-e315-4d54-b28f-1dac1f286956",
		name: "Production & Quality Control",
		stripped: strip_text("Production & Quality Control"),
		sub_modules: default_production_and_quality_control_sub_modules,
		status: 1
	},
	{
		unique_id: "3116c1db-ad02-464a-be05-95797a31bd95",
		name: "Logistics & Supply Chain",
		stripped: strip_text("Logistics & Supply Chain"),
		sub_modules: default_logistics_and_supply_chain_sub_modules,
		status: 1
	},
	{
		unique_id: "88cab3ac-b9c4-4b85-9216-68bb1f2af644",
		name: "Administration",
		stripped: strip_text("administration"),
		sub_modules: default_administration_sub_modules,
		status: 1
	},
];
// End - Modules

// Business Rules
export const business_rules = {
	BLOCKS_PER_CEMENT_BAG: "BLOCKS_PER_CEMENT_BAG", 
	BLOCKS_PER_SAND_TRIP: "BLOCKS_PER_SAND_TRIP", 
	STACKING_RATE_PER_BLOCK: "STACKING_RATE_PER_BLOCK", 
	DRIVER_BASE_RATE_PER_BLOCK: "DRIVER_BASE_RATE_PER_BLOCK", 
	DIESEL_PRICE_PER_LITER: "DIESEL_PRICE_PER_LITER", 
	PETROL_PRICE_PER_LITER: "PETROL_PRICE_PER_LITER", 
	OUTSIDE_TOWN_MARKUP_PERCENT: "OUTSIDE_TOWN_MARKUP_PERCENT", 
	LOADER_RATE_PER_BLOCK: "LOADER_RATE_PER_BLOCK", 
};

export const default_business_rules: Array<{ unique_id: string, rule_key: string, rule_value: number, value_type: string, applies_to: string, notes?: string, is_active?: boolean, updated_by?: string, status?: number, }> = [
	{
		unique_id: uuidv4(),
		rule_key: business_rules.BLOCKS_PER_CEMENT_BAG,
		rule_value: 45,
		value_type: business_rule_value_type.number,
		applies_to: "Production",
		is_active: true,
		status: 1
	},
	{
		unique_id: uuidv4(),
		rule_key: business_rules.BLOCKS_PER_SAND_TRIP,
		rule_value: 1200,
		value_type: business_rule_value_type.number,
		applies_to: "Production",
		is_active: true,
		status: 1
	},
	{
		unique_id: uuidv4(),
		rule_key: business_rules.STACKING_RATE_PER_BLOCK,
		rule_value: 1.50,
		value_type: business_rule_value_type.percentage,
		applies_to: "Production",
		is_active: true,
		status: 1
	},
	{
		unique_id: uuidv4(),
		rule_key: business_rules.DRIVER_BASE_RATE_PER_BLOCK,
		rule_value: 5.00,
		value_type: business_rule_value_type.percentage,
		applies_to: "Transport",
		is_active: true,
		status: 1
	},
	{
		unique_id: uuidv4(),
		rule_key: business_rules.DIESEL_PRICE_PER_LITER,
		rule_value: 850,
		value_type: business_rule_value_type.number,
		applies_to: "Fuel",
		is_active: true,
		status: 1
	},
	{
		unique_id: uuidv4(),
		rule_key: business_rules.PETROL_PRICE_PER_LITER,
		rule_value: 650,
		value_type: business_rule_value_type.number,
		applies_to: "Fuel",
		is_active: true,
		status: 1
	},
	{
		unique_id: uuidv4(),
		rule_key: business_rules.OUTSIDE_TOWN_MARKUP_PERCENT,
		rule_value: 15,
		value_type: business_rule_value_type.percentage,
		applies_to: "Sale",
		is_active: true,
		status: 1
	},
	{
		unique_id: uuidv4(),
		rule_key: business_rules.LOADER_RATE_PER_BLOCK,
		rule_value: 1.20,
		value_type: business_rule_value_type.percentage,
		applies_to: "Payroll",
		is_active: true,
		status: 1
	},
];

// End - Business Rules

export const createRoleAndAcls = (user_unique_id: string, role_unique_id: string) => {
	const role = {
		unique_id: role_unique_id,
		name: "Administrator",
		stripped: strip_text("Administrator"),
		status: 1,
	};

	const roleAcls = default_modules.flatMap((module) => {
		return module.sub_modules.map((sub_module) => ({
			unique_id: uuidv4(),
			role_unique_id: role.unique_id,
			module_unique_id: module.unique_id,
			sub_module_unique_id: sub_module.unique_id,
			view: true,
			add: true,
			edit: true,
			delete: true,
			elevated_role: true,
			status: 1,
		}));
	});

	const acls = default_modules.flatMap((module) => {
		return module.sub_modules.map((sub_module) => ({
			unique_id: uuidv4(),
			user_unique_id: user_unique_id,
			role_unique_id: role.unique_id,
			module_unique_id: module.unique_id,
			sub_module_unique_id: sub_module.unique_id,
			view: true,
			add: true,
			edit: true,
			delete: true,
			elevated_role: true,
			status: 1,
		}));
	});

	return { role, roleAcls, acls };
};

export const return_modules = (modules: any[]) => {
	var results = [];
	for (let index = 0; index < modules.length; index++) {
		const element = modules[index];

		results.push({
			unique_id: element.unique_id,
			name: element.name,
			stripped: element.stripped,
			status: element.status,
		});

		if (index === modules.length - 1) return results;
	}
};

export const return_sub_modules = (modules: any[]) => {
	var results = [];
	for (let index = 0; index < modules.length; index++) {
		const element_module = modules[index];
		const sub_modules = element_module.sub_modules;

		for (let index = 0; index < sub_modules.length; index++) {
			const element = sub_modules[index];
			
			results.push({
				unique_id: element.unique_id,
				module_unique_id: element_module.unique_id,
				name: element.name,
				stripped: element.stripped,
				status: element.status,
			});
		}

		if (index === modules.length - 1) return results;
	}
};

export const paginate = (page: number, _records: number, total_records: number) => {
	// Get total pages available for the amount of records needed in each page with total records
	// const records = !_records || _records < paginate_limit ? paginate_limit : _records;
	const records = !_records ? paginate_limit : parseInt(_records.toString());
	const pages = Math.ceil(total_records / records);
	// return false if page is less than 1 (first page) or greater than pages (last page)
	if (page < 1 || page > pages || !page) {
		return {
			start: 0,
			end: total_records < records ? total_records : records,
			pages: pages,
			limit: total_records < records ? total_records : records,
		};
	}

	// get the end limit
	const end = pages === page ? total_records : (page === 1 ? page * records : page * records);
	// get start limit
	// if records are uneven at the last page, show all records from last ending to the end
	const start = page === 1 ? 0 : (pages === page ? ((total_records - records) - (total_records - (page * records))) : end - records);

	// return object
	return {
		start: start,
		end: end,
		pages: pages,
		limit: end - start,
	};
};
