import process from "node:process";
import express, { Application } from "express";
import Server from "./src/index";
import Database from "./src/models";

async function bootstrap() {
	// change timezone for app
	process.env.TZ = "UTC";

	const app: Application = express();
	const server = new Server();

	const NODE_ENV: string | undefined = process.env.NODE_ENV;

	const PORT: number =
		NODE_ENV === "development"
			? 885
			: parseInt(process.env.PORT || "3085", 10);

	await server.init(app);

	const listener = app.listen(PORT, () => {
		console.log(`Server is running on port ${PORT}.`);
	});

	listener.on("error", async (err: any) => {
		if (err.code === "EADDRINUSE") {
			console.log("Error: address already in use");
			await Database.sequelize?.close();
			process.exit(1);
		} else {
			console.log(err);
			await Database.sequelize?.close();
			process.exit(1);
		}
	});
}

bootstrap();