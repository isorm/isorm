import "jest";
import express from "express";
import request from "supertest";
import { IntegrationHelpers } from "../helpers/integration-helpers";

describe("status main path", () => {
  let app: express.Application;

  beforeAll(() => {
    app = IntegrationHelpers.getApp();

    app.listen(3000, () => {
      console.log("App Running");
    });
    // log(globalThis._$);
  });

  it("get main", async () => {
    await request(app)
      .get("/auth")
      .set("Accept", "application/json")
      .expect(200);
  });
});
