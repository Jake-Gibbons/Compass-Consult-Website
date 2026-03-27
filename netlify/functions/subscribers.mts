import type { Config, Context } from "@netlify/functions";
import {
  createSubscriber,
  getSubscriberById,
  listSubscribers,
  updateSubscriber,
  deleteSubscriber,
  findSubscriberByEmail,
} from "../lib/data.ts";

export default async (req: Request, context: Context) => {
  const method = req.method;
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  try {
    if (method === "GET") {
      if (id) {
        const subscriber = await getSubscriberById(id);
        if (!subscriber) {
          return Response.json({ error: "Subscriber not found" }, { status: 404 });
        }
        return Response.json(subscriber);
      }
      const subscribers = await listSubscribers();
      return Response.json(subscribers);
    }

    if (method === "POST") {
      const body = await req.json();
      const email = body.email?.trim();
      if (!email) {
        return Response.json({ error: "Email is required" }, { status: 400 });
      }

      const existing = await findSubscriberByEmail(email);
      if (existing) {
        return Response.json({ message: "Already subscribed", subscriber: existing }, { status: 200 });
      }

      const subscriber = await createSubscriber(email);
      return Response.json(subscriber, { status: 201 });
    }

    if (method === "PUT") {
      if (!id) {
        return Response.json({ error: "ID query parameter is required" }, { status: 400 });
      }
      const body = await req.json();
      const updated = await updateSubscriber(id, { email: body.email });
      if (!updated) {
        return Response.json({ error: "Subscriber not found" }, { status: 404 });
      }
      return Response.json(updated);
    }

    if (method === "DELETE") {
      if (!id) {
        return Response.json({ error: "ID query parameter is required" }, { status: 400 });
      }
      await deleteSubscriber(id);
      return new Response(null, { status: 204 });
    }

    return Response.json({ error: "Method not allowed" }, { status: 405 });
  } catch (err) {
    console.error("Subscribers API error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/subscribers",
  method: ["GET", "POST", "PUT", "DELETE"],
};
