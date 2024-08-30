import { z } from "zod";

export const createBlog = z.object({
  title: z.string(),
  content: z.string(),
  authorId: z.string(),
});

export const updateBlog = createBlog.partial().extend({
  id: z.string(),
});

export const signUp = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string(),
});

export const signIn = signUp.omit({ name: true });

export type CreateBlog = z.infer<typeof createBlog>;
export type UpdateBlog = z.infer<typeof updateBlog>;
export type SignUp = z.infer<typeof signUp>;
export type SignIn = z.infer<typeof signIn>;
