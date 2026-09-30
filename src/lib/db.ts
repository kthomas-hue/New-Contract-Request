import { promises as fs } from "fs";
import path from "path";
import { createSeedStore } from "./seed";
import type { AppStore } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

let writeQueue: Promise<void> = Promise.resolve();

export async function readStore(): Promise<AppStore> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    return JSON.parse(raw) as AppStore;
  } catch {
    const seeded = createSeedStore();
    await fs.writeFile(STORE_PATH, JSON.stringify(seeded, null, 2), "utf8");
    return seeded;
  }
}

export async function writeStore(store: AppStore): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = `${STORE_PATH}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(store, null, 2), "utf8");
    await fs.rename(tmp, STORE_PATH);
  });
  await writeQueue;
}

export async function updateStore(
  updater: (store: AppStore) => AppStore | Promise<AppStore>,
): Promise<AppStore> {
  const store = await readStore();
  const next = await updater(store);
  await writeStore(next);
  return next;
}

export async function resetStore(): Promise<AppStore> {
  const seeded = createSeedStore();
  await writeStore(seeded);
  return seeded;
}
