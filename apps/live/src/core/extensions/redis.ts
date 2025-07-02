import { Redis } from "@hocuspocus/extension-redis";
import { OutgoingMessage } from "@hocuspocus/server";

export class CustomHocuspocusRedisExtension extends Redis {
  public broadcastToDocument(documentName: string, payload: any): Promise<number> {
    const stringPayload = typeof payload === "string" ? payload : JSON.stringify(payload);
    const message = new OutgoingMessage(documentName).writeBroadcastStateless(stringPayload);

    const emptyPrefix = Buffer.concat([Buffer.from([0])]);

    return this.pub.publishBuffer(
      // we're accessing the private method of the hocuspocus redis extension
      this["pubKey"](documentName),
      Buffer.concat([emptyPrefix, Buffer.from(message.toUint8Array())])
    );
  }
}
