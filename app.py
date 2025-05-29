from flask import Flask, request, render_template, redirect, url_for, session, flash, send_from_directory, jsonify, current_app
from config import BASE_DIR, Config
from database import db, init_tables, get_db, get_db_cursor
from routes.main import main_bp
from routes.internship_routes import internship_bp
from routes.auth_routes import auth_bp
from routes.apply_routes import apply_bp
from routes.recruiter_routes import recruiter_bp  # ✅ Make sure this exists
from flask_mail import Message
from extensions import mail

import os
import logging
from werkzeug.utils import secure_filename

app = Flask(__name__)
# Email Configuration (use your SMTP provider credentials)
app.config['MAIL_SERVER'] = 'smtp.gmail.com'  # or your email provider
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'saimrais7499@gmail.com'
app.config['MAIL_PASSWORD'] = 'zuwv uvnz toxd fbnu'
app.config['MAIL_DEFAULT_SENDER'] = 'saimrais7499@gmail.com'

mail.init_app(app)


app.config.from_object(Config)
app.secret_key = 'your_secret_key'  # Replace with a secure secret key
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
# Upload path
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['UPLOAD_FOLDER'] = os.path.join(BASE_DIR, 'static', 'uploads')
app.config['APPLICATION_UPLOAD_FOLDER'] = os.path.join(BASE_DIR, 'static', 'applications')

# Enable logging
logging.basicConfig(level=logging.ERROR)

# Log every request
@app.before_request
def log_request():
    app.logger.info("Page accessed: %s", request.path)

# Debug route to show DB path
@app.route('/debug/db-path')
def debug_db_path():
    return f"Current DB path: {current_app.config['DATABASE']}"

# Handle missing pages
@app.errorhandler(404)
def page_not_found(e):
    app.logger.warning(f"404 Error: {e}")
    return "Page not found", 404

# Serve static files manually if needed
@app.route('/static/<path:filename>')
def static_files(filename):
    try:
        return send_from_directory(os.path.join(app.root_path, 'static'), filename)
    except FileNotFoundError:
        app.logger.warning(f"Static file not found: {filename}")
        return "File not found", 404

# Initialize database
db.init_app(app)

# Register blueprints
app.register_blueprint(main_bp)
app.register_blueprint(internship_bp, url_prefix='/internship_bp')
app.register_blueprint(auth_bp, url_prefix='/auth')
app.register_blueprint(apply_bp)
app.register_blueprint(recruiter_bp)

# Setup DB on app start
with app.app_context():
    db.create_all()
    init_tables()

# -------------------- ROUTES --------------------

@app.route('/')
@app.route('/index.html')
def home():
    return render_template("index.html")

@app.route('/internships.html')
def internships():
    cursor = get_db_cursor()
    cursor.execute("SELECT * FROM internships")
    internships = cursor.fetchall()
    return render_template('internships.html', internships=[dict(row) for row in internships])
@app.route('/internships/<int:internship_id>')
def view_internship(internship_id):
    cursor = get_db_cursor()
    cursor.execute("SELECT * FROM internships WHERE internship_id = ?", (internship_id,))
    internship = cursor.fetchone()

    if internship:
        internship_dict = dict(internship)
        internship_dict.setdefault("tagline", "Exciting opportunity to learn and grow!")
        internship_dict.setdefault("responsibilities", internship_dict["description"].split('.')[:3])
        internship_dict.setdefault("logo", f"uploads/{internship_dict['company_logo']}" if internship_dict.get("company_logo") else "images/default.png")
        internship_dict.setdefault("positions", internship_dict["openings"])
        internship_dict.setdefault("type", internship_dict["internship_type"])
        return render_template('internship_roles/sample.html', internship=internship_dict)
    
    return "Internship not found", 404

@app.route('/about_us')
@app.route('/about_us.html')
def about_us():
    return render_template("about_us.html")

@app.route('/contact_us')
@app.route('/contact_us.html')
def contact_us():
    return render_template("contact_us.html")

@app.route('/dashboard')
def dashboard():
    if 'email' not in session:
        return redirect('/login')
    if session.get('logged_in') and session.get('role') == 'student':
        db_conn = get_db()
        email = session.get('email')

        candidate = db_conn.execute(
            "SELECT first_name, last_name FROM candidates WHERE email = ?", (email,)
        ).fetchone()
        fullname = f"{candidate['first_name']} {candidate['last_name']}" if candidate else ""

        student_info = db_conn.execute(
            "SELECT * FROM student_info WHERE email = ?", (email,)
        ).fetchone()

        applied = db_conn.execute("""
            SELECT a.*, i.title, i.company, i.location
            FROM apply_internships a
            JOIN internships i ON a.internship_id = i.internship_id
            WHERE a.email = ?
        """, (email,)).fetchall()

        return render_template("dashboard.html", name=fullname, email=email,
                               student_info=student_info,
                               applied_internships=[dict(row) for row in applied])
    
    elif session.get('logged_in') and session.get('role') == 'recruiter':
        return redirect(url_for('recruiter_bp.recruiter_dashboard'))

    flash("Please log in to access the dashboard.", "warning")
    return redirect(url_for('auth_bp.login'))

@app.route('/update_student_info', methods=['POST'])
def update_student_info():
    if not session.get('logged_in') or session.get('role') != 'student':
        return jsonify({'error': 'Unauthorized'}), 401

    session_email = session.get('email')
    posted_email = request.form.get('email') or session_email
    name = request.form.get('name')
    phone = request.form.get('phone')
    location = request.form.get('location')
    education = request.form.get('education')

    profile_picture = None
    resume = None
    upload_folder = os.path.join(current_app.root_path, 'static', app.config['UPLOAD_FOLDER'])
    os.makedirs(upload_folder, exist_ok=True)

    if 'profile_picture' in request.files:
        file = request.files['profile_picture']
        if file and file.filename:
            filename = secure_filename(file.filename)
            file.save(os.path.join(upload_folder, filename))
            profile_picture = filename

    if 'resume' in request.files:
        file = request.files['resume']
        if file and file.filename:
            filename = secure_filename(file.filename)
            file.save(os.path.join(upload_folder, filename))
            resume = filename

    db_conn = get_db()
    existing = db_conn.execute("SELECT * FROM student_info WHERE email = ?", (session_email,)).fetchone()
    if existing:
        db_conn.execute("""
            UPDATE student_info 
            SET full_name = ?, email = ?, phone = ?, location = ?, education = ?,
                profile_picture = COALESCE(?, profile_picture),
                resume = COALESCE(?, resume)
            WHERE email = ?
        """, (name, posted_email, phone, location, education, profile_picture, resume, session_email))
    else:
        db_conn.execute("""
            INSERT INTO student_info (full_name, email, phone, location, education, profile_picture, resume)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (name, posted_email, phone, location, education, profile_picture, resume))
    db_conn.commit()
    return jsonify({'success': True, 'message': 'Your profile information has been updated.'})

@app.route('/login.html')
def login_html():
    return redirect(url_for('main.login'))

@app.route('/api/check_login_status', methods=['GET'])
def check_login_status():
    if 'logged_in' in session and session['logged_in']:
        role = session.get('role', 'unknown')
        dashboard_url = '/dashboard' if role == 'student' else '/recruiter'
        return jsonify({
            'logged_in': True,
            'role': role,
            'dashboard_url': dashboard_url,
            'email': session.get('email')  # Add email to the response
        })
    return jsonify({'logged_in': False})

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully'}), 200

@app.route('/apply/internship.html')
def apply_internship_html():
    return redirect(url_for('apply_bp.apply_form', internship_id=1))

@app.route('/recruiter')
def recruiter():
    if 'email' not in session:
        return redirect('/login')
    if session.get('logged_in') and session.get('role') == 'recruiter':
        db_conn = get_db()
        email = session.get('email')
    return redirect(url_for('recruiter_bp.recruiter_dashboard'))


# Optional: Simple direct role page routes
@app.route('/internship_roles/<role>')
def role_page(role):
    try:
        return render_template(f"internship_roles/{role}.html")
    except:
        return "Page not found", 404
    
@app.route('/resume-builder/index.html')
def serve_resume_builder():
    return send_from_directory(os.path.join(app.root_path, 'resume-builder'), 'index.html')

@app.route('/resume-builder/<path:filename>')
def serve_resume_builder_files(filename):
    try:
        return send_from_directory(os.path.join(app.root_path, 'resume-builder'), filename)
    except FileNotFoundError:
        app.logger.warning(f"Resume builder file not found: {filename}")
        return jsonify({'error': 'File not found'}), 404



# Run the app
if __name__ == '__main__':
    app.run(debug=True)
