import { TAttach } from "./types";
import { _attacher } from "./utils/_attacher";
import express from "express";

export const Implementer = (
  ...routes: {
    conf: {
      method: "post" | "put" | "patch" | "delete" | "use" | "get";
      path: string;
    };
    attach: TAttach<{}>[] | TAttach<{}>;
  }[]
) => {
  const app = express.Router();
  routes.map(({ attach, conf: { method, path } }) => {
    const handler =
      attach instanceof Array
        ? attach.map((item) => _attacher(item))
        : _attacher(attach);

    app[method](path, handler);

    return null;
  });

  return app;
};
