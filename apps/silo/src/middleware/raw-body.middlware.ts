import { Request, Response } from "express";

export const setRawBodyOnRequest = (req: Request, res: Response, buf: Buffer) => {
  // added this to set rawBody on the request
  // this is used to verify the request signature in the slack auth middleware
  (req as any).rawBody = buf.toString();
};
