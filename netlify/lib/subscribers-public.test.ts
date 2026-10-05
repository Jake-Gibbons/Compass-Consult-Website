import { describe, expect, it } from "vitest";
import {
  isPublicSubscriberMethod,
  PUBLIC_SUBSCRIBER_METHODS,
} from "./subscribers-public.ts";

describe("public subscribers API surface", () => {
  it("allows only POST and DELETE", () => {
    expect(PUBLIC_SUBSCRIBER_METHODS).toEqual(["POST", "DELETE"]);
    expect(isPublicSubscriberMethod("POST")).toBe(true);
    expect(isPublicSubscriberMethod("DELETE")).toBe(true);
    expect(isPublicSubscriberMethod("GET")).toBe(false);
    expect(isPublicSubscriberMethod("PUT")).toBe(false);
    expect(isPublicSubscriberMethod("PATCH")).toBe(false);
  });
});
