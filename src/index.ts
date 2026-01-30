import express, { Application } from "express";
import cors, { CorsOptions } from "cors";
import helmet from "helmet";
import rateLimit from 'express-rate-limit';
import morganMiddleware from "./middleware/morgan";
import { createApiKeys, createAppDefaults, createDefaultUser, createModulesAndSubModules, createBusinessRules } from "./config/default.config";
import { jafan_header_key, jafan_header_token, primary_domain, test_primary_domain, admin_domain, test_admin_domain } from './config/config';
import Routes from "./routes";
import Database from "./models";

// Rate limiting
const limiter = rateLimit({
	windowMs: 5 * 60 * 1000, // 5 minutes
	max: 1000, // Limit each IP to 100 requests per windowMs
	message: 'Too many requests from this IP, please try again later',
	keyGenerator: (req) => req.ip || 'unknown',	
});

export default class Server {
	constructor(app: Application) {
		this.config(app);
		this.syncDatabase();
		new Routes(app);
	}

	private config(app: Application): void {
		const appWhitelist = [
			primary_domain, 
			admin_domain, 
			test_primary_domain, 
			test_admin_domain, 
			"https://jafan-erp.netlify.app",
			"http://localhost", 
			"http://localhost:80", 
			"http://localhost:3000", 
			"http://localhost:5173",
			"http://localhost:5174",
		];

		const corsOptions: CorsOptions = {
			allowedHeaders: [
				'Access-Control-Allow-Headers',
				'Access-Control-Allow-Origin',
				'Origin',
				'X-Requested-With',
				'Content-Type',
				'Accept',
				'Authorization',
				jafan_header_key, 
				jafan_header_token
			],
			methods: 'GET,PUT,POST,DELETE,OPTIONS',
			credentials: true,
			origin(requestOrigin, callback) {
				if (requestOrigin && appWhitelist.indexOf(requestOrigin) !== -1) {
					callback(null, true);
				} else {
					callback(null, false);
				}
			},
		};

		app.use(cors(corsOptions));
		app.use(express.json()); 
		app.use(express.urlencoded({ extended: true, limit: '100mb' }));
		app.set('trust proxy', 1);
		app.use(limiter); // Apply rate limiting to all routes
		app.use(helmet());
		app.use(morganMiddleware);
	}

	private syncDatabase(): void {
		const db = new Database();
		db.sequelize?.sync({ alter: false }).then(() => {
			// creating defaults
			createApiKeys();
			createAppDefaults();
			createModulesAndSubModules();
			createDefaultUser();
			createBusinessRules();
		});
	}
}