import type { Config, Context } from "@netlify/functions";
import {
  createSubscriber,
  deleteSubscriber,
  findSubscriberByEmail,
  getSubscriberById,
} from "../lib/data.ts";
import { isPublicSubscriberMethod } from "../lib/subscribers-public.ts";

/**
 * Public surface for newsletter subscription.
 * - POST: subscribe (email)
 * - DELETE: unsubscribe by id (preferred) or email
 *
 * Admin list/read/update are intentionally unavailable on this public endpoint.
 * GET and PUT return 405 so unauthenticated callers cannot enumerate or mutate
 * the subscriber store.
 */
export default async (req: Request, _context: Context) => {
  const method = req.method;
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  const parseEmailFromRequest = async () => {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      return body.email?.trim();
    }

    if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const formData = await req.formData();
      return String(formData.get("email") || "").trim();
    }

    return "";
  };

  try {
    if (!isPublicSubscriberMethod(method)) {
      return Response.json(
        {
          code: "METHOD_NOT_ALLOWED",
          message: "Method not allowed",
        },
        {
          status: 405,
          headers: { Allow: "POST, DELETE" },
        }
      );
    }

    if (method === "POST") {
      const email = await parseEmailFromRequest();
      if (!email) {
        return Response.json(
          { code: "VALIDATION_FAILED", message: "Email is required" },
          { status: 400 }
        );
      }

      const existing = await findSubscriberByEmail(email);
      if (existing) {
        return Response.json(
          { message: "Already subscribed", subscriber: existing },
          { status: 200 }
        );
      }

      const subscriber = await createSubscriber(email);
      return Response.json({ message: "Subscribed", subscriber }, { status: 201 });
    }

    if (method === "DELETE") {
      const email = url.searchParams.get("email")?.trim();

      if (!id && !email) {
        return Response.json(
          {
            code: "VALIDATION_FAILED",
            message: "ID or email query parameter is required",
          },
          { status: 400 }
        );
      }

      if (id) {
        const subscriber = await getSubscriberById(id);
        if (!subscriber) {
          return Response.json(
            { code: "NOT_FOUND", message: "Subscriber not found" },
            { status: 404 }
          );
        }

        await deleteSubscriber(id);
        return Response.json({ message: "Unsubscribed" });
      }

      const subscriber = await findSubscriberByEmail(email || "");
      if (!subscriber) {
        return Response.json(
          { code: "NOT_FOUND", message: "Subscriber not found" },
          { status: 404 }
        );
      }

      await deleteSubscriber(subscriber.id);
      return Response.json({ message: "Unsubscribed" });
    }

    return Response.json(
      { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" },
      { status: 405, headers: { Allow: "POST, DELETE" } }
    );
  } catch (err) {
    console.error("Subscribers API error:", err);
    return Response.json(
      { code: "INTERNAL_ERROR", message: "Internal server error" },
      { status: 500 }
    );
  }
};

export const config: Config = {
  path: "/api/subscribers",
  method: ["GET", "POST", "PUT", "DELETE"],
};
