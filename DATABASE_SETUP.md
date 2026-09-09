# Shamba Direct Database Setup

This guide creates the MySQL database used by the Shamba Direct API. The
project schema is already written in `server/sql/schema.sql`; you do **not**
need to type the table definitions yourself.

## What you need

- MySQL Server 8.x (or a compatible MariaDB version) running on your computer.
- MySQL Workbench **or** the `mysql` command-line program.
- Node.js, to run the API after the database is ready.

During MySQL installation, keep note of the MySQL `root` password and use port
`3306` unless you deliberately choose another port.

## 1. Check that MySQL is running

Open PowerShell and run:

```powershell
mysql --version
```

If a version is displayed, MySQL is installed and available on your PATH. Test
the server connection:

```powershell
mysql -u root -p
```

Enter the MySQL root password when prompted. A successful connection shows a
`mysql>` prompt. Exit with:

```sql
EXIT;
```

If `mysql` is not recognized, use MySQL Workbench (described below), add the
MySQL `bin` folder to PATH, or run its executable directly. A typical Windows
location is:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" --version
```

If you cannot connect, start the **MySQL80** service from Windows Services, or
ask the person who installed MySQL for the host, port, username, and password.

## 2. Create the schema from the project file

The schema file creates a database named `shamba_direct_db`, its ten tables,
relationships, and optional starter data.

### Option A: MySQL command line (recommended)

From the project root in PowerShell, run:

```powershell
Get-Content .\server\sql\schema.sql | mysql -u root -p
```

Enter the root password when requested. `Get-Content` avoids PowerShell's
input-redirection difference from Bash, so this is the reliable Windows form.

Alternatively, connect first and run the file from the MySQL prompt. Replace
the path if your project is elsewhere:

```powershell
mysql -u root -p
```

```sql
SOURCE C:/Users/kiman/OneDrive/Desktop/Shamba-direct-webapp/server/sql/schema.sql;
```

Use forward slashes in the `SOURCE` path. The command will recreate only
missing tables and will safely update duplicate seed rows.

### Option B: MySQL Workbench

1. Open **MySQL Workbench** and open your local MySQL connection.
2. Select **File > Open SQL Script**.
3. Choose `server/sql/schema.sql` in this project.
4. Click the lightning-bolt **Execute** button (or press `Ctrl+Shift+Enter`).
5. Refresh the **Schemas** panel. You should see `shamba_direct_db`.

## 3. Verify the database

Connect to MySQL:

```powershell
mysql -u root -p
```

Then run:

```sql
USE shamba_direct_db;
SHOW TABLES;
SELECT id, full_name, role, county FROM users;
SELECT id, name, price_per_kg, quantity_kg, status FROM products;
```

You should see these tables:

```text
company_profiles     headquarters       market_prices
contact_messages     orders             products
enquiries            farmer_profiles    farmer_ratings
users
```

The last two `SELECT` statements should show the starter users and product
listings included by the schema.

## 4. Connect the Shamba Direct API

Create `server/.env` from the example file if it does not already exist:

```powershell
Copy-Item .\server\.env.example .\server\.env
```

Edit `server/.env` so it matches your MySQL installation:

```dotenv
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_actual_mysql_password
DB_NAME=shamba_direct_db
DB_PORT=3306
```

Do not commit `.env`: it contains your database password. The supplied
`.gitignore` in `server` is intended to keep it out of Git.

Install dependencies and start the API:

```powershell
Set-Location .\server
npm install
npm run dev
```

With the API running, open this address in a browser:

```text
http://localhost:5000/api/test-db
```

A successful response is similar to:

```json
{"message":"Database connected successfully!","data":[{"result":2}]}
```

## 5. Optional: use a dedicated application user

Using `root` works locally, but a separate user is safer. Log in as root and
run the following, replacing `choose_a_strong_password` before running it:

```sql
CREATE USER IF NOT EXISTS 'shamba_app'@'localhost'
  IDENTIFIED BY 'choose_a_strong_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON shamba_direct_db.*
  TO 'shamba_app'@'localhost';
FLUSH PRIVILEGES;
```

Then update `server/.env`:

```dotenv
DB_USER=shamba_app
DB_PASSWORD=choose_a_strong_password
```

## 6. Reset the local development database (optional)

This permanently deletes all local Shamba Direct data. Only run it when you
intend to start over.

```sql
DROP DATABASE shamba_direct_db;
```

Then repeat **Step 2** to rebuild tables and starter data. If you use the
dedicated user above, its database privileges remain after this reset; run the
schema import as `root` and then test the application user again.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| `mysql` is not recognized | Use MySQL Workbench, add MySQL's `bin` directory to PATH, or run `mysql.exe` by full path. |
| `Access denied for user` | Confirm `DB_USER` and `DB_PASSWORD`; try logging in with `mysql -u root -p`. |
| `ECONNREFUSED` or cannot connect | Ensure the MySQL service is running and `DB_HOST`/`DB_PORT` match the server configuration. |
| `Unknown database 'shamba_direct_db'` | Import `server/sql/schema.sql` again using Step 2. |
| API says database connection failed | Check `server/.env`, then restart `npm run dev` after saving it. |
| Port 3306 is different | Set `DB_PORT` in `server/.env` to the port shown in MySQL Workbench or MySQL configuration. |

## Database structure

`users` is the central account table. Farmer-specific information lives in
`farmer_profiles`; buyer/company information lives in `company_profiles`.
Products belong to farmers, while orders, enquiries, and ratings connect buyers,
farmers, and product listings through foreign keys. Deleting a user or product
automatically removes dependent records where the schema declares a cascade.

For the exact columns, keys, relationships, and starter records, see
`server/sql/schema.sql`.
