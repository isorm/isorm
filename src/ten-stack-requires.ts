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

const METADATA_PROP_INDEX = Symbol("METADATA_PROP_INDEX");

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
    target: any;
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

export class Container {
  private static INJECT_CLASS = new Map();
  private static INJECT_LIST = Symbol("INJECT_LIST");

  static resolve<T extends { [key: string]: any }>(target: {
    new (...args: any[]): T;
  }): T {
    const targetClass = Reflect.getOwnMetadata(this.INJECT_LIST, target) || [];
    const injectlist = targetClass
      .sort((a: any, b: any) => {
        return a.index - b.index;
      })
      .map((item: any) => {
        return item.inject;
      });

    const instance = new target(...injectlist);

    this.INJECT_CLASS.set(instance, instance);

    return instance;
  }

  static realClass = (target: any) => {
    const cls = Container.resolve(target.constructor);
    const instance = this.INJECT_CLASS.get(cls);
    return instance;
  };

  static Inject(value: any) {
    return (target: any, key: PropertyKey, paramIndex: number) => {
      const injects: any[] =
        Reflect.getOwnMetadata(this.INJECT_LIST, target) || [];

      injects.push({
        key: "constructor",
        index: paramIndex,
        constructorName: target.name,
        name: value.name,
        inject: Container.resolve(value),
      });

      Reflect.defineMetadata(this.INJECT_LIST, injects, target);
    };
  }
}

export const Inject = (value: any) => Container.Inject(value);
export const Resolve = (target: any) => Container.resolve(target);
export const RealClass = (target: any) => Container.resolve(target);

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
  return (target: any, propKey: string, descriptor: PropertyDescriptor) => {
    const mtd = descriptor.value;

    let classMetadata = Reflect.getOwnMetadata(
      METADATA_PROP_INDEX,
      target,
      propKey
    );

    if (!classMetadata) return;
    classMetadata = classMetadata[0];
    const classIndex = globalThis._$.findIndex(
      (item: any) => item.name === target.constructor.name
    );

    const route = {
      options,
      key: propKey,
      path: path ?? "/",
      method,
    };

    if (classIndex === -1) {
      const temp = {
        middlewares: [],
        name: target.constructor.name,
        basePath: "/",
        target,
        routes: [route],
      };
      globalThis._$.push(temp);
    } else globalThis._$[Number(classIndex)].routes.push(route);

    const index = globalThis._$.findIndex(
      (item) => item.name === classMetadata.constructorName
    );

    if (!globalThis._$[Number(index)]?.target) {
      globalThis._$[Number(index)].target = target;
    }

    descriptor.value = (...data: any[]) => {
      const instance = Container.realClass(target);
      let i: string;
      for (i in classMetadata.props) {
        const item = classMetadata.props[`${i}`];
        const index = data.findIndex((_, index) => index === item.index);
        if (index === -1) continue;
        data[Number(index)] = item.attach;
      }

      return mtd.apply(instance, data);
    };
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

  globalThis._$.map(({ routes, middlewares, target, controller, basePath }) => {
    if (middlewares && middlewares.length > 0) APP.use(middlewares);

    let i = routes.length;
    while (i--) {
      const { path, method, options, key } = routes[Number(i)];

      const routeMetadata = Reflect.getOwnMetadata(
        METADATA_PROP_INDEX,
        target,
        key
      );

      const normalize = (path: string) => path.split(" ").join("/") ?? "/";

      const _basePath = normalize(basePath as string);
      const _path = normalize(path as string);

      let endpoint = join("/", _basePath, _path).replace(/\\/g, "/");

      endpoint = endpoint.replace(/\/:|:/g, "/:");

      APP[`${method}`](
        endpoint,
        validate(options?.validator),
        (req: Request, res: Response, next: NextFunction) => {
          const metadata = routeMetadata[0];

          metadata.props = metadata.props.map((item: any) => {
            if (item.methodName === key) {
              if (item.title.shortName === "req") item.attach = req;
              else if (item.title.shortName === "res") item.attach = res;
              else if (item.title.shortName === "nex") item.attach = next;
            }
            return item;
          });

          Reflect.defineMetadata(METADATA_PROP_INDEX, [metadata], target, key);
          next();
        },
        (...data: any[]) => controller[`${key}`](...data),
        NextHandler
      );
    }

    return null;
  });

  return APP;
};

const PropDefiner = ({
  name,
  shortName,
  target,
  key,
  propIndex,
}: {
  propIndex: number;
  target: any;
  key: string;
  shortName: string;
  name: string;
}) => {
  type TPropContainer = {
    index: number;
    title: {
      shortName: string;
      name: string;
    };
    methodName: string;
  };

  type TNewContainer = {
    constructor: any;
    constructorName: any;
    props: TPropContainer[];
  };

  const propContainers: TNewContainer[] =
    Reflect.getOwnMetadata(METADATA_PROP_INDEX, target, key) || [];

  const newContainer: TNewContainer = {
    constructor: target.constructor,
    constructorName: target.constructor.name,
    props: [],
  };

  const propOfContainer: TPropContainer = {
    index: propIndex,
    methodName: key,
    title: { name, shortName },
  };

  const index = propContainers.findIndex(
    (item: { [key: string]: any }) =>
      item.constructorName === target.constructor.name
  );

  if (index === -1) {
    newContainer.props.push(propOfContainer);
    propContainers.push(newContainer);
  } else propContainers[Number(index)].props.push(propOfContainer);

  Reflect.defineMetadata(METADATA_PROP_INDEX, propContainers, target, key);
};

export const Req = (target: any, key: string, propIndex: number) => {
  PropDefiner({ target, key, propIndex, name: "request", shortName: "req" });
};

export const Res = (target: any, key: string, propIndex: number) => {
  PropDefiner({ target, key, propIndex, name: "response", shortName: "res" });
};

export const Nex = (target: any, key: string, propIndex: number) => {
  PropDefiner({
    target,
    key,
    propIndex,
    name: "next",
    shortName: "nex",
  });
};
