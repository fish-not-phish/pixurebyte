import * as z from "zod";

export const createTeamSchema = z.object({
  name: z.string().min(2, { message: "Team name must be at least 2 characters" }),
});

export type CreateTeamSchema = z.infer<typeof createTeamSchema>;
