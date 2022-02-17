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

export type RequestOption = Partial<{
  validator: new () => any;
}>;

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
      method: "get" | "post" | "put" | "patch" | "delete";
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
  method: "get" | "post" | "put" | "patch" | "delete";
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

export const Invoker = ({
  middlewares,
  playground,
  options = {
    parser: {
      urlencoded: {
        extended: false,
      },
      json: {
        limit: "300kb",
      },
    },
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

  const validate =
    (classValidator: any) =>
    async (req: Request, res: Response, next: NextFunction) => {
      if (!classValidator) return next();
      try {
        const validator = await new classValidator();
        if (req?.params && validator?.validateParam)
          await validator?.validateParam(req?.params);
        const result = await validator?.validateBody(req?.body);
        if (result?.body) {
          // eslint-disable-next-line require-atomic-updates
          req.body = result?.body;
        }
        return next();
      } catch (e) {
        return res.json(e);
      }
    };

  globalThis._$.map(({ routes, middlewares, controller, basePath }) => {
    if (middlewares && middlewares.length > 0) APP.use(middlewares);

    let i = 0;
    while (i < routes.length) {
      const { path, method, options, key } = routes[Number(i)];

      APP[`${method}`](
        `${basePath}/${path}`,
        validate(options?.validator),
        (...data: any[]) => controller[`${key}`](...data)
      );

      i++;
    }

    return null;
  });

  return APP;
};

export class InjectValidator {
  validateBody?(value: any): any {
    return null;
  }

  validateParam?(value: any): any {
    return null;
  }
}
