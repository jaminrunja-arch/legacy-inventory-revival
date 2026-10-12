const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./db');
const { checkPassword, requireLogin } = require('./auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist')));
app.use(session({
  secret: 'wis-revival-secret',
  resave: false,
  saveUninitialized: false
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user;
  res.locals.message = req.session.message;
  delete req.session.message;
  next();
});

function flash(req, type, text) {
  req.session.message = { type, text };
}

function readItemForm(body) {
  return {
    sku: (body.sku || '').trim().toUpperCase(),
    name: (body.name || '').trim(),
    qty: parseInt(body.qty, 10),
    price: parseFloat(body.price),
    reorderLevel: parseInt(body.reorder_level, 10),
    location: (body.location || '').trim().toUpperCase()
  };
}

function validateItem(item) {
  const errors = [];
  if (!item.sku) errors.push('SKU is required.');
  if (!item.name) errors.push('Name is required.');
  if (isNaN(item.qty) || item.qty < 0) errors.push('Quantity must be 0 or more.');
  if (isNaN(item.price) || item.price < 0) errors.push('Price must be 0 or more.');
  if (isNaN(item.reorderLevel) || item.reorderLevel < 0) errors.push('Reorder level must be 0 or more.');
  return errors;
}

// login

app.get('/', (req, res) => {
  res.redirect(req.session.user ? '/dashboard' : '/login');
});

app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', (req, res) => {
  const user = db.get('SELECT * FROM users WHERE username = ?', [req.body.username || '']);
  if (!user || !checkPassword(req.body.password || '', user.salt, user.password_hash)) {
    return res.render('login', { error: 'Invalid username or password.' });
  }
  req.session.user = user.username;
  res.redirect('/dashboard');
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// dashboard

app.get('/dashboard', requireLogin, (req, res) => {
  const stats = {
    itemCount: db.get('SELECT COUNT(*) AS n FROM items').n,
    totalUnits: db.get('SELECT COALESCE(SUM(qty), 0) AS n FROM items').n,
    stockValue: db.get('SELECT COALESCE(SUM(qty * price), 0) AS n FROM items').n,
    lowStock: db.get('SELECT COUNT(*) AS n FROM items WHERE qty <= reorder_level').n,
    orderCount: db.get('SELECT COUNT(*) AS n FROM orders').n
  };
  const recentOrders = db.all('SELECT * FROM orders ORDER BY id DESC LIMIT 5');
  res.render('dashboard', { stats, recentOrders });
});

// inventory

app.get('/inventory', requireLogin, (req, res) => {
  const q = (req.query.q || '').trim();
  let items;
  if (q) {
    items = db.all('SELECT * FROM items WHERE sku LIKE ? OR name LIKE ? ORDER BY sku', ['%' + q + '%', '%' + q + '%']);
  } else {
    items = db.all('SELECT * FROM items ORDER BY sku');
  }
  res.render('inventory', { items, q });
});

app.get('/inventory/new', requireLogin, (req, res) => {
  res.render('item-form', { item: { sku: '', name: '', qty: 0, price: 0, reorder_level: 10, location: '' }, errors: [], isNew: true });
});

app.post('/inventory', requireLogin, (req, res) => {
  const item = readItemForm(req.body);
  const errors = validateItem(item);
  if (db.get('SELECT id FROM items WHERE sku = ?', [item.sku])) {
    errors.push('That SKU already exists.');
  }
  if (errors.length > 0) {
    return res.render('item-form', { item: { ...req.body }, errors, isNew: true });
  }
  db.run(
    'INSERT INTO items (sku, name, qty, price, reorder_level, location) VALUES (?, ?, ?, ?, ?, ?)',
    [item.sku, item.name, item.qty, item.price, item.reorderLevel, item.location]
  );
  flash(req, 'success', `Added ${item.sku} - ${item.name}.`);
  res.redirect('/inventory');
});

app.get('/inventory/:id/edit', requireLogin, (req, res) => {
  const item = db.get('SELECT * FROM items WHERE id = ?', [req.params.id]);
  if (!item) return res.redirect('/inventory');
  res.render('item-form', { item, errors: [], isNew: false });
});

app.post('/inventory/:id', requireLogin, (req, res) => {
  const existing = db.get('SELECT * FROM items WHERE id = ?', [req.params.id]);
  if (!existing) return res.redirect('/inventory');

  const item = readItemForm(req.body);
  const errors = validateItem(item);
  const dupe = db.get('SELECT id FROM items WHERE sku = ? AND id != ?', [item.sku, existing.id]);
  if (dupe) errors.push('That SKU already exists.');
  if (errors.length > 0) {
    return res.render('item-form', { item: { ...req.body, id: existing.id }, errors, isNew: false });
  }
  db.run(
    'UPDATE items SET sku = ?, name = ?, qty = ?, price = ?, reorder_level = ?, location = ? WHERE id = ?',
    [item.sku, item.name, item.qty, item.price, item.reorderLevel, item.location, existing.id]
  );
  flash(req, 'success', `Updated ${item.sku}.`);
  res.redirect('/inventory');
});

app.post('/inventory/:id/delete', requireLogin, (req, res) => {
  const item = db.get('SELECT * FROM items WHERE id = ?', [req.params.id]);
  if (item) {
    db.run('DELETE FROM items WHERE id = ?', [item.id]);
    flash(req, 'warning', `Deleted ${item.sku} - ${item.name}.`);
  }
  res.redirect('/inventory');
});

// orders

app.get('/orders', requireLogin, (req, res) => {
  const orders = db.all(`SELECT orders.*, items.name AS item_name
    FROM orders LEFT JOIN items ON items.sku = orders.sku
    ORDER BY orders.id DESC`);
  res.render('orders', { orders });
});

app.get('/orders/new', requireLogin, (req, res) => {
  const items = db.all('SELECT * FROM items WHERE qty > 0 ORDER BY sku');
  res.render('order-form', { items, form: {}, error: null });
});

app.post('/orders', requireLogin, (req, res) => {
  const items = db.all('SELECT * FROM items WHERE qty > 0 ORDER BY sku');
  const customer = (req.body.customer || '').trim();
  const qty = parseInt(req.body.qty, 10);
  const item = db.get('SELECT * FROM items WHERE sku = ?', [req.body.sku || '']);

  let error = null;
  if (!customer) error = 'Customer name is required.';
  else if (!item) error = 'Pick an item.';
  else if (isNaN(qty) || qty < 1) error = 'Quantity must be at least 1.';
  else if (qty > item.qty) error = `Only ${item.qty} of ${item.sku} in stock.`;

  if (error) {
    return res.render('order-form', { items, form: req.body, error });
  }

  const last = db.get('SELECT MAX(CAST(order_no AS INTEGER)) AS n FROM orders').n || 0;
  const orderNo = String(last + 1).padStart(6, '0');
  const today = new Date().toISOString().substring(0, 10);
  const total = Math.round(item.price * qty * 100) / 100;

  db.run(
    'INSERT INTO orders (order_no, order_date, customer, sku, qty, unit_price, total) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [orderNo, today, customer, item.sku, qty, item.price, total]
  );
  db.run('UPDATE items SET qty = qty - ? WHERE id = ?', [qty, item.id]);

  flash(req, 'success', `Order ${orderNo} created. ${item.sku} stock is now ${item.qty - qty}.`);
  res.redirect('/orders');
});

// reports

app.get('/reports/low-stock', requireLogin, (req, res) => {
  const items = db.all(`SELECT *, (reorder_level - qty) AS short_by
    FROM items WHERE qty <= reorder_level
    ORDER BY short_by DESC`);
  res.render('low-stock', { items });
});

app.use((req, res) => {
  res.status(404).send('Page not found. <a href="/">Go home</a>');
});

db.connect().then(() => {
  app.listen(PORT, () => {
    console.log(`Warehouse Inventory System running at http://localhost:${PORT}`);
    console.log('Login with username: admin  password: admin123');
  });
});
