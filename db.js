const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');
const { buildDatabase } = require('./migrate');

const DB_FILE = path.join(__dirname, 'data', 'inventory.db');

let db;

async function connect() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    db = new SQL.Database(fs.readFileSync(DB_FILE));
    console.log('Loaded database from data/inventory.db');
  } else {
    console.log('No database found, migrating legacy files...');
    db = new SQL.Database();
    buildDatabase(db);
    save();
  }
}

function save() {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  fs.writeFileSync(DB_FILE, Buffer.from(db.export()));
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function get(sql, params = []) {
  return all(sql, params)[0];
}

function run(sql, params = []) {
  db.run(sql, params);
  save();
}

module.exports = { connect, all, get, run };
