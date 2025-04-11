import { Env } from "@/models/Env";
import { Hono } from "hono";
import { cors } from "hono/cors";
import agent from "@/worker/api/agent";
import initializeEnvironment from "@/worker/api/middlewares/initializeEnvironment";
import movies from "@/worker/api/movies";

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors());
app.use("*", initializeEnvironment());

app.route("/agent", agent);
app.route("/movies", movies);
export default app;
