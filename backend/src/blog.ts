
import { Hono } from "hono";
import { getSignedCookie } from "hono/cookie";
import { verify } from "hono/jwt";
import { JWTPayload } from "hono/utils/jwt/types";
import { prismaClient } from "./db";

export const blogRoute = new Hono<{
  Bindings: {
    JWT_SECRET: string;
  },
  Variables:{
    "auth-payload":JWTPayload
  }
}>();

blogRoute.use("/", async (c, next) => {
  // get Cookie
  try {
    const token =
      (await getSignedCookie(c, c.env.JWT_SECRET, "auth-cookie")) ||
      c.req.header("authentication")?.split(" ")[0] ||
      "";
    const payload = await verify(token, c.env.JWT_SECRET);
    console.log(payload);
    c.set("auth-payload", payload);
    await next();
  } catch (error) {
    c.status(403);
    return c.json({ message: "your logged out please login" });
  }
});

blogRoute.get("/", async(c) => {
  try {
    const prisma = prismaClient(c);
    const data = await prisma.post.findMany();
    
    return c.json({ message: "success", data}, 201, { passed: "successfully"})
  } catch (error) {
    return c.notFound()
  }
});

blogRoute.post("/", async(c) => {
  try {
    const prisma = prismaClient(c);
    const { title, content} = await c.req.json();
    const authorId = c.get("auth-payload")?.id
    if(!authorId) throw new Error("payload not found on context")
    const data = await prisma.post.create({
      data: {
        title,
        content,
        authorId: authorId as string,
      }
    });
    return c.json({ message: "created", data }, 201, { passed: "created successfully"})
  } catch (error) {
    if(error instanceof Error && error.message === "payload not found on context"){
      return c.json({message: "UnAuthorized "}, 403)
    }
    return c.json({ message: "error creating post", error }, 400)
  }
});

blogRoute.put("/", async(c) => {
 try {
   const prisma = prismaClient(c);
   const {id, ...body} = await c.req.json();
   const authorId = c.get("auth-payload")?.id;
   if(!authorId) throw new Error("payload not found on context");
  //  auything in body is needed to change in the upate
   const data =   await prisma.post.update({
    where: { id: id}, data:body
   });
   return c.json({ message: "created", data }, 201, { passed: "created successfully"});
 } catch (error) {
  if(error instanceof Error && error.message === "payload not found on context"){
    return c.json({message: "UnAuthorized "}, 403)
  }
  return c.json({ message: " error in updating post", error}, 400)
 }
});

blogRoute.get("/:id", async(c) => {
  try {
    const prisma = prismaClient(c);
    const id = c.req.param('id');
    const data = await prisma.post.findUnique({ where: { id } });
    if (!data) throw new Error("post not found");
    return c.json({ message: "success", data }, 200, { passed: "successfully" });
  } catch (error) {
    return c.notFound();
  }
});
