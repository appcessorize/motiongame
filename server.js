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
            <title>Ball Physics</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    margin: 0;
                    overflow: hidden;
                    font-family: -apple-system, system-ui, sans-serif;
                }
                #gameArea {
                    position: relative;
                    width: 100vw;
                    height: 100vh;
                    background: #f0f0f0;
                    overflow: hidden;
                }
                #ball {
                    position: absolute;
                    width: 50px;
                    height: 50px;
                    background: #ff3b30;
                    border-radius: 50%;
                    transition: transform 0.1s linear;
                }
                #controls {
                    position: fixed;
                    top: 0;
                    left: 0;
                    padding: 20px;
                    background: rgba(255, 255, 255, 0.8);
                    z-index: 100;
                }
                button {
                    font-size: 20px;
                    padding: 10px 20px;
                    margin: 5px;
                    background: #007AFF;
                    color: white;
                    border: none;
                    border-radius: 8px;
                }
                #debug {
                    font-size: 14px;
                    color: #666;
                }
            </style>
        </head>
        <body>
            <div id="gameArea">
                <div id="ball"></div>
            </div>
            <div id="controls">
                <button id="startButton">Start Motion Controls</button>
                <div id="debug">Waiting for motion data...</div>
            </div>

            <script>
                const ball = document.getElementById('ball');
                const debug = document.getElementById('debug');
                const startButton = document.getElementById('startButton');

                // Ball physics state
                let ballState = {
                    x: window.innerWidth / 2,
                    y: window.innerHeight / 2,
                    velocityX: 0,
                    velocityY: 0,
                    friction: 0.98,
                    gravity: 0.2,
                    bounce: 0.7
                };

                function updateBall() {
                    // Apply position
                    ball.style.transform = 'translate(' + 
                        (ballState.x - 25) + 'px, ' + 
                        (ballState.y - 25) + 'px)';
                }

                // Set initial ball position
                updateBall();

                async function startMotionControls() {
                    try {
                        // Request both permissions for iOS
                        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                            const orientationPermission = await DeviceOrientationEvent.requestPermission();
                            const motionPermission = await DeviceMotionEvent.requestPermission();
                            
                            if (orientationPermission === 'granted' && motionPermission === 'granted') {
                                startTracking();
                            }
                        } else {
                            startTracking();
                        }
                    } catch (error) {
                        debug.textContent = 'Error: ' + error.message;
                    }
                }

                function startTracking() {
                    // Track device orientation for rolling
                    window.addEventListener('deviceorientation', (event) => {
                        const tiltX = event.gamma; // Left/Right tilt (-90 to 90)
                        const tiltY = event.beta;  // Front/Back tilt (-180 to 180)

                        // Apply tilt-based acceleration
                        ballState.velocityX += (tiltX / 45) * 0.5;
                        ballState.velocityY += (tiltY / 45) * 0.5;

                        // Apply friction
                        ballState.velocityX *= ballState.friction;
                        ballState.velocityY *= ballState.friction;

                        // Update position
                        ballState.x += ballState.velocityX;
                        ballState.y += ballState.velocityY;

                        // Screen bounds collision
                        if (ballState.x < 25) {
                            ballState.x = 25;
                            ballState.velocityX *= -ballState.bounce;
                        }
                        if (ballState.x > window.innerWidth - 25) {
                            ballState.x = window.innerWidth - 25;
                            ballState.velocityX *= -ballState.bounce;
                        }
                        if (ballState.y < 25) {
                            ballState.y = 25;
                            ballState.velocityY *= -ballState.bounce;
                        }
                        if (ballState.y > window.innerHeight - 25) {
                            ballState.y = window.innerHeight - 25;
                            ballState.velocityY *= -ballState.bounce;
                        }

                        updateBall();
                        
                        debug.textContent = 
                            'Tilt - X: ' + tiltX.toFixed(1) + '° Y: ' + tiltY.toFixed(1) + '°\\n' +
                            'Velocity - X: ' + ballState.velocityX.toFixed(1) + ' Y: ' + ballState.velocityY.toFixed(1);
                    });

                    // Track acceleration for "bouncing" effect
                    window.addEventListener('devicemotion', (event) => {
                        const acc = event.acceleration;
                        if (acc && acc.x !== null && acc.y !== null) {
                            // Add sudden acceleration to velocity
                            ballState.velocityX += acc.x * 0.2;
                            ballState.velocityY += acc.y * 0.2;
                        }
                    });

                    startButton.style.display = 'none';
                    debug.textContent = 'Motion controls active';
                }

                startButton.addEventListener('click', startMotionControls);

                // Handle window resize
                window.addEventListener('resize', () => {
                    // Keep ball in bounds when window is resized
                    ballState.x = Math.min(Math.max(25, ballState.x), window.innerWidth - 25);
                    ballState.y = Math.min(Math.max(25, ballState.y), window.innerHeight - 25);
                    updateBall();
                });
            </script>
        </body>
        </html>
    `);
});

http.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
