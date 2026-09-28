// TEMPORARY verification of the pre-load window that used to crash
// ThemeController. Deleted after the run; not part of the app.
import { getSettings, getMess } from "@/services/messService";
import { getCollection, isCollectionLoaded, loadCollection } from "@/data/memoryStore";

const fail = (m: string) => {
  console.log("FAIL " + m);
  process.exitCode = 1;
};
const pass = (m: string) => console.log("pass  " + m);

// 1. The pre-load window: nothing has been fetched yet.
if (isCollectionLoaded("settings")) fail("settings should not be loaded yet");
if (getSettings() !== null) fail("getSettings() should be null before load, got " + JSON.stringify(getSettings()));
else pass("getSettings() is null before load");
if (getMess() !== null) fail("getMess() should be null before load");
else pass("getMess() is null before load");

// 2. Exactly the expression ThemeController evaluates, pre-load.
let theme: string | undefined;
try {
  theme = getSettings()?.theme ?? "bhuri-green";
  pass("pre-load theme expression did not throw -> " + theme);
} catch (cause) {
  fail("pre-load theme expression threw: " + String(cause));
}
if (theme !== "bhuri-green") fail("pre-load theme should fall back to the default");

// 3. List collections are empty, not null, so no other read can deref null.
for (const key of ["meals", "guestMeals", "expenses", "users"] as const) {
  const rows = getCollection<unknown[]>(key);
  if (!Array.isArray(rows)) fail(key + " should be an empty array before load, got " + JSON.stringify(rows));
  else pass(key + " is [] before load (safe to filter/reduce)");
}

// 4. The document arrives, and the store subscription re-runs with it.
// The app fetches a relative URL, which needs an origin that Node does not have.
const origin = "http://127.0.0.1:3111";
const realFetch = globalThis.fetch;
globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) =>
  realFetch(new URL(String(input), origin), init)) as typeof fetch;

const main = async () => {
  const loaded = await loadCollection<{ theme?: string }>("settings");
  if (!isCollectionLoaded("settings")) fail("settings should be marked loaded");
  if (loaded?.theme !== "bhuri-green") fail("unexpected stored theme: " + JSON.stringify(loaded));
  else pass("settings loaded, stored theme is " + loaded.theme);
  if (getSettings()?.theme !== "bhuri-green") fail("post-load read should return the stored document");
  else pass("post-load getSettings()?.theme resolves the real document");
  console.log(process.exitCode ? "\nRESULT: failures above" : "\nRESULT: all checks passed");
};

void main();
