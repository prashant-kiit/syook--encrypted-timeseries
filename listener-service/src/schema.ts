import { z } from "zod";

export const MessageSchema = z.object({
    name: z.string(),
    origin: z.string(),
    destination: z.string(),
    secret_key: z.string(),
});

export type DecryptedData = Omit<Message, "secret_key">;

export type Message = z.infer<typeof MessageSchema>;
