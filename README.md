# AROVIA-AI-ERP-Assistant
AROVIA-AI ERP Assistant. It is a web application where a user types a business question in Natural language, an AI converts it to a database query, the database returns data, and the AI formats a human-readable answer
Technologies actually used in your project:

| Technology | Where Used | Why Used |

|---|---|---|

| TypeScript | All frontend and backend code | Safer JavaScript with type checking |

| React | Frontend UI (pages, components) | Building interactive user interface |

| Tailwind CSS | Styling (index.css + class names) | Fast, responsive design |

| ZiteJS | Full-stack framework | Connects frontend, backend, and database |

| PostgreSQL | Database (via Zite Database) | Stores all ERP data |

| Google Gemini AI | AI model (@google/generative-ai) | Converts English → SQL, and data → answers |

| Recharts | Dashboard charts | Line chart, bar chart, pie chart |

| Zod | Input/output validation | Validates API inputs and outputs |

| React Router | Page navigation | Dashboard, Chat, Database pages |

| Lucide React | Icons | Icons throughout the UI |

No authentication system is implemented. The app is publicly accessible — anyone with the URL can use it.

2. PROJECT ARCHITECTURE
Here is the actual data flow in your project:


User types question in browser

↓

ChatPage.tsx (React frontend)

↓

ask() function (typed SDK call)

↓

src/api/ask.ts (backend endpoint)

↓

Google Gemini AI (generates SQL)

↓

validateSQL() (safety check)

↓

zite.sql() (runs query on PostgreSQL)

↓

Google Gemini AI again (formats answer)

↓

JSON response back to frontend

↓

ChatBubble component shows answer

↓

User sees the result

Important: The AI is called twice per question:

First call: Convert the English question into a SQL query

Second call: Convert the raw database result into a nice English answer

3. EVERY IMPORTANT FILE EXPLAINED
🔴 src/api/ask.ts — THE MOST IMPORTANT FILE
Purpose: This is the brain of the entire project. It receives the user's question, sends it to AI, gets SQL, validates it, executes it, and returns a formatted answer.

Important functions/sections:

validateSQL(sql) — Checks if AI-generated SQL is safe (read-only)

DB_SCHEMA — The database structure sent to the AI so it knows what tables exist

execute() — The main function that runs the entire AI → SQL → Result flow

What happens inside:

Receives user's question

Builds a prompt containing the database schema + user's question

Sends it to Google Gemini AI

AI returns a SQL query

validateSQL() checks the SQL is safe (only SELECT, no DELETE/DROP)

zite.sql() runs the SQL against the database

If SQL fails, it asks AI to fix and retry once

Sends the raw data back to AI with instructions to format it nicely

Returns the answer, the SQL used, and the raw data

🔴 src/api/dashboard.ts — Dashboard Statistics
Purpose: Calculates all the numbers and chart data shown on the dashboard.

Important queries:

Counts total sales, revenue, products, low stock, employees, customers, suppliers (all in one query using subqueries)

Sales by day for the last 30 days (for the line chart)

Top 5 products by quantity sold (for the bar chart — uses JOIN through ProductsSales link table)

Sales by category (for the pie chart)

Products where stock < minimum stock (for low stock list)

🟡 src/api/manageData.ts — Database CRUD
Purpose: Handles viewing, adding, editing, and deleting records in any of the 5 tables.

How it works: Receives a table name and action (list/create/update/delete), then calls the appropriate database method.

🟡 src/pages/ChatPage.tsx — AI Chat Interface
Purpose: The chat-like UI where users type questions and see AI answers.

Important components inside:

ChatPage — Main page with input box, message list, and suggestion buttons

handleAsk(question) — Sends the question to the backend ask endpoint

ChatBubble — Displays each message (user or AI) with "Show SQL" toggle

DataTable — Shows raw data in a table below the AI answer

EmptyState — Shows suggested questions when chat is empty

🟡 src/pages/DashboardPage.tsx — Dashboard
Purpose: Shows 7 stat cards and 4 charts.

Components:

7 stat cards (Total Sales, Revenue, Products, Low Stock, Employees, Customers, Suppliers)

Line chart — sales revenue over last 30 days

Bar chart — top 5 selling products

Pie chart — sales by product category

Low stock product list

🟡 src/pages/DatabasePage.tsx — Data Management
Purpose: Lets users view all tables, search, add records, edit records, delete records.

🟢 src/App.tsx — Router Setup
Purpose: Defines the 3 pages: Dashboard (/), AI Chat (/chat), Database (/data)

🟢 src/components/Layout.tsx — Navigation Bar
Purpose: The header with "AROVIA-AI ERP" logo and navigation links

🟢 src/index.css — Theme & Styling
Purpose: Defines colors, fonts (Plus Jakarta Sans), spacing, and dark mode

4. AI FEATURE — DEEP EXPLANATION
Step-by-step flow:
1. User enters question → In ChatPage.tsx, the <Input> captures text. When user clicks Send or presses Enter, handleAsk(input) is called.

2. Frontend sends to backend → handleAsk calls ask({ question: q }) which is a typed SDK function that calls the backend endpoint.

3. Backend receives it → src/api/ask.ts — the execute function receives input.question.

4. Building the AI prompt → The backend combines DB_SCHEMA (the full database structure) with the user's question:


Database: PostgreSQL (Zite). All identifiers must be double-quoted.

Tables and columns:

"Employees" — "name", "department", "salary"...

"Products" — "productName", "price", "stock"...

"Sales" — "quantity", "totalAmount", "saleDate"...

...

Rules:

- Generate ONLY SELECT queries

- NEVER use INSERT, UPDATE, DELETE, DROP...

- Use CURRENT_DATE for date calculations

- Return ONLY the raw SQL query

User question: Which product sold the most?

5. AI generates SQL → Google Gemini reads the prompt and returns something like:


SELECT p."productName", SUM(s."quantity") AS "totalSold"

FROM "Sales" s

JOIN "ProductsSales" l ON l."salesId" = s.id

JOIN "Products" p ON p.id = l."productsId"

GROUP BY p."productName"

ORDER BY "totalSold" DESC

LIMIT 1

6. SQL is validated → validateSQL() checks:

Does it start with SELECT or WITH? ✅

Does it contain INSERT, DELETE, DROP, etc.? ❌ (blocked)

7. SQL is executed → zite.sql({ query: generatedSQL }) runs it against PostgreSQL. If it fails, the AI is asked to fix and retry once.

8. Answer is generated → The raw data is sent to AI again with a second prompt:


Based on this data, provide a clear answer.

Use ৳ for currency. Format numbers with commas.

Question: Which product sold the most?

Data: [{ productName: "Laptop", totalSold: 42 }]

9. Frontend displays → The response (answer + SQL + data) is shown as a chat bubble. User can click "Show SQL" to see the query, and a data table shows the raw results.

5. COMPLETE EXAMPLE TRACED
User asks: "Which product sold the most last month?"

Step 1 — User: Types the question in the chat input box and clicks Send.

Step 2 — Frontend (ChatPage.tsx):


const handleAsk = async (question: string) => {

setMessages(prev => [...prev, { role: 'user', content: q }]);

const res = await ask({ question: q });  // calls backend

setMessages(prev => [...prev, { role: 'assistant', content: res.answer, sql: res.sql }]);

};

Step 3 — Backend (src/api/ask.ts): Receives { question: "Which product sold the most last month?" }

Step 4 — AI Prompt: The DB_SCHEMA + question is sent to Gemini.

Step 5 — Generated SQL (example):


SELECT p."productName", SUM(s."quantity") AS "totalSold"

FROM "Sales" s

JOIN "ProductsSales" l ON l."salesId" = s.id

JOIN "Products" p ON p.id = l."productsId"

WHERE s."saleDate" >= CURRENT_DATE - INTERVAL '30 days'

GROUP BY p."productName"

ORDER BY "totalSold" DESC

LIMIT 1

Step 6 — Database: The Sales table is JOINed with Products through the ProductsSales link table. It groups by product name, sums quantities, filters last 30 days, and returns the top 1.

Step 7 — Result: [{ productName: "Laptop", totalSold: 42 }]

Step 8 — AI formats: "Laptop was the best-selling product last month with 42 units sold."

Step 9 — Frontend: The answer appears as a chat bubble. User can click "Show SQL" to see the query.

6. DATABASE ANALYSIS
Database: PostgreSQL (managed by Zite)

5 Tables with their columns:

Employees — name, department (Sales/HR/IT/Accounts), designation, salary, joiningDate, status (Active/Inactive)

→ 10 records

Products — productName, category (Computers/Peripherals/Networking/Storage/Accessories/Power), price, stock, minimumStock

→ 15 records (Laptop, Monitor, SSD, Keyboard, etc.)

Suppliers — supplierName, phone, email, outstandingAmount

→ 5 records (TechWorld Ltd., Smart IT Solutions, etc.)

Customers — customerName, phone, email

→ 15 records (ABC Corporation, XYZ Enterprises, etc.)

Sales — saleNumber (auto), quantity, unitPrice, totalAmount, saleDate

→ ~118 records over the last 60 days

Relationships (via link tables):


Products ←→ Suppliers   (which supplier provides which product)

Sales    ←→ Products    (which product was sold)

Sales    ←→ Employees   (which employee made the sale)

Sales    ←→ Customers   (which customer bought)

Important: This project uses link tables instead of traditional foreign keys. So Sales connects to Products through a ProductsSales table, not through a product_id column directly.

7. DASHBOARD EXPLANATION
| What's Shown | Source | Backend Query |

|---|---|---|

| Total Sales count | COUNT(*) FROM "Sales" | dashboard endpoint |

| Total Revenue | SUM("totalAmount") FROM "Sales" | dashboard endpoint |

| Total Products | COUNT(*) FROM "Products" | dashboard endpoint |

| Low Stock count | COUNT(*) WHERE "stock" < "minimumStock" | dashboard endpoint |

| Total Employees | COUNT(*) FROM "Employees" | dashboard endpoint |

| Total Customers | COUNT(*) FROM "Customers" | dashboard endpoint |

| Total Suppliers | COUNT(*) FROM "Suppliers" | dashboard endpoint |

| Sales Line Chart | Daily revenue for last 30 days | GROUP BY date, ORDER BY date |

| Top 5 Products Bar Chart | Top products by quantity sold | JOIN ProductsSales, GROUP BY productName |

| Sales by Category Pie Chart | Revenue per product category | JOIN ProductsSales, GROUP BY category |

| Low Stock List | Products below minimum stock | WHERE "stock" < "minimumStock" |

8. MAJOR FEATURES
Feature 1: AI Natural Language Query

How: User asks in English → AI generates SQL → Database returns data → AI formats answer

Backend: src/api/ask.ts

Frontend: ChatPage.tsx

Presentation line: "The user asks a question in plain English. The AI understands it, creates a database query, runs it, and shows the answer — all automatically."

Feature 2: Dashboard with Charts

How: SQL queries calculate aggregates → Recharts renders visualizations

Backend: src/api/dashboard.ts

Frontend: DashboardPage.tsx

Presentation line: "The dashboard gives a quick overview of the business — total sales, revenue, stock levels, and visual charts."

Feature 3: Database Management (CRUD)

How: Users can view/add/edit/delete records in any table

Backend: src/api/manageData.ts

Frontend: DatabasePage.tsx

Presentation line: "Authorized users can manage all business data directly from the app — add employees, update stock, delete old records."

Feature 4: SQL Safety Validation

How: validateSQL() blocks INSERT/DELETE/DROP etc. Only allows SELECT/WITH

Presentation line: "The system validates every AI-generated query before executing it. Only read-only queries are allowed — the AI can never modify or delete data."

Feature 5: AI Error Recovery

How: If AI-generated SQL fails, the error is sent back to AI to fix and retry once

Presentation line: "If the AI makes a mistake in the query, the system automatically asks it to fix the error and tries again."

9. API ENDPOINTS
Endpoint 1: POST /api/ask

Purpose: AI-powered question answering

Input: { "question": "Which product sold the most?" }

Processing: AI → SQL → Validate → Execute → AI formats answer

Output: { "question": "...", "sql": "SELECT...", "answer": "Laptop sold the most...", "data": [...] }

Endpoint 2: POST /api/dashboard

Purpose: Dashboard statistics and chart data

Input: {} (no input needed)

Output: { totalSalesCount, totalRevenue, totalProducts, lowStockProducts, salesLast30Days, topProducts, salesByCategory, lowStockList }

Endpoint 3: POST /api/manageData

Purpose: CRUD operations on any table

Input: { "table": "employees", "action": "list" } or { "table": "products", "action": "create", "record": {...} }

Output: { "records": [...], "success": true }

10. SECURITY ANALYSIS
✅ Implemented:

SQL injection prevention via AI — The AI generates SQL, not the user directly. The validateSQL() function blocks dangerous keywords.

Read-only enforcement — Only SELECT/WITH queries pass validation. INSERT, DELETE, DROP, ALTER, TRUNCATE, GRANT, REVOKE are all blocked.

API key protection — The Gemini API key is stored as an environment variable (ZITE_GEMINI_ACCESS_TOKEN), never exposed to the frontend.

Input validation — Zod schemas validate all API inputs.

❌ NOT implemented:

User authentication — Anyone with the URL can access the app. "Authentication is not currently implemented. In a production system, we would add login functionality."

Role-based access — No admin/user roles. "This is not implemented because the project focuses on the AI query feature."

Rate limiting — No protection against excessive AI queries. "For a production system, we would add rate limiting to control costs."

Honest viva answer: "Our project focuses on demonstrating the AI query concept. In a real production system, we would add user authentication, role-based access, and rate limiting."

