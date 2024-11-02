import { Hono } from "hono";
import { createBunWebSocket } from "hono/bun";
import type { ServerWebSocket } from "bun";
import { v4 } from "uuid";
import * as pokemon from "pokemon";
import { PROFILE, MESSAGE } from "../constants";

type Socket = ServerWebSocket & { id: string; name: string };
type SocketMessage = { type: string; data: any };
type Group = { [key: string]: Socket };
const { upgradeWebSocket, websocket } = createBunWebSocket();
const group: Group = {};
export const wsRoute = new Hono().get(
  "/",
  upgradeWebSocket((_) => ({
    onOpen(_, ws) {
      const rawWs = ws.raw as Socket;
      const uuid = v4();
      const name = pokemon.random();
      rawWs.id = uuid;
      rawWs.name = name;
      group[uuid] = rawWs;
      const data = {
        type: PROFILE,
        data: {
          id: uuid,
          name,
        },
      };
      rawWs.send(JSON.stringify(data));
      console.log(`WebSocket ${rawWs.id} server opened`);
    },
    onMessage(e, ws) {
      const rawWs = ws.raw as Socket;
      const { type, data } = JSON.parse(e.data.toString()) as SocketMessage;
      switch (type) {
        case MESSAGE:
          rawWs.send(
            JSON.stringify({
              type: MESSAGE,
              data: `Server receive '${data}' from ${group[rawWs.id].name}`
            })
          );
          
          break;
        default:
          break;
      }
    },
    onClose(e, ws) {
      const rawWs = ws.raw as Socket;
      delete group[rawWs.id];
      console.log(
        `WebSocket ${rawWs.id} closed and unsubscribed with reason: ${e.reason}`
      );
    },
  }))
);

export { websocket };
