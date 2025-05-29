import os
import traceback
from flask import Blueprint, render_template, request, redirect, url_for, flash, current_app, session, jsonify, g
from werkzeug.utils import secure_filename
from database import get_db, get_db_cursor
from flask_mail import Message
from extensions import mail

# Blueprint setup
apply_bp = Blueprint('apply_bp', __name__, url_prefix='/apply')

@apply_bp.route('/<int:internship_id>', methods=['GET', 'POST'])
def apply_form(internship_id):
    db_conn = get_db()
    print(f"🔍 Accessing apply_form for internship_id: {internship_id}")  # Debug route hit
    email = session.get('email')

    # Fetch first and last name from candidates table
    candidate = db_conn.execute("SELECT first_name, last_name FROM candidates WHERE email = ?", (email,)).fetchone()
    if not candidate:
        print(f"⚠️ No candidate found for email: {email}")
        return jsonify({"success": False, "error": "User not found"}), 400

    # Fetch phone and resume from student_info table
    student = db_conn.execute("SELECT phone, resume FROM student_info WHERE email = ?", (email,)).fetchone()
    if not student:
        print(f"⚠️ No student info found for email: {email}")

    if request.method == 'GET':
        return render_template('apply_now.html', internship_id=internship_id,
                              first_name=candidate['first_name'] if candidate else '',
                              last_name=candidate['last_name'] if candidate else '',
                              email=email,
                              phone=student['phone'] if student else '',
                              resume=student['resume'] if student else '')

    if request.method == 'POST':
        print("📤 Processing POST request with form data")  # Debug POST hit
        form = request.form
        files = request.files

        # Collect form data
        first_name = form.get('firstName')
        last_name = form.get('lastName')
        email = form.get('email')
        phone = form.get('phone')
        university = form.get('university')
        degree = form.get('degree')
        major = form.get('major')
        grad_year = form.get('gradYear')
        cgpa = form.get('cgpa')  # Get as string first to debug
        cgpa = float(cgpa) if cgpa and cgpa.replace('.', '').isdigit() else 0.0
        skills = form.get('skills')
        interests = form.get('interests')
        preferred_duration = form.get('duration')
        preferred_duration = int(preferred_duration) if preferred_duration and preferred_duration.isdigit() else 0
        internship_type = form.get('type')
        experience = form.get('experience')
        why_apply = form.get('whyApply')

        # Handle file uploads
        resume = files.get('resume')  # This is the new uploaded resume
        cover_letter = files.get('coverLetter')

        if not resume or not resume.filename:
            # If no resume is uploaded, return an error message
            return jsonify({"success": False, "error": "Resume is required to apply for the internship."}), 400

        # Save the uploaded resume and cover letter
        resume_filename = secure_filename(resume.filename)
        cover_letter_filename = secure_filename(cover_letter.filename) if cover_letter and cover_letter.filename else None

        upload_folder = os.path.join(current_app.root_path, 'static', 'applications')
        os.makedirs(upload_folder, exist_ok=True)
        resume.save(os.path.join(upload_folder, resume_filename))
        print(f"📄 Resume saved: {resume_filename}")

        if cover_letter_filename and cover_letter:
            cover_letter.save(os.path.join(upload_folder, cover_letter_filename))
            print(f"📄 Cover letter saved: {cover_letter_filename}")

        try:
            cursor = get_db_cursor()
            print("🚀 Attempting to insert into apply_internships")
            
            cursor.execute("""
                INSERT INTO apply_internships (
                    internship_id, first_name, last_name, email, phone, university, degree, major,
                    grad_year, cgpa, skills, interests, preferred_duration,
                    internship_type, experience, why_apply, resume, cover_letter, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                internship_id, first_name, last_name, email, phone, university, degree, major,
                grad_year, cgpa, skills, interests, preferred_duration,
                internship_type, experience, why_apply, resume_filename, cover_letter_filename, "Pending"
            ))
            db_conn.commit()
            print("✅ Insert successful, committing transaction")
             # Send email to student confirming application
            subject = f'Internship Application Confirmation for {first_name} {last_name}'
            body = f'Hello {first_name} {last_name},\n\nThank you for applying for the internship at our company. We will review your application and get back to you soon.\n\nBest regards,\nThe Internship Team'

            msg = Message(subject, recipients=[email])
            msg.body = body
            try:
                mail.send(msg)
                print(f"📧 Confirmation email sent to {email}")
            except Exception as e:
                print(f"❌ Failed to send email: {str(e)}")
            cursor.close()
            return jsonify({"success": True, "message": "Your application has been submitted successfully!"})
        except Exception as e:
            traceback.print_exc()
            db_conn.rollback()
            print(f"❌ Insert failed: {str(e)}")
            return jsonify({"success": False, "error": f"Database error: {str(e)}"})
        finally:
            if '_database' in g:  # Use the correct key from get_db
                db_conn = g.pop('_database', None)
                if db_conn is not None:
                    db_conn.close()
                    print("🔒 Database connection closed")

    return jsonify({"success": False, "error": "Invalid request method"})  # Fallback for non-GET/POST

# @apply_bp.route('/internships')
# def internships():
#     return render_template('internships.html')

@apply_bp.route('/check_application_status', methods=['GET'])
def check_application_status():
    email = request.args.get('email')
    internship_id = request.args.get('internship_id')

    if not email or not internship_id:
        return jsonify({'error': 'Missing email or internship_id'}), 400

    try:
        cursor = get_db_cursor()
        cursor.execute("""
            SELECT status, created_at 
            FROM apply_internships 
            WHERE email = ? AND internship_id = ?
        """, (email, internship_id))
        application = cursor.fetchone()
        cursor.close()

        if application:
            return jsonify({
                'hasApplied': True,
                'status': application['status'],
                'created_at': application['created_at']
            })
        return jsonify({
            'hasApplied': False
        })
    except Exception as e:
        current_app.logger.error(f"Error checking application status: {str(e)}")
        return jsonify({'error': 'Failed to check application status'}), 500