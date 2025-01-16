import { Request, Response } from "express";
import { Controller, Get } from "@/lib";
import { responseHandler } from "@/helpers/response-handler";

@Controller("/health")
export class HomeController {
  @Get("/")
  async HomePingRequest(req: Request, res: Response) {
    try {
      res.status(201).json({ message: "Welcome to Silo health check" });
    } catch (error: any) {
      responseHandler(res, 500, error);
    }
  }
}
