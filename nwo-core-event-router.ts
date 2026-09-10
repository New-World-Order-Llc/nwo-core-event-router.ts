import { EventEnvelopeSchema } from "beast-contracts/core";
import { publishEvent } from "../data/EventPublisher";

export class EventRouter {
  constructor(handlers) {
    this.handlers = handlers; // { domain, orchestration, data, interface }
  }

  route(envelope) {
    const valid = EventEnvelopeSchema.safeParse(envelope);
    if (!valid.success) throw new Error("Invalid event envelope");

    const { type } = valid.data;

    const handler = this.handlers[type];
    if (!handler) {
      const errorPacket = {
        id: crypto.randomUUID(),
        envelope,
        reason: `No handler for event type: ${type}`,
        rejectedAt: new Date().toISOString()
      };

      publishEvent("core.event.unroutable", errorPacket);
      throw new Error(`Unroutable event type: ${type}`);
    }

    const routedPacket = {
      id: crypto.randomUUID(),
      type,
      envelope: valid.data,
      routedAt: new Date().toISOString()
    };

    publishEvent("core.event.routed", routedPacket);

    return handler(valid.data);
  }
}
