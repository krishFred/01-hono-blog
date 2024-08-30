import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { decode, sign, verify } from "hono/jwt";
import type { JwtVariables } from "hono/jwt";
import { authRoute } from "./auth";
import { blogRoute } from "./blog";

/**
 *  Don't forgot to remove the wrangle tomel file for not exposing db
 */

const app = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: JwtVariables;
}>().basePath("/api/v1");

app.get('/', (c)=>{
  return c.text(" Hono created");
})


app.route('/user', authRoute);
app.route('/blog', blogRoute)




export default app;
