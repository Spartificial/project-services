
import pytz
import datetime
import os
import csv
import pickle

import face_recognition

from anti_spoof.test import test


def get_login_status_csv(ATTENDANCE_LOG_DIR):

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

def get_logged_in_users(ATTENDANCE_LOG_DIR):
    logged_in_users = {}

    LOGIN_STATUS_CSV = get_login_status_csv(ATTENDANCE_LOG_DIR)
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

    USERS_CSV = r".db\user_details.csv"

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

def spoof_test(image):

    """
    Function to perform anti-spoofing test on an input image.

    Parameters:
        image (image array): The input image to be tested.

    Returns:
        str: The label of the test result (either "real" or "spoof").
    """

    # Call the 'test' function to perform anti-spoofing test on the input image.
    # The test function is part of the anti-spoofing module and takes the following parameters:
    #   - image: The input image to be tested.
    #   - model_dir: The directory containing the anti-spoofing models.
    #   - device_id: The ID of the device (e.g., GPU) to use for inference.
    label = test(image=image,
                    model_dir="./anti_spoof/resources/anti_spoof_models",
                    device_id=0)
    return label


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

def recognize(img, DB_PATH):

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

