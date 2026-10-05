/** HTTP methods intentionally exposed on the public /api/subscribers endpoint. */
export const PUBLIC_SUBSCRIBER_METHODS = ["POST", "DELETE"] as const;

export type PublicSubscriberMethod = (typeof PUBLIC_SUBSCRIBER_METHODS)[number];

export function isPublicSubscriberMethod(method: string): method is PublicSubscriberMethod {
  return (PUBLIC_SUBSCRIBER_METHODS as readonly string[]).includes(method.toUpperCase());
}
