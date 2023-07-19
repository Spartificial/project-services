# Face Recognition Attendance System

## Introduction
This is a Face Recognition Attendance System implemented using Python and FastAPI. The system allows users to log in and log out by their face. The system recognizes the user based on their face and maintains attendance logs for each user. It also provides the functionality to register new users and retrieve attendance logs and registered user details.

## Requirements
- Python 3.x
- FastAPI
- face_recognition
- pytz
- opencv-python
- starlette

## Directories and Setup
The system uses the following directories:
- `ATTENDANCE_LOG_DIR`: Directory to store attendance logs.
- `DB_PATH`: Directory to store registered user details and face embeddings.
- `LOGIN_DIR`: Directory to store temporary login images.

Make sure these directories are created before running the system. The system automatically creates these directories if they don't exist.

## Endpoints

### `POST /login`
- Endpoint for user login.
- When called with a file upload, the function processes the image, recognizes the user, and handles the login process.
- The recognized user's identity and login status are returned as a response.

### `POST /logout`
- Endpoint for user logout.
- When called with an email as input, the function checks if the user is currently logged in.
- If the user is not logged in, it returns a message indicating that the user is not logged in.
- Otherwise, it updates the logout time and login status, indicating that the user has logged out.

### `POST /register_new_user`
- Endpoint for registering a new user.
- When called with the required details, the function checks if the user is already registered.
- If the user is already registered, it returns a message indicating that the user should proceed to login.
- Otherwise, it proceeds to register the new user by saving their image, face embeddings, and other details to the user details CSV file.

### `GET /get_attendance_logs`
- Endpoint to retrieve the attendance logs.
- The function creates a zip archive of the attendance logs located in the `ATTENDANCE_LOG_DIR` directory.
- The zip archive is then returned as a response, allowing users to download the attendance logs as a zip file.

### `GET /get_registered_users_logs`
- Endpoint to retrieve the registered user logs.
- The function checks if the user details CSV file exists (located at `./db/user_details.csv`).
- If the file exists, it is returned as a response, allowing users to download the registered user logs as a CSV file.
- If the file does not exist, a custom JSON response is returned, indicating that there are no registered users currently.

## Helper Functions

### `get_login_status_csv()`
- Function to get the CSV file path for the current date.
- Retrieves the current date and time in the Asia/Kolkata timezone and formats it as "YYYY-MM-DD".
- Generates the CSV file name based on the current date and returns the complete file path.

### `user_already_registered(email: str) -> bool`
- Function to check if a user with the given email is already registered.
- Parameters:
  - `email (str)`: The email of the user to check.
- Returns:
  - `bool`: True if a user with the given email is found in the 'user_details.csv' file, False otherwise.

### `recognize(img)`
- Function to recognize a person's face using the `face_recognition` library.
- Given an image (img) as input, this function extracts the face embeddings from the image and compares them with the embeddings of known users stored in the database (`DB_PATH`).
- It assumes there will be at most one match in the database.
- Parameters:
  - `img (numpy.ndarray)`: The image containing the face to be recognized.
- Returns:
  - `tuple`: A tuple containing the recognized person's name and a boolean value indicating whether a match is found. If a match is found, the tuple contains the person's name and True. Otherwise, it contains 'unknown_person' and False.

## Note
- The face recognition model and attendance log are updated daily based on the current date.
- The attendance logs and user details are stored in CSV format for easy retrieval and analysis.