# Legacy Inventory Revival (WIS 2.0)

This project brings a 1998 warehouse inventory system back to life. The original Warehouse Inventory System (WIS) was a green screen terminal program that stored everything in fixed width flat files (`INVENTORY.DAT` and `ORDERS.DAT`). Those original data files are in the `legacy` folder, and the record layout is in `legacy/LAYOUT.TXT`.

WIS 2.0 reads the old flat files, migrates them into a SQLite database, and runs the same business functions as a modern web app.

## Features

- Login with hashed passwords
- Dashboard with item count, units on hand, stock value, and low stock count
- Inventory list with search, add, edit, and delete
- Order entry that checks stock and lowers the quantity on hand
- Order history (includes the original 1998 orders from the legacy file)
- Low stock report with print option
- Automatic migration of the legacy flat files on first run

## Tech used

- Node.js and Express
- SQLite through sql.js (runs inside Node, no database install needed)
- EJS templates
- Bootstrap 5 (installed through npm, no internet needed after install)

## How to run it

1. Install Node.js 18 or newer from https://nodejs.org (choose the LTS version).
2. Open a terminal and run:

```
git clone https://github.com/jaminrunja-arch/legacy-inventory-revival.git
cd legacy-inventory-revival
npm install
npm start
```

3. Open http://localhost:3000 in a browser.
4. Log in with username `admin` and password `admin123`.

The first time it starts, the terminal will say `Migrated 12 inventory records and 6 orders from legacy files`. The database is saved to `data/inventory.db`.

## Reset the data

To wipe the database and rebuild it from the legacy files, stop the server and run:

```
npm run reset
```

## Project structure

```
legacy/          original 1998 flat files and record layout
views/           EJS pages
public/          CSS
server.js        Express routes
db.js            database connection and helpers
migrate.js       reads the legacy flat files into SQLite
auth.js          password hashing and login check
prompts.md       AI prompts used to build this project
```
