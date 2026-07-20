// Validates the Firebase service account end-to-end from your machine:
//   1. reads ../../firebase-sa.json  (the file you download from Firebase console)
//   2. exchanges it for an OAuth token
//   3. sends a test notification to topic "debug_all"
// Run: node scripts/test-push.js
import { readFileSync } from "node:fs";
import { getAccessToken } from "../src/push.js";

const saPath = new URL("../../firebase-sa.json", import.meta.url);
let sa;
try {
  sa = JSON.parse(readFileSync(saPath, "utf8"));
} catch (e) {
  console.error("Cannot read firebase-sa.json at C:\\AISX\\algeria-ews\\firebase-sa.json");
  console.error("Download it: Firebase console -> Project settings -> Service accounts -> Generate new private key");
  process.exit(1);
}

console.log(`project: ${sa.project_id} · ${sa.client_email}`);
const token = await getAccessToken(sa, null);
console.log("OAuth token OK (" + token.slice(0, 12) + "…)");

const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
  method: "POST",
  headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
  body: JSON.stringify({
    message: {
      topic: "debug_all",
      notification: { title: "Rad Balek رد بالك", body: "FCM pipeline test — تجربة ناجحة" },
      data: { kind: "debug" },
    },
  }),
});
console.log(res.ok ? `FCM send OK: ${(await res.json()).name}` : `FCM send FAILED HTTP ${res.status}: ${await res.text()}`);
