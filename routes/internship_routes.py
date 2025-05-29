import os
from flask import Blueprint, jsonify, request, session, current_app, render_template
from werkzeug.utils import secure_filename
from database import get_db, get_db_cursor  # Import SQLite helper

internship_bp = Blueprint('internship_bp', __name__)

@internship_bp.route('/', methods=['GET'])
def get_internships():
    if not session.get("logged_in") or session.get("role") != "recruiter":
        return jsonify({"error": "Unauthorized"}), 401

    email = session.get("email")
    db = get_db()

    # Get the company name linked to this recruiter
    company_row = db.execute(
        "SELECT company_name FROM companies WHERE contact_email = ?", (email,)
    ).fetchone()

    if not company_row:
        return jsonify([])

    company_name = company_row['company_name']

    internships = db.execute(
        "SELECT * FROM internships WHERE lower(company) = lower(?) ORDER BY created_at DESC",
        (company_name,)
    ).fetchall()

    return jsonify([dict(i) for i in internships])


# Post new internship (Recruiter Only)
@internship_bp.route('/post', methods=['POST'])
def post_internship():
    # Only recruiters are allowed to post internships
    if 'user_id' not in session or session.get('role') != 'recruiter':
        return jsonify({'error': 'Unauthorized'}), 403

    # Retrieve form data (assuming the form is submitted as multipart/form-data)
    title = request.form.get('title')
    company = request.form.get('company')
    department = request.form.get('department')
    location = request.form.get('location')
    internship_type = request.form.get('internshipType')
    start_date = request.form.get('startDate')
    end_date = request.form.get('endDate')
    duration = request.form.get('duration')
    stipend = request.form.get('stipend')
    openings = request.form.get('openings')
    deadline = request.form.get('deadline')
    description = request.form.get('description')
    skills = request.form.get('skills')

    # Handle optional company logo
    company_logo = None
    if 'companyLogo' in request.files:
        file = request.files['companyLogo']
        if file and file.filename:
            filename = secure_filename(file.filename)
            upload_folder = os.path.join(current_app.root_path, 'static', current_app.config.get('UPLOAD_FOLDER', 'uploads'))
            if not os.path.exists(upload_folder):
                os.makedirs(upload_folder)
            file.save(os.path.join(upload_folder, filename))
            company_logo = filename

    # Validate required fields
    if not all([title, company, department, location, internship_type, start_date, end_date, duration, stipend, openings, deadline, description, skills]):
        return jsonify({'error': 'Missing required fields'}), 400

    try:
        cursor = get_db_cursor()
        cursor.execute(
            """
            INSERT INTO internships 
            (title, company, department, location, internship_type, start_date, end_date, duration, stipend, openings, deadline, description, skills, company_logo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (title, company, department, location, internship_type, start_date, end_date, duration, stipend, openings, deadline, description, skills, company_logo)
        )
        get_db().commit()
    except Exception as e:
        get_db().rollback()
        return jsonify({'error': 'Failed to post internship', 'details': str(e)}), 500
    finally:
        cursor.close()

    return jsonify({'message': 'Internship posted successfully'}), 201


# ✅ Update Internship (PUT)
@internship_bp.route('/internships/<int:internship_id>', methods=['PUT'])
def update_internship(internship_id):
    if 'user_id' not in session or session.get('role') != 'recruiter':
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()
    required_fields = ['title', 'company', 'department', 'location', 'internship_type', 'start_date',
                       'end_date', 'duration', 'stipend', 'openings', 'deadline', 'description', 'skills']

    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    try:
        cursor = get_db_cursor()
        cursor.execute("""
            UPDATE internships SET 
                title = ?, company = ?, department = ?, location = ?, internship_type = ?, 
                start_date = ?, end_date = ?, duration = ?, stipend = ?, openings = ?, 
                deadline = ?, description = ?, skills = ?
            WHERE internship_id = ?
        """, (
            data['title'], data['company'], data['department'], data['location'], data['internship_type'],
            data['start_date'], data['end_date'], data['duration'], data['stipend'],
            data['openings'], data['deadline'], data['description'], data['skills'], internship_id
        ))
        get_db().commit()
        return jsonify({'message': 'Internship updated successfully'})
    except Exception as e:
        get_db().rollback()
        return jsonify({'error': 'Failed to update internship', 'details': str(e)}), 500
    finally:
        cursor.close()

# ✅ Delete Internship (DELETE)
@internship_bp.route('/internships/<int:internship_id>', methods=['DELETE'])
def delete_internship(internship_id):
    if 'user_id' not in session or session.get('role') != 'recruiter':
        return jsonify({'error': 'Unauthorized'}), 403

    try:
        cursor = get_db_cursor()
        cursor.execute("DELETE FROM internships WHERE internship_id = ?", (internship_id,))
        get_db().commit()
        return jsonify({'message': 'Internship deleted successfully'})
    except Exception as e:
        get_db().rollback()
        return jsonify({'error': 'Failed to delete internship', 'details': str(e)}), 500
    finally:
        cursor.close()

@internship_bp.route('/<int:internship_id>', methods=['GET'])
def get_internship_by_id(internship_id):
    cursor = get_db_cursor()
    cursor.execute("SELECT * FROM internships WHERE internship_id = ?", (internship_id,))
    internship = cursor.fetchone()
    if internship:
        return jsonify(dict(internship))
    return jsonify({'error': 'Internship not found'}), 404



