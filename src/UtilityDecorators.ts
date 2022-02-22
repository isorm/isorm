import { UtilityDecoratorDefiner } from "./utils/UtilityDecoratorDefiner";

export const Req = (target: any, key: string, propIndex: number) => {
  UtilityDecoratorDefiner({
    target,
    key,
    propIndex,
    name: "request",
    shortName: "req",
  });
};

export const Res = (target: any, key: string, propIndex: number) => {
  UtilityDecoratorDefiner({
    target,
    key,
    propIndex,
    name: "response",
    shortName: "res",
  });
};

export const Nex = (target: any, key: string, propIndex: number) => {
  UtilityDecoratorDefiner({
    target,
    key,
    propIndex,
    name: "next",
    shortName: "nex",
  });
};

export const Ip = (target: any, key: string, index: number) => {
  UtilityDecoratorDefiner({
    target,
    key,
    propIndex: index,
    name: "ip",
    shortName: "ip",
  });
};

export const GeoIp = (target: any, key: string, index: number) => {
  UtilityDecoratorDefiner({
    target,
    key,
    propIndex: index,
    name: "geoip",
    shortName: "geoip",
  });
};
