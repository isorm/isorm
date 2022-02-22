import { TMiddleware, TPlaygroundCallback, TRoute } from "./types";
import { _attacher } from "./utils/_attacher";
import { Express } from "express";
import { routes } from "./routes";

export const _needs = async ({
  app,
  router,
  middlewares,
  playground,
}: {
  app: Express;
  router: TRoute[];
  playground?: TPlaygroundCallback;
  middlewares?: TMiddleware<{}>[];
}) => {
  let merged: object = {};

  const combine = (data: object) => (merged = data);

  if (playground)
    await playground({
      combine,
    });

  if (Object.keys(merged).length > 0) {
    await app.use(
      _attacher((req, res, next) => {
        req.atc = merged;
        return next();
      })
    );
  }

  await middlewares?.map((middleware: TMiddleware<{}>) =>
    app.use(_attacher(middleware))
  );

  await routes(app, router);
};
