import app from "./app";
import { websocket } from "./routes/ws";

export default {
  port: process.env.PORT || 3000,
  fetch: app.fetch,
  websocket
};