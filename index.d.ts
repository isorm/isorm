import { NextFunction, Request, Response } from "express";

type Methods = "get" | "post" | "put" | "patch" | "delete";

type useNextTypeError = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => NextFunction | unknown;

export type RequestOption = Partial<{
  validator: new () => any;
  use: MiddlewareType[] | MiddlewareType;
  useAfterValidate: MiddlewareType[] | MiddlewareType | useNextTypeError;
  useNext: useNextTypeError;
}>;

type MiddlewareOptionsType = {
  runAfterValidate: boolean;
};

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

type MiddlewareType = (req: Request, res: Response, next: NextFunction) => any;

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

export type TMiddleware<T extends any> = (
  req: RequestType<T>,
  res: ResponseType<T>,
  next: NextFunction,
) => NextFunction | void;

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
