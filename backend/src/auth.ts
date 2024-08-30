import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { sign } from "hono/jwt";
import { prismaClient } from "./db";
import { setSignedCookie } from "hono/cookie";
import * as z from "@noobie-coder/01-hono-backend-zod"
import { fromError } from "zod-validation-error";

export const authRoute = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {};
}>();

authRoute.post("/signup", async (c) => {
  console.log({ env: c.env.DATABASE_URL });
  const prisma = prismaClient(c)

  // This is how you create your body
  const body = await c.req.json();
  const result = z.signUp.safeParse(body)
  if(!result.success){
    const validationError = fromError(result.error.issues).toString();
    console.log({ validationError});
    return c.json({ message: "error while parsing body ", error: validationError }, 403)
  }
  
  const { name, email, id } = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      password: body.password,
    },
  });
  const payload = {
    name,
    email,
    id,
  };

  const token = await sign(payload, c.env.JWT_SECRET);
  await setSignedCookie(c, "auth-cookie", token, c.env.JWT_SECRET);
  return c.json({
    jwt: token,
  });
});

authRoute.post("/signin", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  const user = await prisma.user.findUnique({
    where: {
      email: body.email,
    },
  });

  if (!user) throw new Error("user not found");

  const jwt = await sign(
    { name: user.name!, email: user.email, id: user.id },
    c.env.JWT_SECRET
  );
  return c.json({ jwt });
});
