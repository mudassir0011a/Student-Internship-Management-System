from flask import Blueprint, render_template, request, redirect, url_for, flash, session, current_app, jsonify
from database import get_db, get_db_cursor
from werkzeug.utils import secure_filename
import os

recruiter_bp = Blueprint('recruiter_bp', __name__)

# Existing routes (recruiter_dashboard, update_application_status, get_applications, recruiter_profile) remain unchanged

@recruiter_bp.route('/recruiter')
def recruiter_dashboard():
    if 'email' not in session or session.get('role') != 'recruiter':
        print("❌ Session check failed: email missing or role not recruiter")
        flash("Please log in as a recruiter to view the dashboard", "warning")
        return redirect(url_for('auth_bp.login'))

    email = session.get("email")
    print(f"🔍 Logged-in recruiter email from session: {email}")

    db = get_db()
    # Fetch company_name and logo_filename from companies table
    company_row = db.execute(
        "SELECT company_name, logo_filename FROM companies WHERE contact_email = ?",
        (email,)
    ).fetchone()
    
    if not company_row:
        print(f"❌ No company found for email: {email}")
        flash("⚠️ No company found for this recruiter email.", "warning")
        return render_template("recruiter.html", applications=[])

    company_name = company_row['company_name']
    logo_filename = company_row['logo_filename'] or 'default_logo.png'
    print(f"🔍 Company name found: {company_name}, Logo: {logo_filename}")

    # Fetch recruiter_info for additional profile data
    recruiter_info = db.execute(
        "SELECT company_name, location, website, email, phone, description, logo FROM recruiter_info WHERE email = ?",
        (email,)
    ).fetchone()

    logo = recruiter_info['logo'] if recruiter_info and recruiter_info['logo'] else logo_filename
    print(f"🔍 Selected logo: {logo}")

    recruiter_info_dict = dict(recruiter_info) if recruiter_info else {
        'company_name': company_name,
        'email': email,
        'location': None,
        'website': None,
        'phone': None,
        'description': None,
        'logo': logo
    }

    internship_rows = db.execute(
        "SELECT internship_id FROM internships WHERE lower(company) = lower(?)",
        (company_name,)
    ).fetchall()
    internship_ids = [row['internship_id'] for row in internship_rows]
    print(f"🔍 Internship IDs for this recruiter: {internship_ids}")

    if not internship_ids:
        print("❌ No internships found for company")
        flash("⚠️ You haven't posted any internships yet.", "info")
        return render_template(
            "recruiter.html",
            applications=[],
            company=company_name,
            recruiter_info=recruiter_info_dict
        )

    placeholders = ','.join('?' for _ in internship_ids)
    query = f"""
        SELECT a.*, 
               (a.first_name || ' ' || a.last_name) AS full_name, 
               i.title
        FROM apply_internships a
        JOIN internships i ON a.internship_id = i.internship_id
        WHERE a.internship_id IN ({placeholders})
        ORDER BY a.created_at DESC
    """
    applications = db.execute(query, internship_ids).fetchall()
    print(f"🔍 Applications fetched: {len(applications)} rows")

    return render_template(
        "recruiter.html",
        email=email,
        company=company_name,
        recruiter_info=recruiter_info_dict,
        applications=[dict(row) for row in applications]
    )

@recruiter_bp.route('/update_application_status', methods=['POST'])
def update_application_status():
    application_id = request.form.get('application_id')
    new_status = request.form.get('status')

    try:
        cursor = get_db_cursor()
        cursor.execute(
            """
            UPDATE apply_internships
            SET status = ?
            WHERE application_id = ?
            """,
            (new_status, application_id)
        )
        get_db().commit()
        flash(f"✅ Application #{application_id} updated to {new_status}.", "success")
    except Exception as e:
        print("❌ Error updating status:", e)
        get_db().rollback()
        flash("❌ Failed to update application status.", "danger")

    return redirect(url_for('recruiter_bp.recruiter_dashboard'))

@recruiter_bp.route('/api/applications', methods=['GET'])
def get_applications():
    if not session.get("logged_in") or session.get("role") != "recruiter":
        return jsonify({"error": "Unauthorized"}), 401

    email = session.get("email")
    db = get_db()

    company_row = db.execute(
        "SELECT company_name FROM companies WHERE contact_email = ?",
        (email,)
    ).fetchone()
    if not company_row:
        return jsonify([]), 200

    company_name = company_row['company_name']
    internship_rows = db.execute(
        "SELECT internship_id FROM internships WHERE lower(company) = lower(?)",
        (company_name,)
    ).fetchall()
    internship_ids = [row['internship_id'] for row in internship_rows]

    if not internship_ids:
        return jsonify([]), 200

    placeholders = ','.join('?' for _ in internship_ids)
    query = f"""
        SELECT a.application_id, a.first_name, a.last_name, 
               (a.first_name || ' ' || a.last_name) AS full_name, 
               a.email, a.resume, a.created_at, a.status, 
               i.title
        FROM apply_internships a
        JOIN internships i ON a.internship_id = i.internship_id
        WHERE a.internship_id IN ({placeholders})
        ORDER BY a.created_at DESC
    """
    applications = db.execute(query, internship_ids).fetchall()
    return jsonify([dict(row) for row in applications]), 200

@recruiter_bp.route('/api/recruiter_profile', methods=['GET', 'POST'])
def recruiter_profile():
    if not session.get("logged_in") or session.get("role") != "recruiter":
        print(f"❌ Unauthorized access: logged_in={session.get('logged_in')}, role={session.get('role')}")
        return jsonify({"error": "Unauthorized"}), 401

    email = session.get("email")
    if not email:
        print("❌ No email in session")
        return jsonify({"error": "No email in session"}), 401

    try:
        db = get_db()
        if db is None:
            print("❌ Database connection failed")
            return jsonify({"error": "Database connection failed"}), 500

        if request.method == 'POST':
            try:
                form = request.form
                company_name = form.get("company_name")
                location = form.get("location")
                website = form.get("website")
                email_form = form.get("email")
                phone = form.get("phone")
                description = form.get("description")
                logo_file = request.files.get("logo")

                if not all([company_name, location, website, email_form, phone, description]):
                    print("❌ Missing required fields in POST request")
                    return jsonify({"error": "All fields are required"}), 400

                logo_filename = None
                if logo_file and logo_file.filename != '':
                    filename = secure_filename(logo_file.filename)
                    upload_path = current_app.config.get("UPLOAD_FOLDER", "static/uploads")
                    print(f"🔍 Configured UPLOAD_FOLDER: {upload_path}")
                    os.makedirs(upload_path, exist_ok=True)
                    full_path = os.path.join(upload_path, filename)
                    try:
                        logo_file.save(full_path)
                        logo_filename = filename
                        print(f"✅ Logo saved: {full_path}")
                    except Exception as e:
                        print(f"❌ Error saving logo: {e}")
                        return jsonify({"error": f"Failed to save logo: {str(e)}"}), 500
                else:
                    print("🔍 No new logo uploaded")

                existing = db.execute(
                    "SELECT logo FROM recruiter_info WHERE email = ?",
                    (email,)
                ).fetchone()

                try:
                    if existing:
                        db.execute(
                            """
                            UPDATE recruiter_info
                            SET company_name = ?, location = ?, website = ?, phone = ?, description = ?, logo = ?
                            WHERE email = ?
                            """,
                            (
                                company_name,
                                location,
                                website,
                                phone,
                                description,
                                logo_filename or existing['logo'],
                                email
                            )
                        )
                        print(f"✅ Updated recruiter_info for {email}, logo: {logo_filename or existing['logo']}")
                    else:
                        company = db.execute(
                            "SELECT logo_filename FROM companies WHERE contact_email = ?",
                            (email,)
                        ).fetchone()
                        default_logo = company['logo_filename'] if company and company['logo_filename'] else 'default_logo.png'

                        db.execute(
                            """
                            INSERT INTO recruiter_info (company_name, location, website, email, phone, description, logo)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                            """,
                            (
                                company_name,
                                location,
                                website,
                                email,
                                phone,
                                description,
                                logo_filename or default_logo
                            )
                        )
                        print(f"✅ Inserted recruiter_info for {email}, logo: {logo_filename or default_logo}")
                    db.commit()
                except Exception as e:
                    print(f"❌ Error updating database: {e}")
                    db.rollback()
                    return jsonify({"error": f"Database error: {str(e)}"}), 500

                return jsonify({"success": True})
            except Exception as e:
                print(f"❌ Unexpected error in POST: {e}")
                return jsonify({"error": f"Unexpected error: {str(e)}"}), 500

        try:
            print(f"🔍 Fetching recruiter_info for email: {email}")
            recruiter_info = db.execute(
                "SELECT company_name, location, website, email, phone, description, logo FROM recruiter_info WHERE email = ?",
                (email,)
            ).fetchone()

            if not recruiter_info:
                print(f"🔍 No recruiter_info found for {email}, checking companies table")
                company = db.execute(
                    "SELECT company_name, logo_filename FROM companies WHERE contact_email = ?",
                    (email,)
                ).fetchone()
                if not company:
                    print(f"❌ No company found for {email}")
                    return jsonify({"error": "No company found for this recruiter"}), 404

                response_data = {
                    "company_name": company["company_name"],
                    "location": None,
                    "website": None,
                    "email": email,
                    "phone": None,
                    "description": None,
                    "logo": company["logo_filename"] or "default_logo.png"
                }
                print(f"✅ Returning company data: {response_data}")
                return jsonify(response_data)

            response_data = dict(recruiter_info)
            print(f"✅ Returning recruiter_info for {email}: {response_data}")
            return jsonify(response_data)
        except Exception as e:
            print(f"❌ Error in GET request: {e}")
            return jsonify({"error": f"Failed to fetch profile: {str(e)}"}), 500

    except Exception as e:
        print(f"❌ Unexpected error in recruiter_profile: {e}")
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500

@recruiter_bp.route('/internship_bp/internships/<int:internship_id>', methods=['GET', 'PUT', 'DELETE'])
def manage_internship(internship_id):
    if not session.get("logged_in") or session.get("role") != "recruiter":
        return jsonify({"error": "Unauthorized"}), 401

    db = get_db()
    email = session.get("email")
    company_row = db.execute(
        "SELECT company_name FROM companies WHERE contact_email = ?",
        (email,)
    ).fetchone()
    if not company_row:
        return jsonify({"error": "No company found for this recruiter"}), 404
    company_name = company_row['company_name']

    if request.method == 'GET':
        internship = db.execute(
            """
            SELECT internship_id, title, company, department, location, internship_type, 
                   start_date, end_date, duration, stipend, openings, deadline, description, skills
            FROM internships WHERE internship_id = ? AND lower(company) = lower(?)
            """,
            (internship_id, company_name)
        ).fetchone()
        if not internship:
            return jsonify({"error": "Internship not found or you do not have permission"}), 404
        return jsonify(dict(internship))

    elif request.method == 'PUT':
        try:
            data = request.get_json()
            required_fields = ['start_date', 'end_date', 'deadline', 'duration', 'stipend', 'openings', 'description', 'skills']
            if not all(field in data for field in required_fields):
                return jsonify({"error": "Missing required fields"}), 400

            # Verify internship belongs to the recruiter
            internship = db.execute(
                "SELECT internship_id FROM internships WHERE internship_id = ? AND lower(company) = lower(?)",
                (internship_id, company_name)
            ).fetchone()
            if not internship:
                return jsonify({"error": "Internship not found or you do not have permission"}), 404

            db.execute(
                """
                UPDATE internships
                SET start_date = ?, end_date = ?, deadline = ?, duration = ?, stipend = ?, 
                    openings = ?, description = ?, skills = ?
                WHERE internship_id = ?
                """,
                (
                    data['start_date'],
                    data['end_date'],
                    data['deadline'],
                    data['duration'],
                    data['stipend'],
                    data['openings'],
                    data['description'],
                    data['skills'],
                    internship_id
                )
            )
            db.commit()
            return jsonify({"success": True, "message": "Internship updated successfully"})
        except Exception as e:
            db.rollback()
            print(f"❌ Error updating internship: {e}")
            return jsonify({"error": f"Failed to update internship: {str(e)}"}), 500

    elif request.method == 'DELETE':
        try:
            internship = db.execute(
                "SELECT internship_id FROM internships WHERE internship_id = ? AND lower(company) = lower(?)",
                (internship_id, company_name)
            ).fetchone()
            if not internship:
                return jsonify({"error": "Internship not found or you do not have permission"}), 404

            db.execute("DELETE FROM internships WHERE internship_id = ?", (internship_id,))
            db.commit()
            return jsonify({"message": "Internship deleted successfully"})
        except Exception as e:
            db.rollback()
            print(f"❌ Error deleting internship: {e}")
            return jsonify({"error": f"Failed to delete internship: {str(e)}"}), 500