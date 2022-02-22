import { MiddlewareType, RequestType } from "./types";
import { OptionsUrlencoded } from "body-parser";
import { OptionsJson } from "body-parser";
import bodyParser from "body-parser";
import { Express, NextFunction, Request, Response } from "express";
import APP from "./appGlobal";
import { MetadataKeys } from "./utils/MetadataKeys";
import { join } from "path";
import { validator } from "./utils/Validator";
import { NextHandler } from "./utils/NextHandler";
import { detectIp } from "./utils/detectIp";

const defaultParser = {
  urlencoded: {
    extended: false,
  },
  json: {
    limit: "300kb",
  },
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

  globalThis._$.map(
    ({ routes, middlewares, controller, basePath, ...some }) => {
      if (middlewares && middlewares.length > 0) APP.use(middlewares);

      let i = routes.length;
      while (i--) {
        const { path, method, options, key } = routes[Number(i)];

        const routeMetadata = Reflect.getOwnMetadata(
          MetadataKeys.METADATA_PROP_INDEX,
          some?.target,
          key
        );

        const normalize = (path: string) => path.split(" ").join("/") ?? "/";

        const _basePath = normalize(basePath as string);
        const _path = normalize(path as string);

        let endpoint = join("/", _basePath, _path).replace(/\\/g, "/");

        endpoint = endpoint.replace(/\/:|:/g, "/:");

        APP[`${method}`]?.(
          endpoint,
          validator(options?.validator),
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
                const ip = await detectIp(req, false);
                item.attach = ip.ip;
              } else if (name === "geoip") {
                const geoip = await detectIp(req, true);
                // eslint-disable-next-line require-atomic-updates
                req.geoip = geoip;
                item.attach = geoip;
              }

              metadata.props[parseInt(i)] = item;
            }

            Reflect.defineMetadata(
              MetadataKeys.METADATA_PROP_INDEX,
              [metadata],
              some?.target,
              key
            );

            next();
          },
          (...data: any[]) =>
            controller[`${key}`](
              ...data,
              ...Array(routeMetadata[0]?.props?.length).fill("")
            ),
          NextHandler
        );
      }

      return null;
    }
  );

  return APP;
};
