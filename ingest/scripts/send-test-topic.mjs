// Direct high-priority FCM to a topic (bypasses worker dedupe) to prove
// end-to-end delivery on the device. node send-test-topic.mjs w16_heat_red
import { readFileSync } from "node:fs";
import { getAccessToken } from "../src/fcm.js";

const topic = process.argv[2] || "w16_heat_red";
const sa = JSON.parse(readFileSync(new URL("../../firebase-sa.json", import.meta.url), "utf8"));
const token = await getAccessToken(sa, null);

const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
  method: "POST",
  headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
  body: JSON.stringify({
    message: {
      topic,
      notification: { title: "🔴 TEST — Rad Balek", body: "تجربة إشعار عاجل · Notification test" },
      data: { kind: "debug", color: "red" },
      android: {
        priority: "HIGH",
        notification: { channel_id: "emergency_s1", sound: "default", notification_priority: "PRIORITY_MAX" },
      },
    },
  }),
});
console.log(res.ok ? `sent to topic ${topic}: ${(await res.json()).name}` : `FAIL ${res.status}: ${await res.text()}`);
