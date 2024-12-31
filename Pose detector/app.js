let net;
let mode = 'upload';
let isDetecting = false;
let video;
let canvas;
let ctx;
let stream;

async function initializeTensorFlow() {
    await tf.setBackend('webgl');
    await tf.ready();
    net = await posenet.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        inputResolution: { width: 640, height: 480 },
        multiplier: 0.75,
    });
}

function analyzePosture(pose) {
    const keypoints = pose.keypoints.filter(kp => kp.score > 0.5);
    const parts = keypoints.reduce((acc, kp) => {
        acc[kp.part] = kp.position;
        return acc;
    }, {});
    
    const feedback = [];
    let isGoodPosture = true;

    if (parts.leftShoulder && parts.rightShoulder && parts.leftEar && parts.rightEar) {
        const shoulderSlope = Math.abs(parts.leftShoulder.y - parts.rightShoulder.y);
        const neckTilt = Math.abs(parts.leftEar.y - parts.leftShoulder.y);
        
        if (shoulderSlope > 20) {
            feedback.push('Your shoulders are not level. Try to keep them even.');
            isGoodPosture = false;
        }
        if (neckTilt > 100) {
            feedback.push('Your head is too far forward. Try to keep your ears aligned with your shoulders.');
            isGoodPosture = false;
        }
    } else {
        feedback.push('No pose detected. Please ensure you are fully visible to the camera.');
        isGoodPosture = false;
    }
    
    if (parts.leftHip && parts.rightHip && parts.leftKnee && parts.rightKnee) {
        const hipTilt = Math.abs(parts.leftHip.y - parts.rightHip.y);
        const kneePosition = Math.abs(parts.leftKnee.y - parts.rightKnee.y);
        
        if (hipTilt > 20) {
            feedback.push('Your hips are not level. Try to keep them even.');
            isGoodPosture = false;
        }
        if (kneePosition > 20) {
            feedback.push('Your knees are not aligned. Ensure your knees are level.');
            isGoodPosture = false;
        }
    }

    if (isGoodPosture) {
        feedback.push('Good posture! Keep it up!');
    }

    return { feedback, isGoodPosture };
}

function updateFeedback(analysis) {
    const feedbackEl = document.getElementById('feedback');
    feedbackEl.innerHTML = '';
    feedbackEl.className = 'feedback ' + (analysis.isGoodPosture ? 'good' : 'bad');

    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('width', '20');
    icon.setAttribute('height', '20');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('stroke-width', '2');
    icon.setAttribute('stroke-linecap', 'round');
    icon.setAttribute('stroke-linejoin', 'round');

    if (analysis.isGoodPosture) {
        icon.innerHTML = '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>';
    } else {
        icon.innerHTML = '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>';
    }

    const messageDiv = document.createElement('div');
    analysis.feedback.forEach(msg => {
        const p = document.createElement('p');
        p.textContent = msg;
        messageDiv.appendChild(p);
    });

    feedbackEl.appendChild(icon);
    feedbackEl.appendChild(messageDiv);
}

async function detectPose(element) {
    if (!net || !ctx) return;

    const pose = await net.estimateSinglePose(element);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the image/video frame
    ctx.drawImage(element, 0, 0, canvas.width, canvas.height);

    // Draw keypoints
    let keypointsDetected = false;
    pose.keypoints.forEach(({ position, score }) => {
        if (score > 0.5) {
            ctx.beginPath();
            ctx.arc(position.x, position.y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = '#00ff00';
            ctx.fill();
            keypointsDetected = true;
        }
    });

    if (!keypointsDetected) {
        updateFeedback({ feedback: ['No pose detected. Please ensure you are fully visible to the camera.'], isGoodPosture: false });
    } else {
        // Analyze posture
        const analysis = analyzePosture(pose);
        updateFeedback(analysis);
    }

    if (isDetecting && mode === 'live') {
        requestAnimationFrame(() => detectPose(element));
    }
}

async function setupCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser API navigator.mediaDevices.getUserMedia not available');
    }

    stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
    });
    
    video.srcObject = stream;
    
    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            video.play();
            resolve(video);
        };
    });
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    if (video) {
        video.srcObject = null;
    }
}

// Initialize elements and events
document.addEventListener('DOMContentLoaded', async () => {
    video = document.getElementById('video');
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    canvas.width = 640;
    canvas.height = 480;

    await initializeTensorFlow();

    // Mode buttons
    document.getElementById('uploadBtn').addEventListener('click', () => {
        mode = 'upload';
        isDetecting = false;
        stopCamera();
        updateButtons();
        document.getElementById('upload-prompt').style.display = 'flex';
        video.style.display = 'none';
    });

    document.getElementById('videoBtn').addEventListener('click', () => {
        mode = 'video';
        isDetecting = false;
        stopCamera();
        updateButtons();
        document.getElementById('upload-prompt').style.display = 'flex';
        video.style.display = 'none';
    });

    document.getElementById('liveBtn').addEventListener('click', async () => {
        mode = 'live';
        updateButtons();
        document.getElementById('upload-prompt').style.display = 'none';
        video.style.display = 'block';
        await setupCamera();
        isDetecting = true;
        detectPose(video);
    });

    // File input
    document.getElementById('fileInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type.startsWith('image/')) {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => detectPose(img);
        } else if (file.type.startsWith('video/')) {
            video.src = URL.createObjectURL(file);
            video.style.display = 'block';
            document.getElementById('upload-prompt').style.display = 'none';
            video.play();
            isDetecting = true;
            detectPose(video);
        }
    });
});

function updateButtons() {
    const buttons = ['uploadBtn', 'videoBtn', 'liveBtn'];
    buttons.forEach(id => {
        const btn = document.getElementById(id);
        btn.className = id.includes(mode) ? 'active' : '';
    });
}
