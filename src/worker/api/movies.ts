import { Env } from "@/models/Env";
import { Hono } from "hono";
import { getScript } from "@/worker/services/wonderApi";
import { GetScriptAPIInput } from "@/models/APIInputs";

const app = new Hono<{ Bindings: Env }>();

app.post("/getScript", async (c) => {
  const body: GetScriptAPIInput = await c.req.json();

  const response = await getScript(body.movieId);

  return c.json(response);
});

export default app;
