import { Hono } from "hono";
import { logger } from "hono/logger";
import { wsRoute } from "./routes/ws";
import { serveStatic } from "hono/bun";

const app = new Hono();

app.use("*", logger());

app.route('/ws', wsRoute);

app.get('*', serveStatic({ root: './client/dist'}))
app.get('*', serveStatic({ path: './client/dist/index.html'}))

export default app;
