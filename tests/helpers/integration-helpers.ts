import express from "express";
import { core } from "../../src/isorm";
import { MainControllerHelper } from "./controllers-helpers";

export class IntegrationHelpers {
  public static appInstance: express.Application;

  public static getApp() {
    if (this.appInstance) return this.appInstance;

    const app = core({
      controllers: [MainControllerHelper],
    });

    this.appInstance = app;

    return this.appInstance;
  }
}
