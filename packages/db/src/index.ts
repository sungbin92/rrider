import { PrismaClient } from "../prisma/generated";

export const prisma = new PrismaClient();
export * from "../prisma/generated";
export * from "@prisma/client-runtime-utils";
