from __future__ import annotations

import os
import string
import urllib
import uuid
import pickle
import datetime
import time
import shutil
import pytz
import csv

import cv2
from fastapi import FastAPI, File, UploadFile, Form, UploadFile, Response
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import face_recognition
import starlette


ATTENDANCE_LOG_DIR = './logs'
DB_PATH = './db'
LOGIN_DIR = './login'
for dir_ in [ATTENDANCE_LOG_DIR, DB_PATH, LOGIN_DIR]:
    if not os.path.exists(dir_):
        os.mkdir(dir_)

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_login_status_csv():
    # Get the current date
    local_timezone = pytz.timezone('Asia/Kolkata')
    current_datetime = datetime.datetime.now(local_timezone)
    formatted_date = current_datetime.strftime("%Y-%m-%d")

    # Generate the CSV file name for the current date
    return os.path.join(ATTENDANCE_LOG_DIR, f"{formatted_date}.csv")

# Dictionary to store logged-in users and their login status
logged_in_users = {}

# Load the logged-in user information from the CSV file
LOGIN_STATUS_CSV = get_login_status_csv()
if os.path.exists(LOGIN_STATUS_CSV):
    with open(LOGIN_STATUS_CSV, newline='') as csvfile:
        reader = csv.reader(csvfile)
        for row in reader:
            email_id, login_time, is_logged_in = row
            # Convert the is_logged_in value to a boolean
            logged_in_users[email_id] = is_logged_in == "IN"

def user_already_registered(email: str) -> bool:
    csv_file_path = os.path.join(DB_PATH, 'user_details.csv')
    if os.path.exists(csv_file_path):
        with open(csv_file_path, 'r') as csv_file:
            reader = csv.DictReader(csv_file)
            for row in reader:
                if row['Email'].lower() == email.lower():
                    return True
    return False

@app.post("/login")
async def login(file: UploadFile = File(...)):

    file.filename = f"{LOGIN_DIR}/{uuid.uuid4()}.png"
    contents = await file.read()

    # example of how you can save the file
    with open(file.filename, "wb") as f:
        f.write(contents)

    email_id, match_status = recognize(cv2.imread(file.filename))

    if email_id in logged_in_users and logged_in_users[email_id]:
        return {"user": email_id, "message": "You are already logged in."}

    if match_status:
        logged_in_users[email_id] = True
        local_timezone = pytz.timezone('Asia/Kolkata')  
        current_datetime = datetime.datetime.now(local_timezone)
        formatted_date = current_datetime.strftime("%Y-%m-%d")
        formatted_datetime = current_datetime.strftime("%H:%M:%S")
        with open(os.path.join(ATTENDANCE_LOG_DIR, '{}.csv'.format(formatted_date)), 'a') as f:
            f.write('{},{},{}\n'.format(email_id, formatted_datetime, 'IN'))
            f.close()

    return {'user': email_id, 'match_status': match_status}


@app.post("/logout")
async def logout(email: str):

    # Check if the user is already logged in
    if not logged_in_users[email]:
        return {"user": email, "message": "User is not logged in."}
    else:
        local_timezone = pytz.timezone('Asia/Kolkata')  
        current_datetime = datetime.datetime.now(local_timezone)
        formatted_date = current_datetime.strftime("%Y-%m-%d")
        formatted_datetime = current_datetime.strftime("%H:%M:%S")

        with open(os.path.join(ATTENDANCE_LOG_DIR, '{}.csv'.format(formatted_date)), 'a') as f:
            f.write('{},{},{}\n'.format(email, formatted_datetime, 'OUT'))

        # Update the login status to indicate the user has logged out
        logged_in_users[email] = False

        return {'user': email, 'message': 'Logged out successfully.'}


@app.post("/register_new_user")
async def register_new_user(name: str,
                            email: str,
                            phone_number: str,
                            class_: str,
                            division: str,
                            file: UploadFile = File(...), 
                            ):
    
    if user_already_registered(email):
        return {'status': 400, "message": f"{email} is already registered! Proceed to login."}
    
    name = name.title()
    file.filename = f"{uuid.uuid4()}.png"
    contents = await file.read()

    # Save the image file
    with open(file.filename, "wb") as f:
        f.write(contents)

    # Copy the image to Data Base directory with a filename based on the user's name
    image_path = os.path.join(DB_PATH, '{}.png'.format(email))
    shutil.copy(file.filename, image_path)

    # Get face embeddings using face_recognition library
    embeddings = face_recognition.face_encodings(cv2.imread(file.filename))

    # Save the embeddings as a pickle file
    embeddings_path = os.path.join(DB_PATH, '{}.pickle'.format(email))
    with open(embeddings_path, 'wb') as file_:
        pickle.dump(embeddings, file_)

    # Append user details to the CSV file
    csv_file_path = os.path.join(DB_PATH, 'user_details.csv')
    is_new_file = not os.path.exists(csv_file_path)
    with open(csv_file_path, 'a', newline='') as csv_file:
        fieldnames = ['Name', 'Email', 'Phone Number', 'Class', 'Division', 'Image Path', 'Embeddings Path']
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)

        if is_new_file:
            writer.writeheader()

        writer.writerow({
            'Name': name,
            'Email': email,
            'Phone Number': phone_number,
            'Class': class_,
            'Division': division,
            'Image Path': image_path,
            'Embeddings Path': embeddings_path
        })

    # Remove the temporary image file
    os.remove(file.filename)

    return {'status': 200, "message": f"{name} registered successfully."}


@app.get("/get_attendance_logs")
async def get_attendance_logs():

    filename = 'attendance.zip'

    shutil.make_archive(filename[:-4], 'zip', ATTENDANCE_LOG_DIR)

    ##return File(filename, filename=filename, content_type="application/zip", as_attachment=True)
    return starlette.responses.FileResponse(filename, media_type='application/zip',filename=filename)

@app.get("/get_registered_users_logs")
async def get_registered_users_logs():

    db_filename = './db/user_details.csv'
    filename = 'user_details.csv'

    try:
        # Check if the file exists before proceeding
        if not os.path.exists(db_filename):
            return starlette.responses.JSONResponse(content={"message": "No registered users currently."}, status_code=200)

        # If the file exists, return it as a response
        return starlette.responses.FileResponse(db_filename, media_type='application/zip', filename=filename)

    except FileNotFoundError:
        # If the file is not found, return a custom response
        return starlette.responses.JSONResponse(content={"message": "No registered users currently."}, status_code=200)

def recognize(img):
    # it is assumed there will be at most 1 match in the db

    embeddings_unknown = face_recognition.face_encodings(img)
    if len(embeddings_unknown) == 0:
        return 'no_persons_found', False
    else:
        embeddings_unknown = embeddings_unknown[0]

    match = False
    j = 0

    db_dir = sorted([j for j in os.listdir(DB_PATH) if j.endswith('.pickle')])
    # db_dir = sorted(os.listdir(DB_PATH))    
    print(db_dir)
    while ((not match) and (j < len(db_dir))):

        path_ = os.path.join(DB_PATH, db_dir[j])

        file = open(path_, 'rb')
        embeddings = pickle.load(file)[0]

        match = face_recognition.compare_faces([embeddings], embeddings_unknown)[0]

        j += 1

    if match:
        return db_dir[j - 1][:-7], True
    else:
        return 'unknown_person', False