import { Container } from "./Container";
import { MiddlewareType } from "./types";

export const Middleware = (...middleware: MiddlewareType[]) => {
  return (target: any) => {
    const controller = Container.resolve(target) as any;

    const index = globalThis._$.findIndex(
      (item) => item.name === controller.constructor.name
    );

    globalThis._$[Number(index)].middlewares = middleware;
  };
};
