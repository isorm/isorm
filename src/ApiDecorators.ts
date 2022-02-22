import { Container } from "./Container";
import { MetadataKeys } from "./utils/MetadataKeys";
import { Methods, RequestOption } from "./types";

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
      MetadataKeys.METADATA_PROP_INDEX,
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
