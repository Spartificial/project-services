import React, { useRef, useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL from "./API";

import submit_button from "./assets/imgs/accept_button.png";
import admin_button from "./assets/imgs/admin_button.png";
import cancel_button from "./assets/imgs/cancel_button.png";
import download_logs_icon from "./assets/imgs/download_logs_icon.png";
import login_button from "./assets/imgs/login_button.png";
import go_back_button from "./assets/imgs/go_back_button.png";
import register_button from "./assets/imgs/register_button.png";
import logout_button from "./assets/imgs/logout_button.png";

let videoRef;
let canvasRef;
let context;

function MasterComponent() {
  let [lastFrame, setLastFrame] = useState(null);
  const [showWebcam, setShowWebcam] = useState(true);
  const [showImg, setShowImg] = useState(false);

  function register_new_user_ok(text) {
    if (lastFrame) {
      const apiUrl = API_BASE_URL + "/register_new_user?text=" + text;
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

  function send_img_logout() {
    if (videoRef.current && canvasRef.current) {
      context = canvasRef.current.getContext("2d");
      context.drawImage(videoRef.current, 0, 0, 400, 300);

      canvasRef.current.toBlob((blob) => {
        // setLastFrame(URL.createObjectURL(blob));

        // Your edition here

        const apiUrl = API_BASE_URL + "/logout";
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
      {showWebcam ? (
        <Webcam lastFrame={lastFrame} setLastFrame={setLastFrame} />
      ) : (
        <img className="register_photo_img" src={lastFrame} />
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
  const [isRegistering, setIsRegistering] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [zIndexAdmin, setZIndexAdmin] = useState(1);
  const [zIndexRegistering, setZIndexRegistering] = useState(1);

  const changeZIndexAdmin = (newZIndex) => {
    setZIndexAdmin(newZIndex);
  };

  const changeZIndexRegistering = (newZIndex) => {
    setZIndexRegistering(newZIndex);
  };

  const [value, setValue] = useState("");

  const handleChange = (event) => {
    setValue(event.target.value);
  };

  const resetTextBox = () => {
    setValue("");
  };

  return (
    <div className="buttons-container">
      <div
        className={`${
          isRegistering ? "visible" : "hidden"
        } register-text-container`}
        style={{
          zIndex: zIndexRegistering,
        }}
      >
        <input
          className="register-text"
          type="text"
          placeholder="Full Name"
          value={value}
          onChange={handleChange}
        />
        <input
          className="register-text"
          type="email"
          placeholder="Email"
          value={value}
          onChange={handleChange}
        />
        <input
          className="register-text"
          type="number"
          placeholder="Phone Number"
          value={value}
          onChange={handleChange}
        />
        <input
          className="register-text"
          type="text"
          placeholder="Class"
          value={value}
          onChange={handleChange}
        />
        <input
          className="register-text"
          type="text"
          placeholder="Section"
          value={value}
          onChange={handleChange}
        />
      </div>
      <div
        className={`${
          isRegistering ? "visible" : "hidden"
        } register-ok-container`}
        style={{
          zIndex: zIndexRegistering,
        }}
      >
        <button
          className={`register-ok-button`}
          onClick={async () => {
            setIsAdmin(false);
            setIsRegistering(false);

            changeZIndexAdmin(1);
            changeZIndexRegistering(1);

            setShowWebcam(true);
            setShowImg(false);
            register_new_user_ok(value);
          }}
        >
        <img src={submit_button} class="img"></img>
        <p class="text">Submit</p>
</button>
      </div>
      <div
        className={`${
          isRegistering ? "visible" : "hidden"
        } register-cancel-container`}
        style={{
          zIndex: zIndexRegistering,
        }}
      >
        <button
          className={`register-cancel-button`}
          onClick={async () => {
            setIsAdmin(false);
            setIsRegistering(false);

            changeZIndexAdmin(1);
            changeZIndexRegistering(1);

            setShowWebcam(true);
            setShowImg(false);
          }}
        >
        <img src={cancel_button} class="img"></img>
        <p class="text">Cancel</p>
        </button>
      </div>
      <div className={`${
            isAdmin || isRegistering ? "hidden" : "visible"
          } login-container`}>
        <button
          className={`login-button`}
          onClick={async () => {
            // saveFrameToDisk(canvasRef, lastFrame, setLastFrame);
            // setIsRegistering(true);
            send_img_login();
          }}
        >
        <img src={login_button} class="img"></img>
        <p class="text">Log In</p>  
        </button>
      </div>
      <div className={`${
            isAdmin || isRegistering ? "hidden" : "visible"
          } logout-container`}>
        <button
          className={`logout-button`}
          onClick={() => {
            send_img_logout();
          }}
        >
        <img src={logout_button} class="img"></img>
        <p class="text">Log Out</p>
        </button>
      </div>
      <div className={`${
            isAdmin || isRegistering ? "hidden" : "visible"
          } admin-container`}>
        <button
          className="admin-button"
          onClick={() => {
            setIsAdmin(true);
            setIsRegistering(false);

            changeZIndexAdmin(3);
            changeZIndexRegistering(1);
          }}
        >
        <img src={admin_button} class="img"></img>
        <p class="text">Admin</p>
        </button>
      </div>
      <div
        className={`${isAdmin ? "visible" : "hidden"} register-container`}
        style={{
          zIndex: zIndexAdmin,
        }}
      >
        <button
          className={`register-button`}
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

          }}
        >
        <img src={register_button} class="img"></img>
        <p class="text">Register</p>
        </button>
      </div>  

      <div
        className={`${isAdmin ? "visible" : "hidden"} download-container`}
        style={{
          zIndex: zIndexAdmin,
        }}
      >
        <button
          className={`download-button`}
          onClick={() => {
            setIsAdmin(false);
            setIsRegistering(false);

            changeZIndexAdmin(1);
            changeZIndexRegistering(1);

            downloadLogs();
          }}
        >
        <img src={download_logs_icon} class="img"></img>
        <p class="text">Download Log</p>
        </button>
      </div>
      
      <div
        className={`${isAdmin ? "visible" : "hidden"} goback-container`}
        style={{
          zIndex: zIndexAdmin,
        }}
      >
        <button
          className={`goback-button`}
          onClick={() => {
            setIsAdmin(false);
            setIsRegistering(false);

            changeZIndexAdmin(1);
            changeZIndexRegistering(1);
          }}
        >
        <img src={go_back_button} class="img"></img>
        <p class="text">Home Page</p>
        </button>
      </div>
    </div>
  );
}
export default MasterComponent;
