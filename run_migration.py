#!/usr/bin/env python3
"""Run the db_missing_columns.sql migration against the Supabase database."""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv(".env.local")

url = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL_LIVE")
key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY_LIVE")

if not url or not key:
    # Try backend/.env
    load_dotenv("backend/.env")
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL_LIVE")
    key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY_LIVE")

if not url or not key:
    print("ERROR: Could not find Supabase URL/Key in .env.local or backend/.env")
    sys.exit(1)

supabase = create_client(url, key)

# Read the migration SQL
with open("db_missing_columns.sql", "r") as f:
    sql = f.read()

print("Applying migration: db_missing_columns.sql")
print("SQL to execute:")
print(sql)
print()

try:
    # Use the rpc to execute raw SQL
    result = supabase.rpc("exec_sql", {"sql": sql}).execute()
    print("Migration applied successfully!")
except Exception as e:
    print(f"Migration failed: {e}")
    # Check if the constraint already exists
    try:
        check = supabase.rpc("exec_sql", {
            "sql": "SELECT constraint_name FROM information_schema.table_constraints WHERE table_name='project_progress' AND constraint_type='UNIQUE'"
        }).execute()
        print("Existing constraints:", check.data)
    except:
        pass
    sys.exit(1)