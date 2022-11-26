import { Response } from "express";
import { Controller, Get, Req, Res } from "../../src/isorm";
import { Inject } from "../../src/libs/deps";
import { MainService } from "./services-helpers";

@Controller("auth")
export class MainControllerHelper {
  constructor(@Inject(MainService) private service: MainService) {}

  @Get("/")
  async main(@Res res: Response) {
    const result = await this.service.getMain();

    return res.json(result);
  }
}
