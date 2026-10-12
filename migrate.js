const fs = require('fs');
const path = require('path');
const { hashPassword } = require('./auth');

const LEGACY_DIR = path.join(__dirname, 'legacy');

function readLines(fileName) {
  const text = fs.readFileSync(path.join(LEGACY_DIR, fileName), 'utf8');
  return text.split(/\r?\n/).filter(line => line.trim() !== '');
}

// fixed width layouts come from legacy/LAYOUT.TXT
function parseInventoryLine(line) {
  return {
    sku: line.substring(0, 8).trim(),
    name: line.substring(8, 38).trim(),
    qty: parseInt(line.substring(38, 43), 10),
    price: parseInt(line.substring(43, 51), 10) / 100,
    reorderLevel: parseInt(line.substring(51, 55), 10),
    location: line.substring(55, 61).trim()
  };
}

function parseOrderLine(line) {
  const d = line.substring(6, 14);
  return {
    orderNo: line.substring(0, 6).trim(),
    orderDate: d.substring(0, 4) + '-' + d.substring(4, 6) + '-' + d.substring(6, 8),
    sku: line.substring(14, 22).trim(),
    qty: parseInt(line.substring(22, 27), 10),
    customer: line.substring(27, 52).trim()
  };
}

const KEEP_UPPER = ['PVC', 'LED', 'IN', 'FT', 'YD', 'GA'];

function toTitleCase(text) {
  return text.split(' ').map(word => {
    if (KEEP_UPPER.includes(word) || /\d/.test(word)) return word;
    return word.charAt(0) + word.slice(1).toLowerCase();
  }).join(' ');
}

function buildDatabase(db) {
  db.run(`CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    salt TEXT NOT NULL,
    password_hash TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    qty INTEGER NOT NULL,
    price REAL NOT NULL,
    reorder_level INTEGER NOT NULL,
    location TEXT
  )`);

  db.run(`CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no TEXT NOT NULL,
    order_date TEXT NOT NULL,
    customer TEXT NOT NULL,
    sku TEXT NOT NULL,
    qty INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    total REAL NOT NULL
  )`);

  const items = readLines('INVENTORY.DAT').map(parseInventoryLine);
  items.forEach(item => {
    db.run(
      'INSERT INTO items (sku, name, qty, price, reorder_level, location) VALUES (?, ?, ?, ?, ?, ?)',
      [item.sku, toTitleCase(item.name), item.qty, item.price, item.reorderLevel, item.location]
    );
  });

  const prices = {};
  items.forEach(item => { prices[item.sku] = item.price; });

  const orders = readLines('ORDERS.DAT').map(parseOrderLine);
  orders.forEach(order => {
    const unitPrice = prices[order.sku] || 0;
    db.run(
      'INSERT INTO orders (order_no, order_date, customer, sku, qty, unit_price, total) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [order.orderNo, order.orderDate, toTitleCase(order.customer), order.sku, order.qty, unitPrice, unitPrice * order.qty]
    );
  });

  const admin = hashPassword('admin123');
  db.run('INSERT INTO users (username, salt, password_hash) VALUES (?, ?, ?)', ['admin', admin.salt, admin.hash]);

  console.log(`Migrated ${items.length} inventory records and ${orders.length} orders from legacy files`);
}

module.exports = { buildDatabase, parseInventoryLine, parseOrderLine };

// running "npm run reset" wipes the database and rebuilds it from the legacy files
if (require.main === module) {
  const initSqlJs = require('sql.js');
  const dbFile = path.join(__dirname, 'data', 'inventory.db');

  initSqlJs().then(SQL => {
    if (fs.existsSync(dbFile)) {
      fs.unlinkSync(dbFile);
    }
    const db = new SQL.Database();
    buildDatabase(db);
    fs.mkdirSync(path.dirname(dbFile), { recursive: true });
    fs.writeFileSync(dbFile, Buffer.from(db.export()));
    console.log('Database reset complete');
  });
}
