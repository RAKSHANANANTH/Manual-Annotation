let image = null;
let annotations = [];
let mode = 'point'; // 'point' or 'box'
let isDrawing = false;
let startX = 0, startY = 0;
let tempBox = null;
let justDrewBox = false;

document.addEventListener('DOMContentLoaded', () => {
    const imageUpload = document.getElementById('imageUpload');
    const fileChosen = document.getElementById('file-chosen');
    const pointModeBtn = document.getElementById('point-mode-btn');
    const boxModeBtn = document.getElementById('box-mode-btn');
    const clearBtn = document.getElementById('clearBtn');
    const annotationDataDiv = document.getElementById('annotationData');
    const saveBtn = document.getElementById('save-button');
    const saveFormat = document.getElementById('save-format');
    const canvas = document.getElementById('annotationCanvas');
    const ctx = canvas ? canvas.getContext('2d') : null;
    const removeImageBtn = document.getElementById('removeImageBtn');
    // Remove Image button logic
    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', function() {
            image = null;
            annotations = [];
            fileChosen.textContent = 'No file chosen';
            imageUpload.value = '';
            pointModeBtn.disabled = true;
            boxModeBtn.disabled = true;
            pointModeBtn.classList.remove('active-mode');
            boxModeBtn.classList.remove('active-mode');
            if (canvas) canvas.style.cursor = 'default';
            draw();
            updateAnnotationData();
        });
    }
    // Always disable annotation mode buttons on load (force)
    if (pointModeBtn && boxModeBtn) {
        pointModeBtn.disabled = true;
        boxModeBtn.disabled = true;
        pointModeBtn.classList.remove('active-mode');
        boxModeBtn.classList.remove('active-mode');
        // Remove focus/active from Point Mode if any
        setTimeout(() => {
            pointModeBtn.blur();
            boxModeBtn.blur();
        }, 0);
    }
    // Show selected file name, enable buttons, and load image after upload
    if (imageUpload && fileChosen && pointModeBtn && boxModeBtn) {
        imageUpload.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                fileChosen.textContent = file.name;
                // Load image and draw
                const reader = new FileReader();
                reader.onload = function(ev) {
                    image = new window.Image();
                    image.onload = function() {
                        // Enable annotation buttons only after image is loaded
                        pointModeBtn.disabled = false;
                        boxModeBtn.disabled = false;
                        // Set default mode to point
                        pointModeBtn.classList.add('active-mode');
                        boxModeBtn.classList.remove('active-mode');
                        mode = 'point';
                        canvas.style.cursor = 'pointer';
                        draw();
                    };
                    image.src = ev.target.result;
                };
                reader.readAsDataURL(file);
            } else {
                fileChosen.textContent = 'No file chosen';
                pointModeBtn.disabled = true;
                boxModeBtn.disabled = true;
                pointModeBtn.classList.remove('active-mode');
                boxModeBtn.classList.remove('active-mode');
                mode = 'point';
                draw();
            }
        });
    }



    function draw() {
        if (!canvas || !ctx) return;
        console.log('draw() called. image:', image);
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
            if (pt.name) {
                ctx.font = '14px Varela Round, Arial, sans-serif';
                ctx.fillStyle = 'black';
                ctx.fillText(pt.name, pt.x + 8, pt.y - 8);
            }
        });
        // Draw boxes
        annotations.filter(a => a.type === 'box').forEach(box => {
            ctx.strokeStyle = 'blue';
            ctx.lineWidth = 2;
            ctx.strokeRect(box.x, box.y, box.width, box.height);
            if (box.name) {
                ctx.font = '14px Varela Round, Arial, sans-serif';
                ctx.fillStyle = 'blue';
                ctx.fillText(box.name, box.x + 4, box.y - 6);
            }
        });
        // Draw temp box if drawing
        if (tempBox) {
            ctx.strokeStyle = 'green';
            ctx.lineWidth = 2;
            ctx.strokeRect(tempBox.x, tempBox.y, tempBox.width, tempBox.height);
        }
    }

// (Removed duplicate imageUpload change handler)

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
            justDrewBox = false;
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
            const name = prompt('Enter a name for this bounding box:', '');
            annotations.push({ ...tempBox, type: 'box', name: name || '' });
            tempBox = null;
            isDrawing = false;
            justDrewBox = true;
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
            if (justDrewBox) {
                justDrewBox = false;
                return;
            }
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const name = prompt('Enter a name for this point:', '');
            annotations.push({ x, y, type: 'point', name: name || '' });
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
        annotationDataDiv.innerHTML = '';
        if (annotations.length === 0) {
            annotationDataDiv.textContent = 'No annotations yet.';
            return;
        }
        annotations.forEach((ann, idx) => {
            const wrapper = document.createElement('div');
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'center';
            wrapper.style.justifyContent = 'space-between';
            wrapper.style.marginBottom = '2px';
            const text = document.createElement('span');
            text.textContent = ann.type === 'point'
                ? `Point (${ann.x.toFixed(1)}, ${ann.y.toFixed(1)})`
                : `Box (${ann.x.toFixed(1)}, ${ann.y.toFixed(1)}, ${ann.width.toFixed(1)}, ${ann.height.toFixed(1)})`;
            const delBtn = document.createElement('button');
            delBtn.textContent = '×';
            delBtn.title = 'Delete annotation';
            delBtn.style.marginLeft = '8px';
            delBtn.style.background = '#ff4d4f';
            delBtn.style.color = '#fff';
            delBtn.style.border = 'none';
            delBtn.style.borderRadius = '50%';
            delBtn.style.width = '22px';
            delBtn.style.height = '22px';
            delBtn.style.cursor = 'pointer';
            delBtn.onclick = () => {
                annotations.splice(idx, 1);
                draw();
                updateAnnotationData();
            };
            wrapper.appendChild(text);
            wrapper.appendChild(delBtn);
            annotationDataDiv.appendChild(wrapper);
        });
    }

    // Save Annotations button logic
    if (saveBtn && saveFormat) {
        saveBtn.addEventListener('click', function() {
            if (!annotations.length) {
                alert('No annotations to save!');
                return;
            }
            const format = saveFormat.value;
            let dataStr, fileName;
            if (format === 'json') {
                dataStr = JSON.stringify(annotations, null, 2);
                const blob = new Blob([dataStr], {type: 'application/json'});
                triggerDownload(blob, 'annotations.json');
            } else if (format === 'csv') {
                let csv = 'type,x,y,width,height,name\n';
                // List all points first
                annotations.filter(a => a.type === 'point').forEach(a => {
                    csv += `point,${a.x},${a.y},,,${a.name ? '"' + a.name.replace(/"/g, '""') + '"' : ''}\n`;
                });
                // Then all boxes
                annotations.filter(a => a.type === 'box').forEach(a => {
                    csv += `box,${a.x},${a.y},${a.width},${a.height},${a.name ? '"' + a.name.replace(/"/g, '""') + '"' : ''}\n`;
                });
                const blob = new Blob([csv], {type: 'text/csv'});
                triggerDownload(blob, 'annotations.csv');
            } else if (format === 'png' || format === 'jpg') {
                if (!canvas) {
                    alert('Canvas not found!');
                    return;
                }
                let mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
                let ext = format === 'png' ? 'png' : 'jpg';
                canvas.toBlob(function(blob) {
                    triggerDownload(blob, `annotations.${ext}`);
                }, mimeType);
            } else {
                alert('Unknown format!');
                return;
            }

        function triggerDownload(blob, fileName) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        }
        });
    }

    // Do not set default mode until image is loaded
});