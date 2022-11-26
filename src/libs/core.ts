import "reflect-metadata";
import bodyParser, { OptionsJson } from "body-parser";
import { OptionsUrlencoded } from "body-parser";
import { NextFunction, Request, Response, Express, Router } from "express";
import { join } from "path";
import { MiddlewareType, RequestType } from "../..";
import { defaultParser } from "../defaults";
import { DefineUnderscoreDollar } from "../utils/DefineUnderscoreDollar";
import statuslist from "../utils/statuses";
import { validator } from "./validator";
import { ipDetector } from "./ip-detector";
import APP from "../app";
import { METADATA_PROP_INDEX } from "../metadata";

const NextHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  return res
    .status(statuslist.includes(err.status) ? err.status : 400)
    .json(err);
};

const requestWrapper =
  <
    RQ extends Request,
    RS extends Response,
    N extends NextFunction,
    RT extends Promise<void>,
  >(
    cb: (req: RQ, res: RS, next: N) => RT,
  ) =>
  async (req: RQ, res: RS, next: N) => {
    try {
      await cb(req, res, next);
    } catch (e) {
      next(e);
    }
  };

export const core = ({
  middlewares,
  base = "/",
  playground,
  options = {
    parser: defaultParser,
  },
}: {
  controllers?: object[];
  middlewares?: MiddlewareType[];
  base?: string;
  playground?: (app: Express) => void;
  options?: {
    parser?: Partial<{
      urlencoded: OptionsUrlencoded;
      json: OptionsJson;
    }>;
  };
}): Express => {
  DefineUnderscoreDollar();
  APP.use(
    bodyParser.urlencoded(options.parser?.urlencoded),
    bodyParser.json(options.parser?.json),
  );

  if (playground) playground(APP);

  if (middlewares && middlewares.length > 0) {
    APP.use(middlewares);
  }

  globalThis._$.map(
    ({ routes, middlewares, controller, basePath, ...some }) => {
      const controllerRouter = Router();
      if (middlewares && middlewares.length > 0)
        controllerRouter.use(middlewares);

      const normalize = (path: string) => path.split(" ").join("/") ?? "/";
      const _basePath = normalize(basePath as string);

      let i = routes.length;
      while (i--) {
        const { path, method, options, key, middlewares } = routes[Number(i)];

        const routeMetadata = Reflect.getOwnMetadata(
          METADATA_PROP_INDEX,
          some?.target,
          key,
        );

        const _path = normalize(path as string);

        let endpoint = join("/", _path).replace(/\\/g, "/");

        endpoint = endpoint.replace(/\/:|:/g, "/:");

        const midls = (middleware: unknown): MiddlewareType[] => {
          let mids: any[];
          if (middleware instanceof Array) mids = middleware;
          mids = [middleware];
          return mids.filter((item: any) => item);
        };
        controllerRouter[`${method}`]?.(
          endpoint,
          ...midls(middlewares || []),
          ...midls(options?.use),
          validator(options?.validator),
          ...midls(options?.useAfterValidate),
          // eslint-disable-next-line @typescript-eslint/ban-types
          async (req: RequestType<{}>, res: Response, next: NextFunction) => {
            const metadata = routeMetadata[0];

            let i: any;
            for (i in metadata.props) {
              const item = metadata.props[parseInt(i)];
              const {
                methodName,
                title: { shortName: name },
              } = item;
              if (methodName !== key) continue;
              if (name === "req") item.attach = req;
              else if (name === "res") item.attach = res;
              else if (name === "nex") item.attach = next;
              else if (name === "ip") {
                const ip = await ipDetector(req, false);
                item.attach = ip.ip;
              } else if (name === "geoip") {
                const geoip = await ipDetector(req, true);
                // eslint-disable-next-line require-atomic-updates
                req.geoip = geoip;
                item.attach = geoip;
              } else if (name === "param") {
                if (item?.args?.length > 0) {
                  let arglen = item?.args?.length as number;
                  const params: { [key: string]: unknown } = {};
                  while (arglen--) {
                    const argIndex = item?.args[Number(arglen)];
                    params[String(argIndex)] =
                      req.params?.[String(argIndex)] || "";
                  }

                  item.attach = params;
                } else item.attach = req.params || {};
              }

              metadata.props[parseInt(i)] = item;
            }

            Reflect.defineMetadata(
              METADATA_PROP_INDEX,
              [metadata],
              some?.target,
              key,
            );
            next();
          },
          requestWrapper((...data: any[]) =>
            controller[`${key}`](
              ...data,
              ...Array(routeMetadata[0]?.props?.length).fill(""),
            ),
          ),
          ...midls(options?.useNext),
          NextHandler,
        );
      }

      const baseEndpoint = join("/", _basePath).replace(/\\/g, "/");

      APP.use(baseEndpoint, controllerRouter);

      return null;
    },
  );

  return APP;
};
