import { NextFunction, Request, Response } from "express";

export const validator =
  (classValidator: any) =>
  async (req: Request, res: Response, next: NextFunction) => {
    if (!classValidator) return next();
    try {
      const validator = await new classValidator();
      if (req?.params && validator?.validateParam)
        await validator?.validateParam(req?.params);
      const result = await validator?.validateBody(req?.body);
      if (result?.body) req.body = result?.body;
      return next();
    } catch (e) {
      return res.json(e);
    }
  };
