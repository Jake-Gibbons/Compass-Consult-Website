import { getStore } from "@netlify/blobs";

const STORE_NAME = "newsletter-subscribers";

export interface Subscriber {
  id: string;
  email: string;
  subscribedAt: string;
}

function getSubscriberStore() {
  return getStore(STORE_NAME);
}

export async function createSubscriber(
  email: string
): Promise<Subscriber> {
  const store = getSubscriberStore();
  const id = crypto.randomUUID();
  const subscriber: Subscriber = {
    id,
    email: email.toLowerCase().trim(),
    subscribedAt: new Date().toISOString(),
  };
  await store.setJSON(id, subscriber);
  return subscriber;
}

export async function getSubscriberById(
  id: string
): Promise<Subscriber | null> {
  const store = getSubscriberStore();
  const data = await store.get(id, { type: "json" });
  return (data as Subscriber) ?? null;
}

export async function listSubscribers(): Promise<Subscriber[]> {
  const store = getSubscriberStore();
  const { blobs } = await store.list();
  const subscribers: Subscriber[] = [];
  for (const blob of blobs) {
    const data = await store.get(blob.key, { type: "json" });
    if (data) {
      subscribers.push(data as Subscriber);
    }
  }
  return subscribers;
}

export async function updateSubscriber(
  id: string,
  updates: Partial<Pick<Subscriber, "email">>
): Promise<Subscriber | null> {
  const store = getSubscriberStore();
  const existing = await store.get(id, { type: "json" }) as Subscriber | null;
  if (!existing) return null;
  const updated: Subscriber = {
    ...existing,
    ...(updates.email && { email: updates.email.toLowerCase().trim() }),
  };
  await store.setJSON(id, updated);
  return updated;
}

export async function deleteSubscriber(id: string): Promise<void> {
  const store = getSubscriberStore();
  await store.delete(id);
}

export async function findSubscriberByEmail(
  email: string
): Promise<Subscriber | null> {
  const subscribers = await listSubscribers();
  const normalized = email.toLowerCase().trim();
  return subscribers.find((s) => s.email === normalized) ?? null;
}
