from flask import Blueprint, render_template, session, redirect, url_for, flash

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    # Render the index page (templates/index.html)
    return render_template('index.html')

@main_bp.route('/login')
def login():
    # Render the login page (templates/login.html)
    return render_template('login.html')

from database import get_db

@main_bp.route('/recruiter')
def recruiter():
    if session.get('logged_in') and session.get('role') == 'recruiter':
        db_conn = get_db()
        email = session.get('email')

        # ✅ Fetch company info from companies table
        company = db_conn.execute(
            "SELECT company_name, contact_email FROM companies WHERE contact_email = ?",
            (email,)
        ).fetchone()

        # ✅ Fetch recruiter extended profile
        recruiter_info = db_conn.execute(
            "SELECT * FROM recruiter_info WHERE email = ?",
            (email,)
        ).fetchone()

        return render_template('recruiter.html', company=company, recruiter_info=recruiter_info)

    flash("Please log in first.", "warning")
    return redirect(url_for('auth_bp.login'))


# ...existing code...
