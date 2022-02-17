import "reflect-metadata";
import express, {
  Express,
  NextFunction,
  Request,
  Response,
  Router,
} from "express";
import bodyParser, { OptionsJson, OptionsUrlencoded } from "body-parser";
import APP from "./appGlobal";
import { join } from "path";

export type RequestOption = Partial<{
  validator: new () => any;
}>;

type Methods = "get" | "post" | "put" | "patch" | "delete";
type Middleware = (req: Request, res: Response, next: NextFunction) => any;
declare global {
  var _$: {
    middlewares?: Middleware[];
    name: string;
    controller?: any;
    basePath?: string;
    routes: {
      options?: RequestOption & {
        [key: string]: any;
      };
      key: string;
      path?: string;
      middlewares?: Middleware[];
      method: Methods;
    }[];
  }[];
}

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

export interface Next<T> {
  (response: T): any;
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
) => Response | NextFunction | void | Promise<any>;

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
      (err: any, _req: Req<{}>, res: Response, _next: Next<any>) => {
        return res.json(err);
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

export function Injectable() {
  return function <T>(target: { new (...args: any[]): T }) {
    Reflect.getMetadata("design:paramtypes", target);
  };
}

export class Container {
  private static container = new Map<string, any>();

  static resolve<T>(target: { new (...args: any[]): T }): T {
    if (Container.container.has(target.name)) {
      return Container.container.get(target.name);
    }
    const tokens = Reflect.getMetadata("design:paramtypes", target) || [];
    const injections = tokens.map((token: { new (...args: any[]): T }): any =>
      Container.resolve(token)
    );
    const instance = new target(...injections);
    Container.container.set(target.name, instance);
    return instance;
  }
}

export const Controller = (_path: string) => {
  return (target: any) => {
    const controller = Container.resolve(target) as any;

    const index = globalThis._$.findIndex(
      (item) => item.name === controller.constructor.name
    );

    globalThis._$[Number(index)] = {
      ...globalThis._$[Number(index)],
      basePath: _path,
      controller,
    };
  };
};

function HandleRequestDecorator({
  method,
  options,
  path,
}: {
  method: Methods;
  options?: RequestOption;
  path: string;
}) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (target: any, propKey: string, _descriptor: PropertyDescriptor) => {
    const index = globalThis._$.findIndex(
      (item) => item?.name === target?.constructor?.name
    );

    const route = {
      options,
      key: propKey,
      path: path ?? "/",
      method,
    };

    if (index === -1) {
      const temp = {
        middlewares: [],
        name: target.constructor.name,
        basePath: "/",
        routes: [route],
      };
      globalThis._$.push(temp);
    } else globalThis._$[Number(index)].routes.push(route);
  };
}

export const Get = (path: string, options?: RequestOption) => {
  return HandleRequestDecorator({
    path,
    options,
    method: "get",
  });
};

export const Put = (path: string, options?: RequestOption) => {
  return HandleRequestDecorator({
    path,
    options,
    method: "put",
  });
};

export const Patch = (path: string, options?: RequestOption) => {
  return HandleRequestDecorator({
    path,
    options,
    method: "patch",
  });
};

export const Post = (path: string, options?: RequestOption) => {
  return HandleRequestDecorator({
    path,
    options,
    method: "post",
  });
};

export const Delete = (path: string, options?: RequestOption) => {
  return HandleRequestDecorator({
    path,
    options,
    method: "delete",
  });
};

type MiddlewareType = (req: Request, res: Response, next: NextFunction) => any;

export const Middleware = (...middleware: MiddlewareType[]) => {
  return (target: any) => {
    const controller = Container.resolve(target) as any;

    const index = globalThis._$.findIndex(
      (item) => item.name === controller.constructor.name
    );

    globalThis._$[Number(index)].middlewares = middleware;
  };
};

const defaultParser = {
  urlencoded: {
    extended: false,
  },
  json: {
    limit: "300kb",
  },
};

const statuslist = [
  100, 101, 102, 103, 200, 201, 202, 203, 204, 205, 206, 207, 208, 226, 300,
  301, 302, 303, 304, 305, 307, 308, 400, 401, 402, 403, 404, 405, 406, 407,
  408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 421, 422, 423, 424,
  425, 426, 428, 429, 431, 444, 451, 499, 500, 501, 502, 503, 504, 505, 506,
  507, 508, 510, 511, 599,
];

const validate =
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

const NextHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  return res
    .status(statuslist.includes(err.status) ? err.status : 400)
    .json(err);
};

export const Invoker = ({
  middlewares,
  playground,
  options = {
    parser: defaultParser,
  },
}: {
  controllers?: object[];
  middlewares?: MiddlewareType[];
  playground?: () => void;
  options?: {
    parser?: Partial<{
      urlencoded: OptionsUrlencoded;
      json: OptionsJson;
    }>;
  };
}): Express => {
  if (playground) playground();

  APP.use(
    bodyParser.urlencoded(options.parser?.urlencoded),
    bodyParser.json(options.parser?.json)
  );

  if (middlewares && middlewares.length > 0) {
    APP.use(middlewares);
  }

  globalThis._$.map(({ routes, middlewares, controller, basePath }) => {
    if (middlewares && middlewares.length > 0) APP.use(middlewares);

    let i = routes.length;
    while (i--) {
      const { path, method, options, key } = routes[Number(i)];

      const _basePath = basePath?.split(" ").join("/") ?? "/";
      const _path = path?.split(" ").join("/") ?? "/";

      let joiner = join("/", _basePath as string, _path as string).replace(
        /\\/g,
        "/"
      );
      
      joiner = joiner.replace(/\/:|:/g, "/:");

      APP[`${method}`](
        joiner,
        validate(options?.validator),
        (...data: any[]) => controller[`${key}`](...data),
        NextHandler
      );
    }

    return null;
  });

  return APP;
};
