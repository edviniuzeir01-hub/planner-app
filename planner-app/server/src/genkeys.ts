import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();
console.log("Copiază în server/.env :\n");
console.log("VAPID_PUBLIC_KEY=" + keys.publicKey);
console.log("VAPID_PRIVATE_KEY=" + keys.privateKey);
console.log("\nȘi în client/.env pune cheia publică:\n");
console.log("VITE_VAPID_PUBLIC_KEY=" + keys.publicKey);
