const fs=require("fs"); const c=fs.readFileSync("src/models/database.js","utf8"); console.log("lines:", c.split("
").length); console.log("has subscriptions:", c.includes("subscriptions")); console.log("has users:", c.includes("users"));
