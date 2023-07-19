# Importing required libraries and modules
from __future__ import annotations

import os
import uuid
import pickle
import datetime
import shutil
import pytz
import csv

import cv2
from fastapi import FastAPI, File, UploadFile, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import face_recognition
import starlette


# Directories
ATTENDANCE_LOG_DIR = './logs'
DB_PATH = './db'
LOGIN_DIR = './login'
for dir_ in [ATTENDANCE_LOG_DIR, DB_PATH, LOGIN_DIR]:
    if not os.path.exists(dir_):
        os.mkdir(dir_)

# Create FastAPI app instance
app = FastAPI()

# Configure CORS Middleware to allow all origins, credentials, methods, and headers
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_login_status_csv():

    """
    Function to get the CSV file path for the current date.

    This function retrieves the current date and time in the Asia/Kolkata timezone and formats it as "YYYY-MM-DD".
    It then generates the CSV file name based on the current date and returns the complete file path.

    Returns:
    str: The complete file path of the CSV file for the current date in the ATTENDANCE_LOG_DIR directory.
    """

    # Get the current date and time in the Asia/Kolkata timezone
    local_timezone = pytz.timezone('Asia/Kolkata')
    current_datetime = datetime.datetime.now(local_timezone)

    # Format the current date as "YYYY-MM-DD"
    formatted_date = current_datetime.strftime("%Y-%m-%d")

    # Generate the CSV file name for the current date and return the complete file path
    return os.path.join(ATTENDANCE_LOG_DIR, f"{formatted_date}.csv")

def get_logged_in_users():
    logged_in_users = {}

    LOGIN_STATUS_CSV = get_login_status_csv()
    if os.path.exists(LOGIN_STATUS_CSV):
        with open(LOGIN_STATUS_CSV, newline='') as csvfile:
            reader = csv.reader(csvfile)
            for row in reader:
                email_id, login_time, is_logged_in = row
                # Convert the is_logged_in value to a boolean
                logged_in_users[email_id] = is_logged_in == "IN"

    return logged_in_users


def get_registered_users():
    registered_users = []

    USERS_CSV = r"db\user_details.csv"

    if os.path.exists(USERS_CSV):
        with open(USERS_CSV, newline='') as csvfile:
            reader = csv.reader(csvfile)
            for row in reader:
                user = {}
                name, email, phone, class_, division, _, _ = row
                # Convert the is_logged_in value to a boolean
                user["name"] = name
                user["email"] = email
                user["phone"] = phone
                user["class"] = class_
                user["division"] = division
                registered_users.append(user)

    return registered_users


@app.get("/")
async def root():
    return {'status': 200, "message": "App running successfully"}


@app.post("/login")
async def login(file: UploadFile = File(...)):
    
    """
    Endpoint for user login.

    When called with a file upload, this function processes the image, recognizes the user, and
    handles the login process. The recognized user's identity and login status are returned as a response.
    """

    # Set a unique filename for the uploaded image
    file.filename = f"{LOGIN_DIR}/{uuid.uuid4()}.png" 

    # Read the contents of the uploaded file
    contents = await file.read()

    # Write the binary contents into the opened file
    with open(file.filename, "wb") as f:
        f.write(contents)

    # Recognize the user's face from the uploaded image
    email_id, match_status = recognize(cv2.imread(file.filename))

    # Check if the user is already logged in
    logged_in_users = get_logged_in_users()
    if email_id in logged_in_users and logged_in_users[email_id]:
        return {"user": email_id, "message": "You are already logged in."}

    # If the user's face is recognized, update the login status and log the entry time
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

    """
    Endpoint for user logout.

    When called with an email as input, this function checks if the user is currently logged in. 
    If the user is not logged in, it returns a message indicating that the user is not logged in. 
    Otherwise, it updates the logout time and login status, indicating that the user has logged out.
    The user's email and a logout success message are returned as a response.
    """

    # Check if the user is already logged in
    registered_users = get_registered_users()
    registered_emails = [user['email'] for user in registered_users]
    if email not in registered_emails:
        return {"user": email, "message": "User does not exist"}


    logged_in_users = get_logged_in_users()
    if email not in logged_in_users.keys():
        return {"user": email, "message": "User is not logged in."}
    
    else:
        local_timezone = pytz.timezone('Asia/Kolkata')  
        current_datetime = datetime.datetime.now(local_timezone)
        formatted_date = current_datetime.strftime("%Y-%m-%d")
        formatted_datetime = current_datetime.strftime("%H:%M:%S")

        # Write the logout time into the attendance log file for the current date
        with open(os.path.join(ATTENDANCE_LOG_DIR, '{}.csv'.format(formatted_date)), 'a') as f:
            f.write('{},{},{}\n'.format(email, formatted_datetime, 'OUT'))

        # Update the login status to indicate the user has logged out
        logged_in_users[email] = False

        return {'user': email, 'message': 'Logged out successfully.'}


def user_already_registered(email: str) -> bool:

    """
    Function to check if a user with the given email is already registered.

    Parameters:
    email (str): The email of the user to check.

    Returns:
    bool: True if a user with the given email is found in the 'user_details.csv' file, False otherwise.
    """

    registered_users = get_registered_users()

    if email in [user['email'] for user in registered_users]:
        return True
    
    return False


@app.post("/register_new_user")
async def register_new_user(name: str,
                            email: str,
                            phone_number: str,
                            class_: str,
                            division: str,
                            file: UploadFile = File(...), 
                            ):
    
    """
    Endpoint for registering a new user.

    When called with the required details, this function checks if the user is already registered.
    If the user is already registered, it returns a message indicating that the user should proceed to login.
    Otherwise, it proceeds to register the new user by saving their image, face embeddings, and other details
    to the user details CSV file.

    Parameters:
    name (str): The name of the user.
    email (str): The email of the user to be registered.
    phone_number (str): The phone number of the user.
    class_ (str): The class of the user.
    division (str): The division of the user.
    file (UploadFile): The image file uploaded for registration.

    Returns:
    dict: A dictionary containing the status, user email, and a registration message.
          If the user is already registered, it returns a status of 400 and a message indicating that the user
          should proceed to login. If the user is successfully registered, it returns a status of 200 and a message
          indicating successful registration.
    """
    
    # Check if the user is already registered
    if user_already_registered(email):
        return {"status" : 400,
                "user" : email, 
                "message": f"You are already registered! Proceed to login."}
    
    # Format the name to title case
    name = name.title()

    # Save the uploaded image file
    image_path = os.path.join(DB_PATH, '{}.png'.format(email))
    
    # Set a unique filename for the uploaded image
    contents = await file.read()

    # # Save the image file
    with open(image_path, "wb") as f:
        f.write(contents)

    # Get face embeddings using face_recognition library
    embeddings = face_recognition.face_encodings(cv2.imread(image_path))

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

    return {'status': 200, 
            "user" : email,
            "message": "You registered successfully."}


@app.get("/get_attendance_logs")
async def get_attendance_logs():

    """
    Endpoint to retrieve the attendance logs.

    This function creates a zip archive of the attendance logs located in the ATTENDANCE_LOG_DIR directory.
    The zip archive is then returned as a response, allowing users to download the attendance logs as a zip file.
    """

    # File name for the zip archive
    filename = 'attendance.zip'

    # Create a zip archive of the attendance logs in the ATTENDANCE_LOG_DIR directory
    shutil.make_archive(filename[:-4], 'zip', ATTENDANCE_LOG_DIR)

    # Return the zip archive as a response with appropriate media type and filename
    return starlette.responses.FileResponse(filename, media_type='application/zip',filename=filename)

@app.get("/get_registered_users_logs")
async def get_registered_users_logs():

    """
    Endpoint to retrieve the registered user logs.

    This function checks if the user details CSV file exists (located at ./db/user_details.csv).
    If the file exists, it is returned as a response, allowing users to download the registered user logs as a CSV file.
    If the file does not exist, a custom JSON response is returned, indicating that there are no registered users currently.
    """

    # File paths for the csv file in database and output file name for the response
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

    """
    Function to recognize a person's face using face_recognition library.

    Given an image (img) as input, this function extracts the face embeddings from the image and compares them
    with the embeddings of known users stored in the database (DB_PATH). It assumes there will be at most one match in the database.

    Parameters:
    img (numpy.ndarray): The image containing the face to be recognized.

    Returns:
    tuple: A tuple containing the recognized person's name and a boolean value indicating whether a match is found.
           If a match is found, the tuple contains the person's name and True. Otherwise, it contains 'unknown_person' and False.
    """
    
    # It is assumed there will be at most 1 match in the db
    # Extract the face embeddings from the input image
    embeddings_unknown = face_recognition.face_encodings(img)

    # Check if any face embeddings are extracted from the image
    if len(embeddings_unknown) == 0:

        # If no face embeddings are found, return 'no_persons_found' and False
        return 'no_persons_found', False
    
    else:
        # Take the extracted face embedding
        embeddings_unknown = embeddings_unknown[0]

    # Initialize variables for matching and indexing through the database
    match = False
    j = 0

    # Get a sorted list of files ending with '.pickle' in the database directory
    db_dir = sorted([j for j in os.listdir(DB_PATH) if j.endswith('.pickle')])

    # Loop through the database embeddings and compare them with the input image embeddings
    while ((not match) and (j < len(db_dir))):

        # Get the path to the database pickle file
        path_ = os.path.join(DB_PATH, db_dir[j])

        # Load the embeddings from the database pickle file
        file = open(path_, 'rb')

        embeddings = pickle.load(file)[0]

        # Compare the embeddings from the database with the input image embeddings
        match = face_recognition.compare_faces([embeddings], embeddings_unknown)[0]

        # Move to the next index
        j += 1

    # Check if a match is found and return the recognized person's name and match status
    if match:
        return db_dir[j - 1][:-7], True
    
    else:
        return 'unknown_person', False