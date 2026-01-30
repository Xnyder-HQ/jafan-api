import axios from 'axios';
import { clouder_url } from '../config/config';

interface DeletePayload {
	cloudinary_name?: string,
	cloudinary_key?: string,
	cloudinary_secret?: string,
	public_id?: string
}

export const deleteImage = async function (key: string, payload: DeletePayload) {
	try {
		const response = await axios.delete(
			`${clouder_url}/remove/file`,
			{
				data: {
					key,
					...payload
				}
			},
		);
		return { err: false, data: response.data };
	} catch (error: any) {
		return { err: true, error, response_code: error.response.status };
	}
};