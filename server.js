const express = require("express");
const app = express();
const http = require("http").createServer(app);
const { Server } = require("socket.io");
const io = new Server(http);

app.get("/", (req, res) => {
  res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Motion Test</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: -apple-system, system-ui, sans-serif;
                    padding: 20px;
                    font-size: 20px;
                }
                button {
                    font-size: 24px;
                    padding: 15px 30px;
                    margin: 20px 0;
                    display: block;
                    background: #007AFF;
                    color: white;
                    border: none;
                    border-radius: 10px;
                }
                #status, #coords {
                    margin: 20px 0;
                    padding: 15px;
                    background: #f0f0f0;
                    border-radius: 8px;
                }
            </style>
        </head>
        <body>
            <button id="requestPermission">Request Motion Access</button>
            <div id="status">Permission status: unknown</div>
            <div id="coords">Waiting for motion data...</div>

            <script>
                const status = document.getElementById('status');
                const coords = document.getElementById('coords');
                const button = document.getElementById('requestPermission');

                async function requestMotionAccess() {
                    try {
                        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                            // iOS 13+ devices
                            status.textContent = 'Requesting permission...';
                            const permission = await DeviceOrientationEvent.requestPermission();
                            status.textContent = 'Permission status: ' + permission;
                            
                            if (permission === 'granted') {
                                startMotionTracking();
                            }
                        } else {
                            // Non-iOS devices
                            status.textContent = 'Permission not required for this device';
                            startMotionTracking();
                        }
                    } catch (error) {
                        status.textContent = 'Error: ' + error.message;
                    }
                }

                function startMotionTracking() {
                    window.addEventListener('deviceorientation', (event) => {
                        coords.innerHTML = 
                            'Beta (front/back tilt): ' + (event.beta?.toFixed(1) || 'null') + '°<br>' +
                            'Gamma (left/right tilt): ' + (event.gamma?.toFixed(1) || 'null') + '°<br>' +
                            'Alpha (compass direction): ' + (event.alpha?.toFixed(1) || 'null') + '°';
                    });
                }

                button.addEventListener('click', requestMotionAccess);
            </script>
        </body>
        </html>
    `);
});

http.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
