import { z } from "zod";

import { STATUSES, TRENDS, TYPES } from "@/features/keywords/types";

export const nicheIdSchema = z.string().min(1).nullable();

export const newNicheSchema = z.object({
  name: z.string().min(1, "Give the niche a name.").max(120),
  parentId: nicheIdSchema.default(null),
});

export const nichePatchSchema = z
  .object({
    name: z.string().min(1, "Give the niche a name.").max(120).optional(),
    parentId: nicheIdSchema.optional(),
  })
  .refine((patch) => Object.keys(patch).length > 0, "Nothing to update.");

export const nicheDeleteModeSchema = z.enum(["reparent", "cascade"]).default("reparent");

const count = z.coerce.number().int().min(0).max(1_000_000_000);

export const newKeywordSchema = z.object({
  keyword: z.string().min(1, "Enter a keyword.").max(300),
  volume: count.default(0),
  competition: count.default(0),
  nicheId: nicheIdSchema.default(null),
  trend: z.enum(TRENDS).optional(),
  type: z.enum(TYPES).optional(),
});

export const keywordPatchSchema = z
  .object({
    keyword: z.string().min(1, "Enter a keyword.").max(300).optional(),
    volume: count.optional(),
    competition: count.optional(),
    nicheId: nicheIdSchema.optional(),
    trend: z.enum(TRENDS).optional(),
    type: z.enum(TYPES).optional(),
    status: z.enum(STATUSES).optional(),
    tick: z.boolean().optional(),
  })
  .refine((patch) => Object.keys(patch).length > 0, "Nothing to update.");

export const importSchema = z.object({
  nicheId: nicheIdSchema.default(null),
  rows: z
    .array(
      z.object({
        id: z.string(),
        keyword: z.string().min(1),
        volume: count,
        competition: count,
      }),
    )
    .min(1, "Select at least one keyword.")
    // Guards the request size; a single eRank export tops out well below this.
    .max(20_000, "That is more than 20,000 keywords — split the import."),
  autoSubniches: z
    .object({ minGroupSize: z.coerce.number().int().min(2).max(10_000).optional() })
    .nullable()
    .optional(),
});

export const autoGroupSchema = z.object({
  minGroupSize: z.coerce.number().int().min(2).max(10_000).optional(),
});

export const bulkSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "Select at least one keyword."),
  action: z.discriminatedUnion("action", [
    z.object({ action: z.literal("done") }),
    z.object({ action: z.literal("pending") }),
    z.object({ action: z.literal("delete") }),
    z.object({ action: z.literal("move"), nicheId: nicheIdSchema }),
  ]),
});

export const licenseCreateSchema = z.object({
  days: z.coerce.number().int().min(1, "At least 1 day.").max(3650),
  note: z.string().trim().max(200).default(""),
  maxDevices: z.coerce.number().int().min(1).max(50).default(3),
});

export const licenseCheckSchema = z.object({
  key: z.string().min(1, "Enter a license key.").max(64),
  deviceId: z.string().min(8).max(128),
});

export const licenseActionSchema = z.object({
  action: z.enum(["revoke", "reset-devices"]),
});

export const settingsPatchSchema = z
  .object({
    competitionRules: z
      .object({ green: count, lightGreen: count, orange: count })
      .optional(),
    visibleColumns: z
      .array(z.enum(["niche", "volume", "competition", "tick", "trend", "type"]))
      .optional(),
  })
  .refine((patch) => Object.keys(patch).length > 0, "Nothing to update.");
