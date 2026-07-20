// Direct emergency FCM to a device token (from devtoken.txt) — proves the
// full delivery path + emergency channel. node send-to-token.mjs
import { readFileSync } from "node:fs";
import { getAccessToken } from "../src/push.js";

const sa = JSON.parse(readFileSync(new URL("../../firebase-sa.json", import.meta.url), "utf8"));
const token = readFileSync(new URL("../../devtoken.txt", import.meta.url), "utf8").trim();
const at = await getAccessToken(sa, null);

const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
  method: "POST",
  headers: { authorization: `Bearer ${at}`, "content-type": "application/json" },
  body: JSON.stringify({
    message: {
      token,
      notification: { title: "🔴 Alerte rouge — رد بالك", body: "TEST urgence · sonne même en silencieux" },
      data: { kind: "debug", color: "red" },
      android: {
        priority: "HIGH",
        notification: { channel_id: "emergency_s1", sound: "default", notification_priority: "PRIORITY_MAX" },
      },
    },
  }),
});
console.log(res.ok ? `OK: ${(await res.json()).name}` : `FAIL ${res.status}: ${await res.text()}`);
