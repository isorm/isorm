import express, {
  Express,
  NextFunction,
  Request,
  Response,
  Router,
} from "express";

export interface IErrorParams {
  type: string;
  status: number;
  title?: string;
  message?: string;
  payload?: any;
}

declare module "express" {
  export interface Request {
    [key: string]: any;
  }

  export interface Response {
    [key: string]: any;
  }
}

export interface Next {
  (err: IErrorParams): any;
}

export type TRoute = { path: string; route: Router };

export type TMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => NextFunction | void;

export type TAttach = (
  req: Request,
  res: Response,
  next: NextFunction
) => Response | NextFunction | void;

export const _attacher = (handler: (...handlerProps: any) => any) => {
  return handler as () => {};
};

export const _needs = ({
  app,
  router,
  middlewares,
}: {
  app: Express;
  router: TRoute[];
  middlewares?: TMiddleware[];
}) => {
  middlewares?.map((middleware: TMiddleware) => app.use(_attacher(middleware)));
  routes(app, router);
};

export const routes = (app: Express, routes: TRoute[]) =>
  routes.map((item: TRoute) => {
    return app.use(
      item.path,
      _attacher(item.route),
      (err: IErrorParams, _req: Request, res: Response, _next: Next) => {
        return res.json(err).status(err.status);
      }
    );
  });

export const Implementer = (
  ...routes: {
    conf: {
      method: "post" | "put" | "patch" | "delete" | "use" | "get";
      path: string;
    };
    attach: TAttach[] | TAttach;
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
