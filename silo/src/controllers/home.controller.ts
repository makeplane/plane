import { Request, Response } from "express";
import { Controller, Get } from "@/lib";

@Controller("/health")
export class HomeController {
  @Get("/")
  async HomePingRequest(req: Request, res: Response) {
    try {
      res.status(201).json({ message: "Welcome to Silo health check" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
