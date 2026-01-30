import { year_str } from "./config";

const copyright_year = year_str();

export const user_reset_password = (data: any) => {
	const email_subject = `Password recovery`;
	const email_text = `Here's your new password <br/><br/> Password: ${data.new_password}`;
	const email_html = `Here's your new password <br/><br/> Password: ${data.new_password}`;

	return { email_html, email_subject, email_text };
};