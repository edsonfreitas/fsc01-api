import Router from "@koa/router";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import Jwt from "jsonwebtoken";

export const router = new Router();

const prisma = new PrismaClient();

router.get("/tweets", async (ctx) => {
  const [, token] = ctx.request.headers?.authorization?.split(" ") || [];

  if (!token) {
    ctx.status = 401;
    return;
  }

  try {
    Jwt.verify(token, process.env.JWT_SECRET);
    const tweets = await prisma.tweet.findMany({
      include: {
        user: true,
      },
    }); //promise
    ctx.body = tweets;
  } catch (error) {
    if (typeof error.equals("JsonWebTokenError")) {
      ctx.status = 401;
      return;
    }

    ctx.status = 500;
    return;
  }
});

//Rota posta novo Tweet
router.post("/tweets", async (ctx) => {
  const [, token] = ctx.request.headers?.authorization?.split(" ") || [];
  if (!token) {
    ctx.status = 401;
    return;
  }

  try {
    const payload = Jwt.verify(token, process.env.JWT_SECRET);
    const tweet = await prisma.tweet.create({
      data: {
        userId: payload.sub,
        text: ctx.request.body.text,
      },
    });

    ctx.body = tweet;
  } catch (error) {
    ctx.status = 401;
    return;
  }
});

//CRIA UM NOVO USUÁRIO
router.post("/signup", async (ctx) => {
  const saltRounds = 10;
  const password = bcrypt.hashSync(ctx.request.body.password, saltRounds);

  try {
    const user = await prisma.user.create({
      data: {
        name: ctx.request.body.name,
        username: ctx.request.body.username,
        email: ctx.request.body.email,
        password,
      },
    });
    const accessToken = Jwt.sign(
      {
        sub: user.id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    ctx.body = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      accessToken,
    };
  } catch (error) {
    if (error.meta && !error.meta.target) {
      ctx.status = 422;
      ctx.body = "Email ou nome de usuário já existe.";
      return;
    }
    ctx.status = 500;
    ctx.body = "Internal error";
  }
});

//Rota Login
router.get("/login", async (ctx) => {
  const [, token] = ctx.request.headers.authorization.split(" ");
  const [email, plainTextpassword] = Buffer.from(token, "base64")
    .toString()
    .split(":");

  //const saltRounds = 10
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    ctx.status = 404;
    return;
  }

  const passwordMatch = bcrypt.compareSync(plainTextpassword, user.password);

  if (passwordMatch) {
    const accessToken = Jwt.sign(
      {
        sub: user.id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    ctx.body = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      accessToken,
    };
    return;
  }

  ctx.status = 404;
});

//Delete tweet
router.delete("/tweets/:id", async (ctx) => {
  const idPar = ctx.params.id;
  try {
    const deletTweet = await prisma.tweet.delete({
      where: { id: idPar },
    });

    // Retorna a resposta ao cliente
    if (deletTweet) {
      ctx.status = 200; // Sucesso
      ctx.body = { message: "Post excluído com sucesso!" };
    } else {
      ctx.status = 404; // Não encontrado
      ctx.body = { message: "tweet não encontrado!" };
    }
  } catch (error) {
    console.log("Erro ao remover tweet: " + error);
    ctx.body = { message: "Erro ao remover usuário." };
    ctx.status = 500; // Internal Server Error
  }
});
