"use server";

import { redirect } from "next/navigation";

export const navigate = async (path: string) => redirect(path);
