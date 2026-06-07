const fs = require("fs");
let c = fs.readFileSync("src/models/database.js", "utf8");
const userData = `    this.users.set("admin", {
      username: "admin",
      password: "admin123",
      role: "管理员",
      name: "系统管理员"
    });

    this.users.set("dispatcher", {
      username: "dispatcher",
      password: "dispatcher123",
      role: "调度员",
      name: "调度员王"
    });

    this.users.set("worker", {
      username: "worker",
      password: "worker123",
      role: "信号工",
      name: "工长张"
    });
`;
c = c.replace("    });\\n  }\\n\\n  createPlan", "    });\\n" + userData + "  }\\n\\n  createPlan");
fs.writeFileSync("src/models/database.js", c);
console.log("ok");
