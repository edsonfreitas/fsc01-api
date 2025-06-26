import koa from "koa";
import bodyParser from "koa-bodyparser";
import cors from "@koa/cors";

import { router } from "./routes.js";

const app = new koa();

app.use(
  cors({
    origin: "https://fsc01-web-7x1w.vercel.app/",
    credentials: true,
  })
);
app.use(bodyParser());
app.use(router.routes());
app.use(router.allowedMethods());

const handler = app.callback();
export { app };

export default (req, res) => handler(req, res);
