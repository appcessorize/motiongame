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
                #orientationStatus, #motionStatus, #orientationData, #motionData {
                    margin: 20px 0;
                    padding: 15px;
                    background: #f0f0f0;
                    border-radius: 8px;
                }
            </style>
        </head>
        <body>
            <button id="requestOrientationPermission">Request Orientation Access</button>
            <button id="requestMotionPermission">Request Accelerometer Access</button>
            <div id="orientationStatus">Orientation permission: unknown</div>
            <div id="motionStatus">Accelerometer permission: unknown</div>
            <div id="orientationData">Waiting for orientation data...</div>
            <div id="motionData">Waiting for accelerometer data...</div>

            <script>
                const orientationStatus = document.getElementById('orientationStatus');
                const motionStatus = document.getElementById('motionStatus');
                const orientationData = document.getElementById('orientationData');
                const motionData = document.getElementById('motionData');

                async function requestOrientationPermission() {
                    try {
                        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                            orientationStatus.textContent = 'Requesting orientation permission...';
                            const permission = await DeviceOrientationEvent.requestPermission();
                            orientationStatus.textContent = 'Orientation permission: ' + permission;
                            
                            if (permission === 'granted') {
                                startOrientationTracking();
                            }
                        } else {
                            orientationStatus.textContent = 'Orientation permission not required';
                            startOrientationTracking();
                        }
                    } catch (error) {
                        orientationStatus.textContent = 'Orientation Error: ' + error.message;
                    }
                }

                async function requestMotionPermission() {
                    try {
                        if (typeof DeviceMotionEvent.requestPermission === 'function') {
                            motionStatus.textContent = 'Requesting accelerometer permission...';
                            const permission = await DeviceMotionEvent.requestPermission();
                            motionStatus.textContent = 'Accelerometer permission: ' + permission;
                            
                            if (permission === 'granted') {
                                startMotionTracking();
                            }
                        } else {
                            motionStatus.textContent = 'Accelerometer permission not required';
                            startMotionTracking();
                        }
                    } catch (error) {
                        motionStatus.textContent = 'Accelerometer Error: ' + error.message;
                    }
                }

                function startOrientationTracking() {
                    window.addEventListener('deviceorientation', (event) => {
                        orientationData.innerHTML = 
                            'Beta (front/back tilt): ' + (event.beta?.toFixed(1) || 'null') + '°<br>' +
                            'Gamma (left/right tilt): ' + (event.gamma?.toFixed(1) || 'null') + '°<br>' +
                            'Alpha (compass): ' + (event.alpha?.toFixed(1) || 'null') + '°';
                    });
                }

                function startMotionTracking() {
                    window.addEventListener('devicemotion', (event) => {
                        const acc = event.acceleration;
                        const accGravity = event.accelerationIncludingGravity;
                        
                        motionData.innerHTML = 
                            'Acceleration:<br>' +
                            'X: ' + (acc?.x?.toFixed(2) || 'null') + ' m/s²<br>' +
                            'Y: ' + (acc?.y?.toFixed(2) || 'null') + ' m/s²<br>' +
                            'Z: ' + (acc?.z?.toFixed(2) || 'null') + ' m/s²<br><br>' +
                            'Acceleration with gravity:<br>' +
                            'X: ' + (accGravity?.x?.toFixed(2) || 'null') + ' m/s²<br>' +
                            'Y: ' + (accGravity?.y?.toFixed(2) || 'null') + ' m/s²<br>' +
                            'Z: ' + (accGravity?.z?.toFixed(2) || 'null') + ' m/s²';
                    });
                }

                document.getElementById('requestOrientationPermission')
                    .addEventListener('click', requestOrientationPermission);
                document.getElementById('requestMotionPermission')
                    .addEventListener('click', requestMotionPermission);
            </script>
        </body>
        </html>
    `);
});

http.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
