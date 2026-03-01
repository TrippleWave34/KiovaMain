import * as FileSystem from "expo-file-system";

const BASE_DIR =
  FileSystem.documentDirectory ?? FileSystem.cacheDirectory;

if (!BASE_DIR) {
  throw new Error(
    "No writable directory available (documentDirectory/cacheDirectory are null)."
  );
}

const INBOX_DIR = BASE_DIR + "share-inbox/";
const INDEX_PATH = INBOX_DIR + "index.json";

type InboxEntry = {
  id: string;
  localUri: string;     // chemin interne app
  originalUri?: string; // optionnel
  createdAt: number;
  mimeType?: string;
};

async function ensureInbox() {
  const info = await FileSystem.getInfoAsync(INBOX_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(INBOX_DIR, {
      intermediates: true,
    });
  }
}

function extFromMime(mime?: string) {
  if (!mime) return "jpg";
  if (mime.includes("png")) return "png";
  if (mime.includes("heic")) return "heic";
  if (mime.includes("webp")) return "webp";
  return "jpg";
}

async function readIndex(): Promise<InboxEntry[]> {
  await ensureInbox();

  const info = await FileSystem.getInfoAsync(INDEX_PATH);
  if (!info.exists) return [];

  try {
    const raw = await FileSystem.readAsStringAsync(INDEX_PATH);
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeIndex(entries: InboxEntry[]) {
  await ensureInbox();

  await FileSystem.writeAsStringAsync(
    INDEX_PATH,
    JSON.stringify(entries, null, 2)
  );
}

/**
 * Dépose une image partagée dans l’inbox interne de l’app
 */
export async function depositSharedImage(params: {
  fromUri: string;
  mimeType?: string;
}): Promise<InboxEntry> {
  const { fromUri, mimeType } = params;

  await ensureInbox();

  const id =
    "share_" +
    Date.now() +
    "_" +
    Math.random().toString(16).slice(2);

  const ext = extFromMime(mimeType);
  const dest = `${INBOX_DIR}${id}.${ext}`;

  await FileSystem.copyAsync({
    from: fromUri,
    to: dest,
  });

  const entry: InboxEntry = {
    id,
    localUri: dest,
    originalUri: fromUri,
    createdAt: Date.now(),
    mimeType,
  };

  const index = await readIndex();
  index.unshift(entry);
  await writeIndex(index);

  return entry;
}

export async function listInbox(): Promise<InboxEntry[]> {
  return readIndex();
}

export async function clearInbox() {
  await ensureInbox();

  const index = await readIndex();

  for (const e of index) {
    try {
      await FileSystem.deleteAsync(e.localUri, {
        idempotent: true,
      });
    } catch {}
  }

  await FileSystem.deleteAsync(INDEX_PATH, {
    idempotent: true,
  });
}