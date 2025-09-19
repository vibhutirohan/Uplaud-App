// api/index.js
import app from "../server.js";
import serverless from "serverless-http";

export const config = { runtime: "nodejs20" }; // or nodejs18
export default serverless(app);
