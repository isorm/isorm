import express, {
  Express,
  NextFunction,
  Request,
  Response,
  Router,
} from "express";

export type Req<T> = {
  [key: string]: any;
  atc?: object;
} & Request & {
    [K in keyof T]: T[K];
  };

export type Res<T> = {
  [key: string]: any;
} & Response & {
    [K in keyof T]: T[K];
  };

export interface IErrorParams {
  type: string;
  status: number;
  title?: string;
  message?: string;
  payload?: any;
}

export interface Next {
  (err: IErrorParams): any;
}

export type TRoute = { path: string; route: Router };

export type TMiddleware<T extends any> = (
  req: Req<T>,
  res: Res<T>,
  next: NextFunction
) => NextFunction | void;

export type TAttach<T> = (
  req: Req<T>,
  res: Res<T>,
  next: NextFunction
) => Response | NextFunction | void;

export interface TPlaygroundCallbackParams {
  combine: (data: object) => void;
}

export type TPlaygroundCallback = (
  params?: Partial<TPlaygroundCallbackParams>
) => void | Promise<void>;

export const _attacher = (handler: (...handlerProps: any) => any) => {
  return handler as () => {};
};

export const routes = (app: Express, routes: TRoute[]) =>
  routes.map((item: TRoute) => {
    return app.use(
      item.path,
      _attacher(item.route),
      (err: IErrorParams, _req: Req<{}>, res: Response, _next: Next) => {
        return res.json(err).status(err.status);
      }
    );
  });

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

export const Implementer = (
  ...routes: {
    conf: {
      method: "post" | "put" | "patch" | "delete" | "use" | "get";
      path: string;
    };
    attach: TAttach<{}>[] | TAttach<{}>;
  }[]
) => {
  const app = express.Router();
  routes.map(({ attach, conf: { method, path } }) => {
    const handler =
      attach instanceof Array
        ? attach.map((item) => _attacher(item))
        : _attacher(attach);

    app[method](path, handler);

    return null;
  });

  return app;
};
