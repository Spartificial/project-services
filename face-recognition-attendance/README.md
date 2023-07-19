# Face Recognition Attendance System

## Introduction
This is a Face Recognition Attendance System implemented using Python and FastAPI. The system allows users to log in and log out by their face. The system recognizes the user based on their face and maintains attendance logs for each user. It also provides the functionality to register new users and retrieve attendance logs and registered user details.
This is the frontend part, which is responsible for interacting with the backend API for getting the user images, inputs, and everything to do with the UI. 


## How to run
Go to the backend directory and run the following commands:
`pip install -r requirements
python-m uvicorn main:app --reload`
In a seperate terminal, go to the frontend\face-attendance-web-app-front and run the following commands:
`npm install
npm start`

## Index.js, API.js and app.js 
index.js is where the react application has been initialized.
api.js is where the api key is stored. Change the `API_BASE_URL` if you are not running it on the localhost.
app.js is where the mastercomponent, api key, main css and bootstrap css and js are initialized.

## MasterComponent.js

This is the main component of the application. It manages the state and contains other functions to perform various actions.

### `register_new_user_ok(Name, Email, Number, Class, Section)`

This function is used to register a new user by sending an image captured from the webcam to the API server along with user details like Name, Email, Phone Number, Class, and Section. The API endpoint used is `/register_new_user`. If the registration is successful (HTTP status 200), an alert is shown indicating the successful registration.

### `downloadLogs()`

This function is used to download attendance logs from the API server. It sends a GET request to the `/get_attendance_logs` endpoint and receives a zip file containing the logs. The file is then converted into a downloadable link, and a download prompt appears for the user to save the logs.

### `send_img_login()`

This function captures an image from the webcam, sends it to the API server via a POST request to the `/login` endpoint, and checks if the image matches any registered user's face. If a match is found, a welcome message with the user's name is displayed in an alert. If the image does not match any registered user, an alert indicating an unknown user is shown. If the user is already logged in, a different alert message is displayed.

### `send_img_logout(Logout)`

This function is similar to `send_img_login()` but instead is used to perform the logout action. It captures an image from the webcam, sends it along with the user's email (provided as `Logout`) to the `/logout` endpoint, and logs the user out if the image and email match a logged-in user. If no matching logged-in user is found, an alert indicating an unknown user is shown.

### saveLastFrame(canvasRef, lastFrame, setLastFrame, setShowWebcam, showWebcam, setShowImg)

This function is responsible for saving the last captured frame from the webcam. It is used in the `Webcam` component to constantly update the `lastFrame` state with the current frame data. This function sets the `lastFrame` state with the data of the most recent frame and controls the display of the webcam and image elements.

### Webcam({ lastFrame, setLastFrame })

This is a functional component used to display the webcam feed and capture images from it. It uses the `getUserMedia` API to access the user's webcam and continuously updates the `lastFrame` state with the current webcam frame.

### Buttons Component

This component renders different buttons and handles their onClick events based on the current state of the application. It includes buttons for logging in, logging out, registering, downloading logs, and navigating between the admin interface and the main interface. It also contains a form for user registration with fields for Name, Email, Phone Number, Class, and Section. The form is displayed when the user wants to register a new user.

## Assets
The assets contain the main css for the page. For the form and buttons, Bootstrap has been utilized, while for the layout and responsiveness, css is used in main.css. 