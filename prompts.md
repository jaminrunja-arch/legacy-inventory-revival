# AI Prompts Used

1. Prompt: I have to bring an existing legacy platform back to life as a modern working app. Suggest a realistic legacy system from the 1990s that I can rebuild as a web app in a few days.
2. Prompt: Describe how a 1998 green screen warehouse inventory system would have stored its data, and what its main business functions would be.
3. Prompt: List the problems a 1998 flat file inventory system would have compared to a modern web app, so I can explain why it needs to be revived.
4. Prompt: Pick a tech stack for rebuilding this system that will run on any Windows or Mac computer with only Node.js installed and no database server.
5. Prompt: Break the rebuilt system into its main functions so I can plan the work and the functional decomposition.
Legacy data
6. Prompt: Create a fixed width INVENTORY.DAT file with 12 warehouse items. Use an 8 character SKU, a 30 character description, a zero padded quantity, a price with implied 2 decimals, a reorder level, and a bin location.
7. Prompt: Create a fixed width ORDERS.DAT file with 6 orders from 1998 that reference SKUs in INVENTORY.DAT.
8. Prompt: Write a LAYOUT.TXT file that documents the position and format of every field in both legacy files, in the style of a 1990s record layout.
Code
9. Prompt: Write a package.json for a Node.js app using Express 4, express-session, EJS, sql.js, and Bootstrap 5, with npm start and npm run reset scripts.
10. Prompt: Write migrate.js that reads the two fixed width legacy files by character position, converts implied decimal prices, and inserts everything into SQLite tables for users, items, and orders.
11. Prompt: Convert the all caps legacy item names to title case, but keep abbreviations like PVC, LED, IN, FT, YD, and GA in capitals.
12. Prompt: Write db.js that loads sql.js, opens data/inventory.db if it exists, runs the migration if it does not, and saves to disk after every write.
13. Prompt: Write auth.js that hashes passwords with Node's built in scrypt, checks them with timingSafeEqual, and has a requireLogin middleware.
14. Prompt: Write server.js with Express routes for login, logout, dashboard, inventory list with search, add item, edit item, delete item, order history, new order, and a low stock report.
15. Prompt: In the new order route, block the order if the customer is missing, the item does not exist, or the quantity is more than what is in stock. If it is valid, save the order with the next order number and lower the stock.
16. Prompt: Block adding or editing an item if the SKU already exists on another item.
17. Prompt: Write a shared EJS header and footer with a dark Bootstrap navbar that shows Dashboard, Inventory, Orders, Low Stock Report, the logged in user, and a Log out button.
18. Prompt: Write the EJS pages for login, dashboard, inventory, the add and edit item form, order history, the new order form, and the low stock report using plain Bootstrap tables and cards.
19. Prompt: Highlight inventory rows in yellow when the quantity is at or below the reorder level.
20. Prompt: Serve Bootstrap from node_modules instead of a CDN so the app works without internet after npm install.
21. Prompt: Make the code look like a student wrote it: no JavaDoc style headers, no decorative comment dividers, short comments only where needed.
Testing and running
22. Prompt: Give me a test checklist for every feature, including wrong password, duplicate SKU, ordering more than in stock, and restarting the server.
23. Prompt: Write a README with exact steps to clone, install, and run the app on a separate computer, plus the demo login.
24. Prompt: Write a .gitignore for this project so node_modules and the generated database are not committed.
25. Prompt: Give me the exact Command Prompt commands to run the app on Windows, and explain what to do if it says Terminate batch job.
26. Prompt: Give me the exact git commands to push this project to a new public GitHub repo under the username jaminrunja-arch.
Documentation
27. Prompt: Create a Level 0 functional decomposition showing the whole system as one process with the user, the legacy files, and the database.
28. Prompt: Create a Level 1 functional decomposition that splits the system into User Authentication, Inventory Management, Order Processing, Reporting, and Data Migration, with the sub functions under each.
29. Prompt: Create a technical design flow chart showing the startup migration path and how every request passes a login check and an input check before reaching the database.
30. Prompt: Create an operational flow chart from the user's point of view, from opening the site and logging in to using each task and logging out.
