import { Container } from "./Container";

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
