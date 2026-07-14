document.addEventListener('DOMContentLoaded', () => {
    const UI = {
        dropzone: document.getElementById('dropzone'),
        fileInput: document.getElementById('fileInput'),
        scanImg: document.getElementById('scanImg'),
        dropEmpty: document.getElementById('dropEmpty'),
        analyzeBtn: document.getElementById('analyzeBtn'),
        resetBtn: document.getElementById('resetBtn'),
        fileLabel: document.getElementById('fileLabel'),
        sweep: document.getElementById('sweep'),
        gridOverlay: document.getElementById('gridOverlay'),
        analyzingTag: document.getElementById('analyzingTag'),
        placeholder: document.getElementById('placeholder'),
        verdict: document.getElementById('verdict'),
        verdictDot: document.getElementById('verdictDot'),
        verdictLabel: document.getElementById('verdictLabel'),
        verdictConf: document.getElementById('verdictConf'),
        barList: document.getElementById('barList'),
        statusPill: document.getElementById('statusPill'),
        statusDot: document.getElementById('statusDot'),
        statusText: document.getElementById('statusText'),
        modelError: document.getElementById('modelError'),
    };

    const CLASS_META = {
        glioma:     { name: 'Glioma Tumor',     color: '#ef4444' }, // Red
        meningioma: { name: 'Meningioma',       color: '#f59e0b' }, // Amber
        pituitary:  { name: 'Pituitary Tumor',  color: '#8b5cf6' }, // Purple
        notumor:    { name: 'No Tumor Detected',color: '#10b981' }, // Green
    };

    const IMG_SIZE = 150;
    
    let state = {
        model: null,
        idxToClass: null,
        hasFile: false
    };

    async function initModel() {
        try {
            // Updated paths to look for tfjs_model in the same directory as index.html
            const modelPath = './tfjs_model/model.json';
            const classPath = './tfjs_model/class_indices.json';
            
            const [loadedModel, classRes] = await Promise.all([
                tf.loadLayersModel(modelPath),
                fetch(classPath).then(r => {
                    if(!r.ok) throw new Error('class_indices.json missing');
                    return r.json();
                })
            ]);
            
            state.model = loadedModel;
            state.idxToClass = classRes;
            
            // Update UI to success
            UI.statusDot.style.background = 'var(--success)';
            UI.statusDot.style.boxShadow = '0 0 12px var(--success)';
            UI.statusText.textContent = 'SYSTEM ONLINE · MODEL LOADED';
            UI.statusPill.style.color = 'var(--success)';
            UI.statusPill.style.borderColor = 'rgba(16, 185, 129, 0.3)';
            UI.statusPill.style.background = 'rgba(16, 185, 129, 0.1)';
        } catch(err) {
            console.error('Model initialization failed:', err);
            UI.statusDot.style.background = 'var(--danger)';
            UI.statusDot.style.boxShadow = '0 0 12px var(--danger)';
            UI.statusDot.style.animation = 'none';
            UI.statusText.textContent = 'MODEL OFFLINE';
            UI.statusPill.style.color = 'var(--danger)';
            UI.statusPill.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            UI.statusPill.style.background = 'rgba(239, 68, 68, 0.1)';
            UI.modelError.style.display = 'block';
        }
    }

    // Drag & Drop Handlers
    UI.dropzone.addEventListener('click', () => { if(!state.hasFile) UI.fileInput.click(); });
    
    ['dragover', 'dragenter'].forEach(evt => {
        UI.dropzone.addEventListener(evt, e => {
            e.preventDefault();
            if(!state.hasFile) UI.dropzone.style.borderColor = 'var(--cyan)';
        });
    });
    
    ['dragleave', 'drop'].forEach(evt => {
        UI.dropzone.addEventListener(evt, e => {
            e.preventDefault();
            UI.dropzone.style.borderColor = 'transparent';
        });
    });
    
    UI.dropzone.addEventListener('drop', e => {
        const file = e.dataTransfer.files[0];
        if(file) handleFileUpload(file);
    });
    
    UI.fileInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if(file) handleFileUpload(file);
    });

    function handleFileUpload(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please upload a valid image file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = e => {
            UI.scanImg.src = e.target.result;
            UI.scanImg.classList.add('show');
            UI.dropEmpty.style.display = 'none';
            UI.dropzone.classList.add('has-image');
            
            // Format filename
            const name = file.name;
            UI.fileLabel.textContent = name.length > 25 ? name.substring(0, 22) + '...' : name;
            
            UI.analyzeBtn.disabled = !state.model;
            state.hasFile = true;
        };
        reader.readAsDataURL(file);
    }

    UI.analyzeBtn.addEventListener('click', runInference);

    async function runInference() {
        if(!state.model) return;

        // UI Transition to processing state
        UI.analyzeBtn.disabled = true;
        UI.analyzeBtn.innerHTML = '<svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite; margin-right: 8px;"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg> Processing...';
        
        UI.resetBtn.style.display = 'none';
        UI.verdict.classList.remove('show');
        UI.placeholder.style.display = 'flex';

        // Start animations
        UI.sweep.classList.remove('active'); 
        void UI.sweep.offsetWidth; // Trigger reflow
        UI.sweep.classList.add('active');
        UI.gridOverlay.classList.add('active');
        UI.analyzingTag.classList.add('show');

        // Artificial delay for UI effect + actual model prediction
        const [predictions] = await Promise.all([
            predictImage(UI.scanImg),
            new Promise(resolve => setTimeout(resolve, 2000)) // 2s scanning effect
        ]);

        // Stop animations
        UI.sweep.classList.remove('active');
        UI.gridOverlay.classList.remove('active');
        UI.analyzingTag.classList.remove('show');

        renderResults(predictions);

        // Reset buttons
        UI.analyzeBtn.disabled = false;
        UI.analyzeBtn.innerHTML = 'Run Analysis';
        UI.resetBtn.style.display = 'flex';
    }

    async function predictImage(imgElement) {
        return tf.tidy(() => {
            let tensor = tf.browser.fromPixels(imgElement, 3)
                .resizeBilinear([IMG_SIZE, IMG_SIZE])
                .toFloat()
                .div(255.0)
                .expandDims(0);
            
            const output = state.model.predict(tensor);
            const probabilities = output.dataSync();
            return Array.from(probabilities);
        });
    }

    function renderResults(probabilities) {
        // Map probabilities to classes
        const results = probabilities
            .map((prob, index) => ({ 
                prob: prob * 100, 
                key: state.idxToClass[index] 
            }))
            .sort((a, b) => b.prob - a.prob);

        const primaryResult = results[0];
        const meta = CLASS_META[primaryResult.key] || { name: primaryResult.key, color: '#06b6d4' };

        // Hide placeholder, show verdict
        UI.placeholder.style.display = 'none';
        UI.verdict.classList.add('show');

        // Set primary verdict
        UI.verdictDot.style.background = meta.color;
        UI.verdictDot.style.color = meta.color; // for box-shadow
        UI.verdictLabel.textContent = meta.name;
        UI.verdictLabel.style.color = meta.color;
        
        const confidenceStr = primaryResult.prob.toFixed(1) + '%';
        UI.verdictConf.textContent = confidenceStr + ' CONFIDENCE';
        
        // Add dynamic glowing styling based on the result
        UI.verdictConf.style.color = meta.color;
        UI.verdictConf.style.border = `1px solid ${meta.color}40`;
        UI.verdictConf.style.background = `${meta.color}10`;

        // Render bars
        UI.barList.innerHTML = '';
        results.forEach((item, index) => {
            const itemMeta = CLASS_META[item.key] || { name: item.key, color: '#06b6d4' };
            const barHTML = `
                <div class="bar-row">
                    <div class="bar-header">
                        <span>${itemMeta.name}</span>
                        <span class="bar-pct">${item.prob.toFixed(1)}%</span>
                    </div>
                    <div class="bar-track">
                        <div class="bar-fill" style="background: ${itemMeta.color}; width: 0%;"></div>
                    </div>
                </div>
            `;
            UI.barList.insertAdjacentHTML('beforeend', barHTML);
            
            // Animate bar width after a tiny delay
            setTimeout(() => {
                const fillElement = UI.barList.querySelectorAll('.bar-fill')[index];
                if (fillElement) fillElement.style.width = item.prob + '%';
            }, 50 + (index * 100));
        });
    }

    UI.resetBtn.addEventListener('click', () => {
        // Reset image and dropzone
        UI.scanImg.classList.remove('show');
        setTimeout(() => { UI.scanImg.src = ''; }, 300); // clear after fade out
        
        UI.dropEmpty.style.display = 'block';
        UI.dropzone.classList.remove('has-image');
        UI.fileLabel.textContent = 'No file selected';
        UI.fileInput.value = '';
        state.hasFile = false;
        
        // Reset states
        UI.analyzeBtn.disabled = true;
        UI.resetBtn.style.display = 'none';
        
        // Reset results
        UI.verdict.classList.remove('show');
        setTimeout(() => {
            UI.placeholder.style.display = 'flex';
        }, 300);
    });

    // Add CSS for spinner animation if not present
    if (!document.getElementById('spinner-style')) {
        const style = document.createElement('style');
        style.id = 'spinner-style';
        style.innerHTML = `@keyframes spin { 100% { transform: rotate(360deg); } }`;
        document.head.appendChild(style);
    }

    // Init Model on load
    initModel();
});
