import app from "./app";
import { websocket } from "./routes/ws";

const port = process.env.PORT || 3000
export default {
  port,
  hostname: "0.0.0.0",
  fetch: app.fetch,
  websocket
};

console.log("Server running", port)