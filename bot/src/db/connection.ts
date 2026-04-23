import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL nao definida no ambiente.");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
