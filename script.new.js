document.addEventListener('DOMContentLoaded', () => {
    const imageUpload = document.getElementById('imageUpload');
    const canvas = document.getElementById('annotationCanvas');
    const ctx = canvas.getContext('2d');
    const pointModeBtn = document.getElementById('pointModeBtn');
    const boxModeBtn = document.getElementById('boxModeBtn');
    const clearBtn = document.getElementById('clearBtn');
    const annotationDataDiv = document.getElementById('annotationData');

    let image = null;
    let annotations = [];
    let mode = 'point'; // 'point' or 'box'
    let isDrawing = false;
    let startX = 0, startY = 0;
    let tempBox = null;

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (image) {
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        }
        // Draw points
        annotations.filter(a => a.type === 'point').forEach(pt => {
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 5, 0, 2 * Math.PI);
            ctx.fill();
        });
        // Draw boxes
        annotations.filter(a => a.type === 'box').forEach(box => {
            ctx.strokeStyle = 'blue';
            ctx.lineWidth = 2;
            ctx.strokeRect(box.x, box.y, box.width, box.height);
        });
        // Draw temp box if drawing
        if (tempBox) {
            ctx.strokeStyle = 'green';
            ctx.lineWidth = 2;
            ctx.strokeRect(tempBox.x, tempBox.y, tempBox.width, tempBox.height);
        }
    }

    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(ev) {
                image = new window.Image();
                image.onload = function() {
                    draw();
                };
                image.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    pointModeBtn.addEventListener('click', () => {
        mode = 'point';
        pointModeBtn.classList.add('active-mode');
        boxModeBtn.classList.remove('active-mode');
        canvas.style.cursor = 'pointer';
    });
    boxModeBtn.addEventListener('click', () => {
        mode = 'box';
        boxModeBtn.classList.add('active-mode');
        pointModeBtn.classList.remove('active-mode');
        canvas.style.cursor = 'crosshair';
    });

    canvas.addEventListener('mousedown', (e) => {
        if (mode === 'box') {
            isDrawing = true;
            const rect = canvas.getBoundingClientRect();
            startX = e.clientX - rect.left;
            startY = e.clientY - rect.top;
            tempBox = { x: startX, y: startY, width: 0, height: 0 };
        }
    });
    canvas.addEventListener('mousemove', (e) => {
        if (mode === 'box' && isDrawing) {
            const rect = canvas.getBoundingClientRect();
            const currX = e.clientX - rect.left;
            const currY = e.clientY - rect.top;
            tempBox = {
                x: Math.min(startX, currX),
                y: Math.min(startY, currY),
                width: Math.abs(currX - startX),
                height: Math.abs(currY - startY)
            };
            draw();
        }
    });
    canvas.addEventListener('mouseup', (e) => {
        if (mode === 'box' && isDrawing && tempBox && tempBox.width > 0 && tempBox.height > 0) {
            annotations.push({ ...tempBox, type: 'box' });
            tempBox = null;
            isDrawing = false;
            draw();
            updateAnnotationData();
        } else if (mode === 'box') {
            tempBox = null;
            isDrawing = false;
            draw();
        }
    });
    canvas.addEventListener('click', (e) => {
        if (mode === 'point') {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            annotations.push({ x, y, type: 'point' });
            draw();
            updateAnnotationData();
        }
    });

    clearBtn.addEventListener('click', () => {
        annotations = [];
        draw();
        updateAnnotationData();
    });

    function updateAnnotationData() {
        annotationDataDiv.textContent = JSON.stringify(annotations, null, 2);
    }

    // Set default mode
    pointModeBtn.classList.add('active-mode');
    canvas.style.cursor = 'pointer';
});
