const fs = require("fs"); let c = fs.readFileSync("src/models/database.js", "utf8"); c = c.replace("this.auditLogs = [];", "this.auditLogs = [];
    this.subscriptions = new Map();
    this.users = new Map();
    this.notifications = [];"); fs.writeFileSync("src/models/database.js", c); console.log("ok");
