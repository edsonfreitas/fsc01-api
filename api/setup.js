import koa from "koa";
import bodyParser from "koa-bodyparser";
import cors from "@koa/cors";

import { router } from "./routes.js";

export const app = new koa();

app.use(cors());
app.use(bodyParser());
app.use(router.routes()).use(router.allowedMethods());

export default (req, res) => {
  app.callback()(req, res);
};
