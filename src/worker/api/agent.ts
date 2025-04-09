import { Env } from "@/models/Env";
import { Hono } from "hono";
import { approvePayment, converse } from "@/worker/services/wonderApi";
import { AgentConverseAPIInput, AgentResponseToPaymentRequestAPIInput } from "@/models/APIInputs";
const app = new Hono<{ Bindings: Env }>();

app.post("/converse", async (c) => {
  const body: AgentConverseAPIInput = await c.req.json();

  const response = await converse(body.request);

  return c.json(response);
});

app.post("/approvePayment", async (c) => {
  const body: AgentResponseToPaymentRequestAPIInput = await c.req.json();

  const response = await approvePayment(body.message);

  return c.json(response);
});

export default app;
