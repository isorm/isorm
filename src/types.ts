import { NextFunction, Request, Response, Router } from "express";

export type RequestOption = Partial<{
  validator: new () => any;
}>;

export type Methods = "get" | "post" | "put" | "patch" | "delete";

export type MiddlewareType = (
  req: Request,
  res: Response,
  next: NextFunction
) => any;

declare global {
  var _$: {
    middlewares?: MiddlewareType[];
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
      middlewares?: MiddlewareType[];
      method: Methods;
    }[];
  }[];
}

export type RequestType<T> = {
  [key: string]: any;
  atc?: object;
} & Request & {
    [K in keyof T]: T[K];
  };

export type ResponseType<T> = {
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
  req: RequestType<T>,
  res: ResponseType<T>,
  next: NextFunction
) => NextFunction | void;

export type TAttach<T> = (
  req: RequestType<T>,
  res: ResponseType<T>,
  next: NextFunction
) => Response | NextFunction | void | Promise<any>;

export interface TPlaygroundCallbackParams {
  combine: (data: object) => void;
}

export type TPlaygroundCallback = (
  params?: Partial<TPlaygroundCallbackParams>
) => void | Promise<void>;

export type GeoIpType = {
  ip: string;
  status: string;
  continent: string;
  continentCode: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  district: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  offset: number;
  currency: string;
  isp: string;
  org: string;
  as: string;
  asname: string;
  mobile: boolean;
  proxy: boolean;
  hosting: boolean;
};
