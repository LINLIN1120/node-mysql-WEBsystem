const { execFileSync } = require("child_process");

const environment = "development";
const config = require("../knexfile.js")[environment];
const connection = config.connection;
const host = connection.host || "localhost";
const user = connection.user || "root";
const password = connection.password || "";
const database = connection.database;

function runSql(sql) {
  const args = ["-h", host, "-u", user];
  if (password) {
    args.push(`-p${password}`);
  } else {
    args.push("-p");
  }
  args.push("-e", sql);
  execFileSync("mysql", args, { stdio: "inherit" });
}

function ensureDatabaseAndTables() {
  runSql(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
  runSql(`USE \`${database}\`; CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, password VARCHAR(255) NOT NULL); CREATE TABLE IF NOT EXISTS tasks (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, content VARCHAR(255) NOT NULL);`);
}

module.exports = ensureDatabaseAndTables();
