import { Router, Request, Response } from "express";
import { buildCatalog } from "@eudr-guardian/acp";

export const servicesRouter = Router();

servicesRouter.get("/", (req: Request, res: Response) => {
  const origin = req.headers.origin ?? process.env.APP_URL ?? "https://eudr-guardian.example.com";
  res.json(buildCatalog(origin));
});
