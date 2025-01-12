const express = require("express");
const app = express();
const http = require("http").createServer(app);
const { Server } = require("socket.io");
const io = new Server(http);

app.use(express.json());

app.get("/", function (req, res) {
  res.send(
    '\
<!DOCTYPE html>\
<html>\
<head>\
   <title>Motion Controller Demo</title>\
   <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">\
   <script src="/socket.io/socket.io.js"></script>\
   <style>\
       body { \
           margin: 0; \
           overflow: hidden; \
           font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;\
           height: 100vh;\
           background: #f8f9fa;\
       }\
       \
       /* Display View Styles */\
       .display-view {\
           display: none;  /* Hidden by default */\
           width: 100vw;\
           height: 100vh;\
           position: relative;\
           background: #f0f0f0;\
       }\
       #dot {\
           width: 50px;\
           height: 50px;\
           background-color: red;\
           border-radius: 50%;\
           position: absolute;\
           left: 50%;\
           top: 50%;\
           transform: translate(-50%, -50%);\
           transition: all 0.1s ease;\
       }\
       \
       /* Controller View Styles */\
       .controller-view {\
           display: none;  /* Hidden by default */\
           text-align: center;\
           padding: 20px;\
           height: 100vh;\
       }\
       .controller-view h2 {\
           font-size: 32px;\
           margin: 40px 0;\
           color: #333;\
       }\
       #startMotion {\
           padding: 25px 40px;\
           font-size: 28px;\
           margin: 30px;\
           border-radius: 15px;\
           border: none;\
           background: #007bff;\
           color: white;\
           cursor: pointer;\
           -webkit-tap-highlight-color: transparent;\
           box-shadow: 0 4px 15px rgba(0,0,0,0.2);\
           width: 80%;\
           max-width: 400px;\
           display: block;\
           margin: 40px auto;\
       }\
       #startMotion:active {\
           background: #0056b3;\
           transform: scale(0.98);\
       }\
       #status {\
           font-size: 24px;\
           margin: 30px;\
           padding: 20px;\
           color: #666;\
           line-height: 1.4;\
       }\
       .error {\
           color: #dc3545;\
           background: #ffe6e6;\
           padding: 20px;\
           border-radius: 10px;\
           margin: 20px;\
           font-size: 24px;\
       }\
       #debugInfo {\
           font-size: 18px;\
           padding: 20px;\
           margin: 20px;\
           background: #eee;\
           border-radius: 10px;\
           text-align: left;\
           word-wrap: break-word;\
       }\
   </style>\
</head>\
<body>\
   <div class="display-view">\
       <div id="dot"></div>\
       <div id="status">Waiting for controller to connect...</div>\
   </div>\
\
   <div class="controller-view">\
       <h2>Tennis Controller</h2>\
       <button id="startMotion">Start Motion Controls</button>\
       <div id="status">Loading...</div>\
       <div id="debugInfo"></div>\
   </div>\
\
   <script>\
       const isController = window.location.hash === "#controller";\
       const displayView = document.querySelector(".display-view");\
       const controllerView = document.querySelector(".controller-view");\
       const status = document.getElementById("status");\
       const debugInfo = document.getElementById("debugInfo");\
       const dot = document.getElementById("dot");\
       \
       if (isController) {\
           controllerView.style.display = "block";\
           displayView.style.display = "none";\
           \
           // Debug info\
           debugInfo.innerHTML = \
               "DeviceOrientationEvent exists: " + (typeof DeviceOrientationEvent !== "undefined") + "<br>" +\
               "requestPermission exists: " + (typeof DeviceOrientationEvent?.requestPermission === "function") + "<br>" +\
               "User Agent: " + navigator.userAgent;\
\
           const startButton = document.getElementById("startMotion");\
           \
           async function startMotionDetection() {\
               try {\
                   debugInfo.innerHTML += "<br>Button clicked";\
                   \
                   if (typeof DeviceOrientationEvent?.requestPermission === "function") {\
                       debugInfo.innerHTML += "<br>Requesting iOS permission...";\
                       \
                       const response = await DeviceOrientationEvent.requestPermission();\
                       debugInfo.innerHTML += "<br>Permission response: " + response;\
                       \
                       if (response === "granted") {\
                           enableMotion();\
                       } else {\
                           throw new Error("Permission not granted: " + response);\
                       }\
                   } else {\
                       debugInfo.innerHTML += "<br>No permission needed, enabling motion...";\
                       enableMotion();\
                   }\
               } catch (error) {\
                   debugInfo.innerHTML += "<br>Error: " + error.message;\
                   status.innerHTML = \
                       "<div class=\'error\'>" +\
                       "⚠️ Error enabling motion controls<br><br>" +\
                       "Please check:<br>" +\
                       "1. You\'re using Safari<br>" +\
                       "2. Motion & Orientation Access is enabled in Safari settings<br>" +\
                       "3. Your phone is not in Low Power Mode<br>" +\
                       "4. Try refreshing the page" +\
                       "</div>";\
               }\
           }\
\
           function enableMotion() {\
               window.addEventListener("deviceorientation", handleMotion, true);\
               status.textContent = "✅ Motion controls active!";\
               startButton.style.display = "none";\
               \
               setTimeout(() => {\
                   if (!window.hasReceivedMotionEvent) {\
                       debugInfo.innerHTML += "<br>No motion events received after 2 seconds";\
                   }\
               }, 2000);\
           }\
\
           function handleMotion(event) {\
               window.hasReceivedMotionEvent = true;\
               debugInfo.innerHTML = "Last motion event: beta=" + \
                   (event.beta?.toFixed(1) || "null") + ", gamma=" + \
                   (event.gamma?.toFixed(1) || "null");\
               \
               if (event.beta != null && event.gamma != null) {\
                   socket.emit("motion", {\
                       beta: event.beta,\
                       gamma: event.gamma\
                   });\
               }\
           }\
\
           startButton.addEventListener("click", startMotionDetection);\
           startButton.disabled = false;\
           startButton.style.opacity = "1";\
\
       } else {\
           displayView.style.display = "block";\
           controllerView.style.display = "none";\
       }\
\
       const socket = io();\
       \
       if (isController) {\
           socket.on("connect", () => {\
               status.textContent = "Connected! Tap button to start.";\
           });\
       } else {\
           socket.on("connect", () => {\
               const url = window.location.href + "#controller";\
               status.innerHTML = "On your phone, open:<br>" + url;\
           });\
\
           socket.on("motion", (data) => {\
               const x = (data.gamma / 90) * window.innerWidth + window.innerWidth / 2;\
               const y = (data.beta / 180) * window.innerHeight + window.innerHeight / 2;\
               \
               dot.style.left = Math.max(0, Math.min(window.innerWidth - 50, x)) + "px";\
               dot.style.top = Math.max(0, Math.min(window.innerHeight - 50, y)) + "px";\
           });\
       }\
\
       socket.on("disconnect", () => {\
           status.textContent = isController ? \
               "Disconnected from game. Please refresh." : \
               "Controller disconnected!";\
       });\
   </script>\
</body>\
</html>\
   '
  );
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("motion", (data) => {
    socket.broadcast.emit("motion", data);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
