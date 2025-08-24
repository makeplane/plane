import { ClickupAPIService } from "./api.service";

export const createClickUpService = (apiKey: string): ClickupAPIService => new ClickupAPIService(apiKey);
