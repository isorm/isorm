import { MiddlewareType, RequestOption } from "../..";
import { METADATA_PROP_INDEX } from "../metadata";
import { DefineUnderscoreDollar } from "../utils/DefineUnderscoreDollar";
import HandleRequests from "../utils/HandleRequests";
import { PropDefiner } from "../utils/PropDefiner";

export const Get = (path: string, options?: RequestOption) => {
  return HandleRequests({
    path,
    options,
    method: "get",
  });
};

export const Put = (path: string, options?: RequestOption) => {
  return HandleRequests({
    path,
    options,
    method: "put",
  });
};

export const Patch = (path: string, options?: RequestOption) => {
  return HandleRequests({
    path,
    options,
    method: "patch",
  });
};

export const Post = (path: string, options?: RequestOption) => {
  return HandleRequests({
    path,
    options,
    method: "post",
  });
};

export const Delete = (path: string, options?: RequestOption) => {
  return HandleRequests({
    path,
    options,
    method: "delete",
  });
};

export const Ip = (target: any, key: string, index: number) => {
  PropDefiner({
    target,
    key,
    propIndex: index,
    name: "ip",
    shortName: "ip",
  });
};

export const GeoIp = (target: any, key: string, index: number) => {
  PropDefiner({
    target,
    key,
    propIndex: index,
    name: "geoip",
    shortName: "geoip",
  });
};

export const Param = (...params: unknown[]) => {
  return (target: any, key: string, index: number) => {
    PropDefiner({
      target,
      key,
      propIndex: index,
      name: "param",
      shortName: "param",
      args: params,
    });
  };
};

//! new
export const Use = (...middleware: MiddlewareType[]) => {
  DefineUnderscoreDollar();
  return (target: any, key: string, descriptor: PropertyDescriptor) => {
    let classMetadata = Reflect.getOwnMetadata(
      METADATA_PROP_INDEX,
      target,
      key,
    );

    if (!classMetadata) return;
    classMetadata = classMetadata[0];

    const index = globalThis._$.findIndex(
      (item: { name: any; }) => item.name === classMetadata.constructorName,
    );

    const indexRoute = globalThis._$[Number(index)].routes.findIndex(
      (item: { key: string; }) => item.key === key,
    );

    globalThis._$[Number(index)].routes[Number(indexRoute)].middlewares =
      middleware || [];
  };
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
