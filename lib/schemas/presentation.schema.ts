import { z } from "zod";

export const academicLevelSchema = z.enum(["licenciatura", "maestria", "tfm"]);
