from flask import Blueprint, request, jsonify, session, render_template, redirect, url_for, flash, current_app
import re
import sqlite3
import os
from database import get_db, get_db_cursor, insert_candidate, insert_company, db  # Import SQLite helper and insert functions
from werkzeug.utils import secure_filename
from sqlalchemy import text
from flask_mail import Message
from extensions import mail


auth_bp = Blueprint('auth_bp', __name__)

# Signup Route
@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.json
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role')

    # Password Validation
    if not re.match(r'^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$', password):
        return jsonify({'error': 'Password must be at least 8 characters, include 1 number & 1 special character'}), 400

    try:
        cursor = get_db_cursor()
        cursor.execute(
            "INSERT INTO users (first_name, last_name, email, password, role) VALUES (?, ?, ?, ?, ?)", 
            (first_name, last_name, email, password, role)
        )
        get_db().commit()
        cursor.close()
        return jsonify({'message': 'User registered successfully'}), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Email already registered'}), 400
    except Exception as e:
        current_app.logger.error(f"Unexpected error during signup: {str(e)}", exc_info=True)
        return jsonify({'error': 'An unexpected error occurred'}), 500

# Login Route
@auth_bp.route('/login', methods=["GET", "POST"], endpoint="login")
def login():
    if request.method == "POST":
        email = request.form.get('email')
        password = request.form.get('password')
        role = request.form.get('role')

        try:
            cursor = get_db_cursor()
            if role == "student":
                cursor.execute(
                    "SELECT candidate_id AS id, first_name FROM candidates WHERE email = ? AND password = ?",
                    (email, password)
                )
                # Save email in session for profile lookup
                session['email'] = email
            elif role == "recruiter":
                cursor.execute(
                    "SELECT company_id AS id, company_name FROM companies WHERE contact_email = ? AND password = ?",
                    (email, password)
                )
                session['email'] = email  # ✅ Make sure this line is present here too
                print(f"✅ Recruiter logged in with email: {email}")

            else:
                return jsonify({"error": "Invalid role selected"}), 400

            user = cursor.fetchone()
            if user:
                session['user_id'] = user['id']
                session['role'] = role
                session['name'] = user['first_name'] if role == "student" else user['company_name']
                session['logged_in'] = True
                redirect_url = url_for("dashboard" if role == "student" else "main.recruiter")
                return jsonify({"redirect": redirect_url}), 200
            else:
                return jsonify({"error": "Invalid email or password"}), 401
        except Exception as e:
            current_app.logger.error(f"Unexpected error during login: {str(e)}", exc_info=True)
            return jsonify({"error": "An unexpected error occurred"}), 500
        finally:
            cursor.close()

    return render_template("login.html")

# Logout Route
@auth_bp.route('/logout', methods=['GET'])
def logout():
    session.clear()
    flash("You have been logged out.", "info")
    return redirect(url_for('main.login'))

# New GET routes for Signup pages with explicit endpoints
@auth_bp.route('/candidate_signup', methods=['GET'], endpoint='candidate_signup_get')
def candidate_signup_get():
    return render_template('candidate_signup.html')  # Ensure this template exists

@auth_bp.route('/candidate/signup', methods=['GET', 'POST'])
def candidate_signup():
    if request.method == 'GET':
        return render_template('candidate_signup.html')

    try:
        first_name = request.form.get('firstName')
        last_name = request.form.get('lastName')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirmPassword')

        if not all([first_name, last_name, email, password, confirm_password]):
            return jsonify({'error': 'Missing required fields'}), 400

        if password != confirm_password:
            return jsonify({'error': 'Passwords do not match'}), 400

        query = text("""
            INSERT INTO candidates (first_name, last_name, email, password)
            VALUES (:first_name, :last_name, :email, :password)
        """)
        db.session.execute(query, {
            'first_name': first_name,
            'last_name': last_name,
            'email': email,
            'password': password
        })

        db.session.commit()

        # ✅ Send welcome email
        msg = Message(
            subject="Welcome to InternshipHub 🎉",
            recipients=[email],
            body=f"""Hello {first_name},

Thank you for signing up at InternshipHub!

We're excited to have you on board. You can now start exploring internships that match your profile.

Good luck!

- The InternshipHub Team
"""
        )
        mail.send(msg)

        return jsonify({'message': 'Candidate registered successfully'}), 201

    except Exception as e:
        print(f"Error inserting candidate: {e}")
        return jsonify({'error': 'Failed to register candidate'}), 500
@auth_bp.route('/company_signup', methods=['GET'], endpoint='company_signup_get')
def company_signup_get():
    return render_template('company_signup.html')  # Ensure this template exists

# Define company signup route with a consistent endpoint
@auth_bp.route('/company/signup', methods=['GET', 'POST'])
def company_signup():
    if request.method == 'GET':
        return render_template('company_signup.html')
    try:
        company_name = request.form.get('companyName')
        email = request.form.get('companyEmail')            # already in use
        password = request.form.get('password')
        phone = request.form.get('contactNumber')            # already in use
        industry = request.form.get('industryType')          # must match HTML field name
        description = request.form.get('companyDescription')
        logo_file = request.files.get('companyLogo')         # must match HTML field name

        # Validate required fields for industry and logo
        missing_fields = []
        if not company_name:
            missing_fields.append("companyName")
        if not email:
            missing_fields.append("companyEmail")
        if not password:
            missing_fields.append("password")
        if not phone:
            missing_fields.append("contactNumber")
        if not industry:
            missing_fields.append("industryType")
        if not logo_file:
            missing_fields.append("companyLogo")
        if missing_fields:
            error_msg = f"Missing required fields: {', '.join(missing_fields)}"
            print(error_msg)
            return jsonify({'error': error_msg}), 400

        filename = secure_filename(logo_file.filename)
        if filename == '':
            return jsonify({'error': 'Invalid logo file'}), 400

        upload_folder = current_app.config.get('UPLOAD_FOLDER', r'e:\projects\a\static\uploads')
        logo_file.save(os.path.join(upload_folder, filename))

        query = text("""
            INSERT INTO companies (company_name, contact_email, password, contact_number, industry_type, logo_filename, company_description)
            VALUES (:company_name, :contact_email, :password, :contact_number, :industry_type, :logo_filename, :company_description)
        """)
        db.session.execute(query, {
            'company_name': company_name,
            'contact_email': email,
            'password': password,
            'contact_number': phone,
            'industry_type': industry,
            'logo_filename': filename,
            'company_description': description
        })
        db.session.commit()
        # Send a welcome email to the company
        msg = Message(
            subject="Welcome to InternshipHub 🎉",
            recipients=[email],
            body=f"""Hello {company_name},

Thank you for signing up at InternshipHub!

We're excited to have you on board. You can now start posting internship opportunities and connect with talented students.

Good luck!

- The InternshipHub Team
"""
        )
        mail.send(msg)
        return jsonify({'message': 'Company registered successfully'}), 201
    except Exception as e:
        print(f"Error inserting company: {e}")
        return jsonify({'error': 'Failed to register company'}), 500
    
@auth_bp.route('/update_password', methods=['POST'])
def update_password():
    if 'email' not in session:
        return jsonify({'error': 'Unauthorized. Please log in again.'}), 401

    email = session['email']
    current_password = request.form.get('current_password')
    new_password = request.form.get('new_password')
    confirm_password = request.form.get('confirm_password')

    # Check if any field is missing
    if not all([current_password, new_password, confirm_password]):
        return jsonify({'error': 'All fields are required'}), 400

    # Validate new password constraints
    password_regex = r'^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$'
    if not re.match(password_regex, new_password):
        return jsonify({'error': 'New password must be at least 8 characters and include 1 uppercase letter, 1 number, and 1 special symbol'}), 400

    if new_password != confirm_password:
        return jsonify({'error': 'New password and confirm password do not match'}), 400

    try:
        cursor = get_db_cursor()
        cursor.execute("SELECT password FROM candidates WHERE email = ?", (email,))
        row = cursor.fetchone()

        if not row:
            return jsonify({'error': 'User not found'}), 404

        if row['password'] != current_password:
            return jsonify({'error': 'Current password is incorrect'}), 400

        cursor.execute("UPDATE candidates SET password = ? WHERE email = ?", (new_password, email))
        get_db().commit()
        return jsonify({'message': 'Password updated successfully'}), 200

    except Exception as e:
        current_app.logger.error(f"Password update error: {e}")
        return jsonify({'error': 'An error occurred while updating the password'}), 500

@auth_bp.route('/update_password_company', methods=['POST'])
def update_password_company():
    if 'email' not in session:
        return jsonify({'error': 'Unauthorized. Please log in again.'}), 401

    email = session['email']
    current_password = request.form.get('current_password')
    new_password = request.form.get('new_password')
    confirm_password = request.form.get('confirm_password')

    # Check if any field is missing
    if not all([current_password, new_password, confirm_password]):
        return jsonify({'error': 'All fields are required'}), 400

    # Validate new password constraints
    password_regex = r'^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$'
    if not re.match(password_regex, new_password):
        return jsonify({'error': 'New password must be at least 8 characters and include 1 uppercase letter, 1 number, and 1 special symbol'}), 400

    if new_password != confirm_password:
        return jsonify({'error': 'New password and confirm password do not match'}), 400

    try:
        cursor = get_db_cursor()
        cursor.execute("SELECT password FROM companies WHERE contact_email = ?", (email,))
        row = cursor.fetchone()

        if not row:
            return jsonify({'error': 'User not found'}), 404

        if row['password'] != current_password:
            return jsonify({'error': 'Current password is incorrect'}), 400

        cursor.execute("UPDATE companies SET password = ? WHERE contact_email = ?", (new_password, email))
        get_db().commit()
        return jsonify({'message': 'Password updated successfully'}), 200

    except Exception as e:
        current_app.logger.error(f"Password update error: {e}")
        return jsonify({'error': 'An error occurred while updating the password'}), 500