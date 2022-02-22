import { Next, TRoute } from "./types";
import { _attacher } from "./utils/_attacher";
import { Express, Request, Response } from "express";

export const routes = (app: Express, routes: TRoute[]) =>
  routes.map((item: TRoute) => {
    return app.use(
      item.path,
      _attacher(item.route),
      (err: any, _req: Request, res: Response, _next: Next<any>) => {
        return res.json(err);
      }
    );
  });
