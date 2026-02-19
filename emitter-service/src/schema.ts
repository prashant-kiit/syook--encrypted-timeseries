import { z } from "zod";

export const RawDataSchema = z.object({
  names: z.array(z.string()),
  cities: z.array(z.string()),
});

export type RawData = z.infer<typeof RawDataSchema>;
