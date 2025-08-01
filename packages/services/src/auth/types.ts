import * as z from "zod";

export const EmailCheckResponseSchema = z.object({
  email: z.string().email(),
  status: z.enum(["MAGIC_CODE", "CREDENTIAL"]),
  existing: z.boolean(),
  is_password_autoset: z.boolean(),
});

export type TEmailCheckResponse = z.infer<typeof EmailCheckResponseSchema>;

export type TEmailCheckData = {
  email: string;
};
