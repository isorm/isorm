import { MiddlewareType } from "../..";
import { Container } from "./deps";

export const Controller = (_path: string) => {
  return (target: any) => {
    const controller = Container.resolve(target) as any;

    const index = globalThis._$.findIndex(
      (item: { name: any; }) => item.name === controller.constructor.name,
    );

    globalThis._$[Number(index)] = {
      ...globalThis._$[Number(index)],
      basePath: _path,
      controller,
    };
  };
};

export const Middleware = (...middleware: MiddlewareType[]) => {
  return (target: any) => {
    const controller = Container.resolve(target) as any;

    const index = globalThis._$.findIndex(
      (item: { name: any; }) => item.name === controller.constructor.name,
    );

    globalThis._$[Number(index)].middlewares = middleware;
  };
};


