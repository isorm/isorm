import axios from "axios";
import { Request } from "express";

export async function detectIp(req: Request, geo: boolean) {
  let IP = { ip: req.socket.remoteAddress };
  if (IP.ip?.includes("::1") || (IP.ip?.includes("127.0.0.1") && geo)) {
    const serviceEndpoint = "https://api.ipify.org/?format=json";
    const result = await axios.get(serviceEndpoint);
    IP = { ip: result.data?.ip || IP.ip };
  }
  if (!geo) return IP;
  const geoipEndpoint = `http://ip-api.com/json/${IP.ip}`;
  const geoip = await axios.get(geoipEndpoint);
  if ((geoip?.data?.status as string) === "success") {
    const realIp = geoip.data.query;
    delete geoip.data.query;
    delete geoip.data.status;
    IP = { ip: realIp || { ip: IP }, ...geoip.data };
  }
  return IP;
}
