import { Hono } from "hono";
import { createBunWebSocket } from "hono/bun";
import type { ServerWebSocket } from "bun";
import { v4 } from "uuid";
import * as pokemon from "pokemon";
import { PROFILE, MESSAGE, PUBLISH, OFFER } from "../constants";
import { server } from "..";

type Socket = ServerWebSocket & { id: string; name: string };
type SocketMessage = { type: string; data: any, id?: string };
type Group = { [key: string]: Socket };
const { upgradeWebSocket, websocket } = createBunWebSocket();
const group: Group = {};
const topic = 'chat-room';
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
      rawWs.subscribe(topic);
      const initProfileData = {
        type: PROFILE,
        data: {
          id: uuid,
          name,
        },
      };
      rawWs.send(JSON.stringify(initProfileData));
      publishUserList()
      console.log(`WebSocket ${rawWs.id} server opened`);
    },
    onMessage(e, ws) {
      const rawWs = ws.raw as Socket;
      const { type, data, id } = JSON.parse(e.data.toString()) as SocketMessage;
      switch (type) {
        case MESSAGE:
          rawWs.send(
            JSON.stringify({
              type: MESSAGE,
              data: `Server receive '${data}' from ${group[rawWs.id].name}`
            })
          );
          break;
        case OFFER:
          console.log(`server receive offer from ${rawWs.id} to ${id}`)
          group[id as string].send(
            JSON.stringify({
              type: OFFER,
              data,
              id: rawWs.id
            })
          )
          break;
        default:
          break;
      }
    },
    onClose(e, ws) {
      const rawWs = ws.raw as Socket;
      rawWs.unsubscribe(topic);
      delete group[rawWs.id];
      publishUserList()
      console.log(
        `WebSocket ${rawWs.id} closed and unsubscribed with reason: ${e.reason}`
      );
    },
  }))
);

function publishUserList() {
  server.publish(topic,JSON.stringify({
    type: PUBLISH,
    data: Object.values(group).map(({ id, name }) => ({ id, name }))
  }))
}

export { websocket };
