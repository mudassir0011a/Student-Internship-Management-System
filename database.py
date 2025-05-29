import sqlite3
from flask import current_app, g
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def get_db():
    if '_database' not in g:  # Use '_database' as the key
        db_path = current_app.config['DATABASE']
        print("📦 Connecting to DB at:", db_path)
        g._database = sqlite3.connect(db_path)
        g._database.row_factory = sqlite3.Row
    return g._database

def get_db_cursor():
    return get_db().cursor()

def close_db(e=None):
    db = g.pop('_database', None)  # Match the key used in get_db
    if db is not None:
        db.close()
        print("🔒 Database connection closed")

def init_tables():
    db_conn = get_db()
    with db_conn:
        # ... (existing table creation code)
        print("Tables initialized or verified.")

# ... (rest of the functions)
        db_conn.execute("""
            CREATE TABLE IF NOT EXISTS candidates (
                candidate_id INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        db_conn.execute("""
            CREATE TABLE IF NOT EXISTS companies (
                company_id INTEGER PRIMARY KEY AUTOINCREMENT,
                company_name TEXT NOT NULL,
                contact_email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                contact_number TEXT,
                industry_type TEXT,
                logo_filename TEXT,
                company_description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        db_conn.execute("""
            CREATE TABLE IF NOT EXISTS student_info (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                full_name TEXT,
                email TEXT UNIQUE,
                phone TEXT,
                location TEXT,
                education TEXT,
                profile_picture TEXT,
                resume TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        db_conn.execute("""
            CREATE TABLE IF NOT EXISTS recruiter_info (
                recruiter_id INTEGER PRIMARY KEY AUTOINCREMENT,
                company_name TEXT NOT NULL,
                location TEXT,
                website TEXT,
                email TEXT UNIQUE NOT NULL,
                phone TEXT,
                description TEXT,
                logo TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        db_conn.execute("""
            CREATE TABLE IF NOT EXISTS internships (
                internship_id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                company TEXT NOT NULL,
                department TEXT NOT NULL,
                location TEXT NOT NULL,
                internship_type TEXT NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                duration INTEGER NOT NULL,
                stipend INTEGER NOT NULL,
                openings INTEGER NOT NULL,
                deadline DATE NOT NULL,
                description TEXT NOT NULL,
                skills TEXT NOT NULL,
                company_logo TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        db_conn.execute("""
            CREATE TABLE IF NOT EXISTS apply_internships (
                application_id INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT NOT NULL,
                university TEXT NOT NULL,
                degree TEXT NOT NULL,
                major TEXT NOT NULL,
                grad_year TEXT NOT NULL,
                cgpa REAL NOT NULL,
                skills TEXT NOT NULL,
                interests TEXT,
                preferred_duration INTEGER NOT NULL,
                internship_type TEXT NOT NULL,
                experience TEXT,
                why_apply TEXT NOT NULL,
                resume TEXT,
                cover_letter TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        print("Tables initialized or verified.")

# Function to insert a candidate record
def insert_candidate(first_name, last_name, email, password):
    db_conn = get_db()
    with db_conn:
        db_conn.execute(
            "INSERT INTO candidates (first_name, last_name, email, password) VALUES (?, ?, ?, ?)",
            (first_name, last_name, email, password)
        )
    print("Candidate inserted:", email)

# Function to retrieve a candidate by email
def get_candidate_by_email(email):
    # Example using SQLAlchemy; adjust as necessary for your project
    return Candidate.query.filter_by(email=email).first()

# Function to insert a company record
def insert_company(company_name, contact_email, password, contact_number, industry_type, logo_filename, company_description):
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            """
            INSERT INTO companies (company_name, contact_email, password, contact_number, industry_type, logo_filename, company_description)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (company_name, contact_email, password, contact_number, industry_type, logo_filename, company_description)
        )
        db.commit()
        cursor.close()
        print(f"Company inserted successfully: {company_name}, {contact_email}")
    except sqlite3.Error as e:
        print(f"Error inserting company: {e}")
        raise

# Function to retrieve a company by email
def get_company_by_email(contact_email):
    db_conn = get_db()
    return db_conn.execute(
        "SELECT * FROM companies WHERE contact_email = ?",
        (contact_email,)
    ).fetchone()

if __name__ == "__main__":
    from flask import Flask
    import os
    app = Flask(__name__)
    # Use the current working directory for the database file
    database_path = os.path.join(os.getcwd(), "database.db")
    print("Using database path:", database_path)
    app.config.from_mapping(
        DATABASE=database_path
    )
    # Ensure that the directory for the database exists and is writable
    db_dir = os.path.dirname(database_path)
    if not os.path.exists(db_dir):
        os.makedirs(db_dir)
    if not os.access(db_dir, os.W_OK):
        print(f"Error: Directory {db_dir} is not writable. Check the permissions.")
        exit(1)
    with app.app_context():
        init_tables()
        print("Tables initialized.")