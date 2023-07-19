import React, { useRef, useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL from "./API";
import "./assets/css/main.css";

let videoRef;
let canvasRef;
let context;

function MasterComponent() {
  let [lastFrame, setLastFrame] = useState(null);
  const [showWebcam, setShowWebcam] = useState(true);
  const [showImg, setShowImg] = useState(false);

  function register_new_user_ok(Name, Email, Number, Class, Section) {
    if (lastFrame) {
      const apiUrl = API_BASE_URL + "/register_new_user?name=" + Name + "&email=" + Email + "&phone_number=" + Number+ "&class_=" + Class+ "&division=" + Section;
      console.log(typeof lastFrame);
      fetch(lastFrame)
        .then((response) => response.blob())
        .then((blob) => {
          const file = new File([blob], "webcam-frame.png", {
            type: "image/png",
          });
          const formData = new FormData();
          formData.append("file", file);
          axios
            .post(apiUrl, formData, {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            })
            .then((response) => {
              console.log(response.data);
              if (response.data.registration_status == 200) {
                alert("User was registered successfully!");
              }
            })
            .catch((error) => {
              console.error("Error sending image to API:", error);
            });
        });
    }
  }

  async function downloadLogs() {
    const response = await axios.get(API_BASE_URL + "/get_attendance_logs", {
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "logs.zip");
    document.body.appendChild(link);
    link.click();
  }

  function send_img_login() {
    if (videoRef.current && canvasRef.current) {
      context = canvasRef.current.getContext("2d");
      context.drawImage(videoRef.current, 0, 0, 400, 300);

      canvasRef.current.toBlob((blob) => {
        // setLastFrame(URL.createObjectURL(blob));

        // Your edition here

        const apiUrl = API_BASE_URL + "/login";
        const file = new File([blob], "webcam-frame.png", {
          type: "image/png",
        });
        const formData = new FormData();
        formData.append("file", file);

        axios
          .post(apiUrl, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          })
          .then((response) => {
            console.log(response.data);
            if (response.data.match_status == true) {
              alert("Welcome back " + response.data.user + " !");
            } 
            else if (response.data.message == false)
            {
              alert("Unknown user! Please try again or register new user!");
            }
            else{
              alert("You are already logged in!");
            }
          })
          .catch((error) => {
            console.error(apiUrl, error);
          });
      });
    }
  }

  function send_img_logout(Logout) {
    if (videoRef.current && canvasRef.current) {
      context = canvasRef.current.getContext("2d");
      context.drawImage(videoRef.current, 0, 0, 400, 300);

      canvasRef.current.toBlob((blob) => {
        // setLastFrame(URL.createObjectURL(blob));

        // Your edition here

        const apiUrl = API_BASE_URL + "/logout?email="+Logout;
        const formData = new FormData();

        axios
          .post(apiUrl, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          })
          .then((response) => {
            console.log(response.data);
            if (response.data.message == 'Logged out successfully.') {
              alert("Goodbye " + response.data.user + " !");
            } else {
              alert("Unknown user! Please try again or register new user!");
            }
          })
          .catch((error) => {
            console.error("Error sending image to API:", error);
          });
      });
    }
  }
  return (
    <div className="master-component">
      <h1 className="display-3 heading">Face Recognition Attendance</h1>
      {showWebcam ? (
        <Webcam lastFrame={lastFrame} setLastFrame={setLastFrame} />
      ) : (
        <div className="webcam">
            <img className="register_img" src={lastFrame} />
        </div>
      )}
      <Buttons
        lastFrame={lastFrame}
        setLastFrame={setLastFrame}
        setShowWebcam={setShowWebcam}
        showWebcam={showWebcam}
        setShowImg={setShowImg}
        send_img_login={send_img_login}
        send_img_logout={send_img_logout}
        register_new_user_ok={register_new_user_ok}
        downloadLogs={downloadLogs}
      />
    </div>
  );
}

function saveLastFrame(
  canvasRef,
  lastFrame,
  setLastFrame,
  setShowWebcam,
  showWebcam,
  setShowImg
) {
  requestAnimationFrame(() => {
    console.log(context);

    if (!showWebcam && lastFrame) {
      setShowImg(true);
    } else {
      setShowImg(false);
    }

    if (videoRef.current && canvasRef.current) {
      context = canvasRef.current.getContext("2d");
      context.drawImage(videoRef.current, 0, 0, 400, 300);

      canvasRef.current.toBlob((blob) => {
        setLastFrame(URL.createObjectURL(blob));
        // lastFrame = blob.slice(); // Your edition here
      });
      setShowWebcam(false);
      setShowImg(true);
    }
  }, [showWebcam]);
}

function Webcam({ lastFrame, setLastFrame }) {
  videoRef = useRef(null);
  canvasRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    const setupCamera = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      setIsStreaming(true);
    };
    if (!isStreaming) {
      setupCamera();
    }
  }, [isStreaming]);

  useEffect(() => {
    if (isStreaming) {
      context = canvasRef.current.getContext("2d");
      context.drawImage(videoRef.current, 0, 0, 400, 300);

      requestAnimationFrame(() => {
        setTimeout(() => {
          context.drawImage(videoRef.current, 0, 0, 400, 300);

          canvasRef.current.toBlob((blob) => {
            setLastFrame(URL.createObjectURL(blob));
            lastFrame = blob.slice(); // Your edition here
          });
        }, 33);
      });
    }
  }, [isStreaming]);

  return (
    <div className="webcam">
      <canvas ref={canvasRef} width={400} height={300} />
      <video ref={videoRef} autoPlay playsInline />
    </div>
  );
}

function Buttons({
  lastFrame,
  setLastFrame,
  setShowWebcam,
  showWebcam,
  setShowImg,
  send_img_login,
  send_img_logout,
  register_new_user_ok,
  downloadLogs,
}) {
  const submit_ref = useRef();
  const retake_image_ref = useRef();
  const cancel_register_ref = useRef();

  const [isRegistering, setIsRegistering] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [retake_text, set_retake_text] = useState("Retake Photo");

  const [zIndexAdmin, setZIndexAdmin] = useState(1);
  const [zIndexRegistering, setZIndexRegistering] = useState(1);

  const changeZIndexAdmin = (newZIndex) => {
    setZIndexAdmin(newZIndex);
  };

  const changeZIndexRegistering = (newZIndex) => {
    setZIndexRegistering(newZIndex);
  };

  const [Name, setName] = useState("");
  const [Email, setEmail] = useState("");
  const [Number, setNumber] = useState("");
  const [Class, setClass] = useState("");
  const [Section, setSection] = useState("");

  const [Logout, setLogout] = useState("");

  const handlelogout = (event) => {
    setLogout(event.target.value);
  };

  const resetTextBox = () => {
    setName("");
    setEmail("");
    setNumber("");
    setClass("");
    setSection("");
  };

  const handleName = (event) => {
    setName(event.target.value);
  };

  const handleEmail = (event) => {
    setEmail(event.target.value);
  };

  const handleNumber = (event) => {
    setNumber(event.target.value);
  };

  const handleClass = (event) => {
    setClass(event.target.value);
  };

  const handleSection = (event) => {
    setSection(event.target.value);
  };
  const form=<div><div className="form">
        <input
          className="form-control"
          id="name"
          type="text"
          placeholder="Full Name"
          value={Name}
          onChange={handleName}
          required
        />
        <select
          className="custom-select"
          id="class"
          placeholder="Class"
          value={Class}
          onChange={handleClass}
        >
          <option value="default">class</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
          <option value="6">6</option>
          <option value="7">7</option>
          <option value="8">8</option>
          <option value="9">9</option>
          <option value="10">10</option>
          <option value="11">11</option>
          <option value="12">12</option>
        </select>
        <input
          className="form-control"
          id="section"
          type="text"
          placeholder="Section"
          value={Section}
          onChange={handleSection}
          required
        />
        </div>
        <div className="form">
        <input
          className="form-control"
          id="email"
          type="email"
          placeholder="Email"
          value={Email}
          onChange={handleEmail}
          required
        />
        <input
          className="form-control"
          id="number"
          type="number"
          placeholder="Phone Number"
          value={Number}
          onChange={handleNumber}
          required
        /></div>
    </div>

  

  return (
    <div>
    <div className="buttons-container">
      <div
        className={`${
          isRegistering ? "visible" : "hidden"
        } register-retake-container`}
        style={{
          zIndex: zIndexRegistering,
        }}
        ref={retake_image_ref}
      >
      
      <button
          className={`register-retake-button btn btn-primary`}
          onClick={() => {
            // clear all data
            setIsAdmin(false);
            setIsRegistering(false);

            changeZIndexAdmin(1);
            changeZIndexRegistering(1);

            setShowWebcam(true);
            setShowImg(false);

            // reset registering 
            setIsRegistering(true);

            changeZIndexAdmin(1);
            changeZIndexRegistering(3);

            saveLastFrame(
              canvasRef,
              lastFrame,
              setLastFrame,
              setShowWebcam,
              showWebcam,
              setShowImg
            );
            resetTextBox();
            if (retake_text == "Retake Photo")
            {
              set_retake_text("Confirm Retake");
              submit_ref.current.style.display= "None"; 
              retake_image_ref.current.style.width= "45%"; 
              cancel_register_ref.current.style.width= "45%";
              cancel_register_ref.current.style.margin= "0 0 0 10%";
            }
            else
            {
              set_retake_text("Retake Photo");
              submit_ref.current.style.display= "inline-block";
              retake_image_ref.current.style.width= "30%"; 
              cancel_register_ref.current.style.width= "30%";
              cancel_register_ref.current.style.margin= "0 0 0 0";
            }

          }}
        >
          <p className="text">{retake_text}</p>
        </button>
      </div>
      <div
        className={`${
          isRegistering ? "visible" : "hidden"
        } register-ok-container`}
        style={{
          zIndex: zIndexRegistering,
        }}
        ref={submit_ref}
      >
        <button
          className={`register-ok-button btn btn-success`}
          onClick={async () => {
            if (Name == ''){alert("Name Is Empty!");}
            else if (Email == ''){alert("Email Is Empty!");}
            else if (Number == ''){alert("Number Is Empty!");}
            else if (Class == ''){alert("Class Is Empty!");}
            else if (Section == ''){alert("Section Is Empty!");}
            else{
              register_new_user_ok(Name, Email, Number, Class, Section);
              setIsAdmin(false);
              setIsRegistering(false);
              
              changeZIndexAdmin(1);
              changeZIndexRegistering(1);

              setShowWebcam(true);
              setShowImg(false);
            
              submit_ref.current.style.display= "None"; 
            }
          }}
        >
        <p className="text">Submit</p>
        </button>
      </div>
      <div
        className={`${
          isRegistering ? "visible" : "hidden"
        } register-cancel-container`}
        style={{
          zIndex: zIndexRegistering,
        }}
        ref={cancel_register_ref}
      >
        <button
          className={`register-cancel-button btn btn-danger`}
          onClick={async () => {
            setIsAdmin(false);
            setIsRegistering(false);

            changeZIndexAdmin(1);
            changeZIndexRegistering(1);

            setShowWebcam(true);
            setShowImg(false);
            
            submit_ref.current.style.display= "None"; 
          }}
        >
        <p className="text">Cancel</p>
        </button>
      </div>
      <div className={`${
            isAdmin || isRegistering ? "hidden" : "visible"
          } login-container`}>
        <button
          className={`login-button btn btn-success`}
          onClick={async () => {
            // saveFrameToDisk(canvasRef, lastFrame, setLastFrame);
            // setIsRegistering(true);
            send_img_login();
          }}
        >
        <p className="text">Log In</p>  
        </button>
      </div>
      <div className={`${
            isAdmin || isRegistering ? "hidden" : "visible"
          } logout-container`}>
        <button
          className={`logout-button btn btn-danger`}
          onClick={() => {
            send_img_logout(Logout);
          }}
        >
        <p className="text">Log Out</p>
        </button>
      </div>
      <div className={`${
            isAdmin || isRegistering ? "hidden" : "visible"
          } admin-container`}>
        <button
          className="admin-button btn btn-primary"
          onClick={() => {
            setIsAdmin(true);
            setIsRegistering(false);

            changeZIndexAdmin(3);
            changeZIndexRegistering(1);
          }}
        >
        <p className="text">Admin</p>
        </button>
      </div>
      <div
        className={`${isAdmin ? "visible" : "hidden"} register-container`}
        style={{
          zIndex: zIndexAdmin,
        }}
      >
        <button
          className={`register-button btn btn-primary`}
          onClick={() => {
            setIsAdmin(false);
            setIsRegistering(true);

            changeZIndexAdmin(1);
            changeZIndexRegistering(3);

            saveLastFrame(
              canvasRef,
              lastFrame,
              setLastFrame,
              setShowWebcam,
              showWebcam,
              setShowImg
            );
            resetTextBox();
            set_retake_text("Retake Photo");
            
            submit_ref.current.style.display= "inline-block";
            retake_image_ref.current.style.width= "30%"; 
            cancel_register_ref.current.style.width= "30%";
            cancel_register_ref.current.style.margin= "0 0 0 0";
          }}
        >
        <p className="text">Register</p>
        </button>
      </div>  

      <div
        className={`${isAdmin ? "visible" : "hidden"} download-container`}
        style={{
          zIndex: zIndexAdmin,
        }}
      >
        <button
          className={`download-button btn btn-primary`}
          onClick={() => {
            setIsAdmin(false);
            setIsRegistering(false);

            changeZIndexAdmin(1);
            changeZIndexRegistering(1);

            downloadLogs();
          }}
        >
        <p className="text">Download Log</p>
        </button>
      </div>
      
      <div
        className={`${isAdmin ? "visible" : "hidden"} goback-container`}
        style={{
          zIndex: zIndexAdmin,
        }}
      >
        <button
          className={`goback-button btn btn-primary`}
          onClick={() => {
            setIsAdmin(false);
            setIsRegistering(false);

            changeZIndexAdmin(1);
            changeZIndexRegistering(1);
          }}
        >
        <p className="text">Home Page</p>
        </button>
      </div>
      
    <div className={`${
            isAdmin || isRegistering ? "hidden" : "visible"
          } logout-form-container`}>
        
      <input
          className="form-control"
          id="logout"
          type="email"
          placeholder="Email"
          value={Logout}
          onChange={handlelogout}
          required
        />
      </div>
    </div>
    
    <div
    className={`${
      isRegistering ? "block-visible" : "hidden"
    } register-form-container`}
    style={{
      zIndex: zIndexRegistering,
    }}
    >
      {form}
    </div>
  </div>
  );
}
export default MasterComponent;
