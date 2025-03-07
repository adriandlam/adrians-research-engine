import express from "express";
import { env } from "./config/env";
import { metricsMiddleware } from "./config/metric";

const app = express();

// Middleware
app.use(express.json());
app.use(metricsMiddleware);

app.get("/", (req, res) => {
	res.send("Hello World!");
});

// Start the server
app.listen(env.PORT, () => {
	console.log(`[server]: Server is running at http://localhost:${env.PORT}`);
});
