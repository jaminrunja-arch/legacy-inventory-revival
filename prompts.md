# AI Prompts Used

Tool: Claude (Anthropic)

## Prompt 1: Planning

> I have an assignment where I need to bring an existing legacy platform back to life, put the code on GitHub, take screenshots, and make a document with functional decomposition, a design flow chart, and an operational flow chart. Give me directions for this.

Result: Picked a 1998 green screen warehouse inventory system as the legacy platform. Chose Node.js, Express, SQLite, and Bootstrap so it runs on any computer with only Node installed.

## Prompt 2: Building the code

> Could you write the files for me and just tell me where to paste them.

Result: Got the full project: legacy flat files with a record layout, a migration script that parses the fixed width records into SQLite, an Express server with login, inventory CRUD, order entry with stock checks, order history, a low stock report, and Bootstrap pages.

## Prompt 3: Legacy data format

> Make the legacy data look like a real 1990s system: fixed width flat files with zero padded numbers and prices with implied decimals, plus a layout file that documents each field position.

Result: `legacy/INVENTORY.DAT`, `legacy/ORDERS.DAT`, and `legacy/LAYOUT.TXT`. The migration in `migrate.js` reads each field by position.

## Prompt 4: Running on another computer

> Make sure the app runs on a separate computer with no setup besides npm install. No database server, no internet needed for styling.

Result: Used sql.js (SQLite compiled to WebAssembly) so there is no native build step, and served Bootstrap from node_modules instead of a CDN.

## Prompt 5: Testing

> Test every page: login with right and wrong password, add, edit, delete, duplicate SKU, order more than in stock, normal order, low stock report, logout.

Result: All checks passed. Order over stock is blocked, duplicate SKU is blocked, and placing an order lowers stock.

## Prompt 6: Design document

> Make the implementation document with Functional Decomposition Level 0 and Level 1, a Design Flow Chart (technical design), and an Operational Flow Chart (user point of view) for this project.

Result: Implementation document with all four diagrams.
