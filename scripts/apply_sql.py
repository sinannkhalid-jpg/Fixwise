import sys
import urllib.parse
import urllib.request
import json

def run_sql(db_password):
    # Construct Postgres Connection String for Supabase
    host = "db.etmekklrpduyurgpenqp.supabase.co"
    port = 5432
    user = "postgres"
    dbname = "postgres"
    
    conn_str = f"postgresql://{user}:{urllib.parse.quote(db_password)}@{host}:{port}/{dbname}"
    print(f"Connecting to Supabase Database at {host}...")
    
    try:
        # Try importing psycopg2 or pg8000
        try:
            import psycopg2
            conn = psycopg2.connect(conn_str)
            cursor = conn.cursor()
            with open("database/seed_500_incidents.sql", "r") as f:
                sql_script = f.read()
            cursor.execute(sql_script)
            conn.commit()
            print("Successfully executed SQL script! 500+ incidents and tables created in Supabase.")
            cursor.close()
            conn.close()
            return True
        except ImportError:
            print("psycopg2 not installed. Trying pg8000...")
            import pg8000.native
            conn = pg8000.native.Connection(user=user, host=host, port=port, database=dbname, password=db_password)
            with open("database/seed_500_incidents.sql", "r") as f:
                sql_script = f.read()
            conn.run(sql_script)
            print("Successfully executed SQL script! 500+ incidents and tables created in Supabase.")
            return True
    except Exception as e:
        print("Error executing SQL script:", e)
        return False

if __name__ == '__main__':
    if len(sys.argv) > 1:
        run_sql(sys.argv[1])
    else:
        print("Usage: python3 scripts/apply_sql.py YOUR_DATABASE_PASSWORD")
