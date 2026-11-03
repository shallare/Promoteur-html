// DASHBOARD LOGIC

// 1. DATA MANAGEMENT
function getDossiers() {
    try {
        return JSON.parse(localStorage.getItem('promoteur_dossiers') || '[]');
    } catch (e) {
        console.error("Error parsing dossiers", e);
        return [];
    }
}

function saveDossiers(dossiers) {
    localStorage.setItem('promoteur_dossiers', JSON.stringify(dossiers));
    renderDashboard();
}

// 2. RENDER DASHBOARD
function renderDashboard() {
    const dossiers = getDossiers();
    const pendingDossiers = dossiers.filter(d => d.status === 'pending');

    // Update Stats
    const totalEl = document.querySelectorAll('.stat-card .value')[0];
    const pendingEl = document.querySelectorAll('.stat-card .value')[1];
    const treatedEl = document.querySelectorAll('.stat-card .value')[2];

    if (totalEl) totalEl.textContent = dossiers.length;
    if (pendingEl) pendingEl.textContent = pendingDossiers.length;
    if (treatedEl) treatedEl.textContent = dossiers.filter(d => d.status === 'completed' || d.status === 'approved').length;

    // Render Pending
    const pendingGrid = document.getElementById('pending-grid');
    const pendingHeader = document.getElementById('pending-header');

    if (pendingGrid && pendingHeader) {
        if (pendingDossiers.length > 0) {
            pendingHeader.style.display = 'block';
            pendingGrid.style.display = 'grid';
            pendingGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
            pendingGrid.style.gap = '20px';

            pendingGrid.innerHTML = pendingDossiers.map(d => {
                // Safety check for step1 data
                const step1 = d.step1 || {};
                return `
                <div class="folder-card" style="border-left: 4px solid #F97316;">
                    <div class="folder-top">
                        <div class="folder-icon orange">
                            <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                        </div>
                        <span style="font-size:0.75rem; font-weight:600; color:#F97316; background:#fff7ed; padding:4px 8px; border-radius:4px;">NOUVEAU</span>
                    </div>
                    <div class="folder-info">
                        <h4>${step1.schoolName || 'Sans Nom'}</h4>
                        <p>${step1.fullname || 'Inconnu'}</p>
                        <p style="font-size:0.8rem; color:gray; margin-top:4px;">${step1.typeEtab || '-'} • ${step1.departement || '-'}</p>
                    </div>
                    <div class="folder-progress" style="margin-top:16px; border-top:1px solid #f0f0f0; padding-top:12px;">
                        <button onclick="approveDossier('${d.id}')" style="width:100%; padding:10px; background:#1565C0; color:white; border:none; border-radius:8px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="white" fill="none" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            Traiter & Envoyer Lien
                        </button>
                    </div>
                </div>
            `}).join('');
        } else {
            pendingHeader.style.display = 'none';
            pendingGrid.style.display = 'none';
        }
    }
}

// 3. ACTIONS
function approveDossier(id) {
    const dossiers = getDossiers();
    const index = dossiers.findIndex(d => d.id === id);
    if (index === -1) return;

    // Approve
    dossiers[index].status = 'approved';
    saveDossiers(dossiers);

    // Simulate Email Sending
    const currentPath = window.location.href;
    const basePath = currentPath.substring(0, currentPath.lastIndexOf('/'));
    const link = `${basePath}/finalisationdossier.html?id=${id}`;

    // Safety check for email/name
    const step1 = dossiers[index].step1 || {};

    alert(`[SIMULATION EMAIL]
    
À: ${step1.email || 'N/A'}
Sujet: Votre dossier a été validé - Suite

Bonjour ${step1.fullname || 'Cher Promoteur'},

Votre demande initiale a été traitée avec succès.
Veuillez cliquer sur le lien suivant pour compléter votre dossier (Step 2 & 3) :

${link}
    `);
}

// TOAST
function simulateNewDossier() {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.classList.add('active');
        setTimeout(() => {
            toast.classList.remove('active');
        }, 4000);
    }
}

// INIT
document.addEventListener('DOMContentLoaded', renderDashboard);

function saveDossiers(dossiers) {
    localStorage.setItem('promoteur_dossiers', JSON.stringify(dossiers));
    renderDashboard();
}

// 2. RENDER DASHBOARD
function renderDashboard() {
    const dossiers = getDossiers();
    const pendingDossiers = dossiers.filter(d => d.status === 'pending');

    // Update Stats
    document.querySelectorAll('.stat-card .value')[0].textContent = dossiers.length; // Total
    document.querySelectorAll('.stat-card .value')[1].textContent = pendingDossiers.length; // En attente
    document.querySelectorAll('.stat-card .value')[2].textContent = dossiers.filter(d => d.status === 'completed' || d.status === 'approved').length; // Traités

    // Render Pending
    const pendingGrid = document.getElementById('pending-grid');
    const pendingHeader = document.getElementById('pending-header');

    if (pendingDossiers.length > 0) {
        pendingHeader.style.display = 'block';
        pendingGrid.style.display = 'grid'; // grid from CSS class
        pendingGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
        pendingGrid.style.gap = '20px';

        pendingGrid.innerHTML = pendingDossiers.map(d => `
            <div class="folder-card" style="border-left: 4px solid var(--orange);">
                <div class="folder-top">
                    <div class="folder-icon orange">
                        <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                    </div>
                    <span style="font-size:0.75rem; font-weight:600; color:var(--orange); background:var(--orange-light); padding:4px 8px; border-radius:4px;">NOUVEAU</span>
                </div>
                <div class="folder-info">
                    <h4>${d.step1.schoolName || 'Sans Nom'}</h4>
                    <p>${d.step1.fullname}</p>
                    <p style="font-size:0.8rem; color:gray; margin-top:4px;">${d.step1.typeEtab} • ${d.step1.departement}</p>
                </div>
                <div class="folder-progress" style="margin-top:16px; border-top:1px solid #f0f0f0; padding-top:12px;">
                    <button onclick="approveDossier('${d.id}')" style="width:100%; padding:10px; background:var(--blue); color:white; border:none; border-radius:8px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="white" fill="none" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        Traiter & Envoyer Lien
                    </button>
                </div>
            </div>
        `).join('');
    } else {
        pendingHeader.style.display = 'none';
        pendingGrid.style.display = 'none';
    }
}

// 3. ACTIONS
function approveDossier(id) {
    const dossiers = getDossiers();
    const index = dossiers.findIndex(d => d.id === id);
    if (index === -1) return;

    // Approve
    dossiers[index].status = 'approved';
    saveDossiers(dossiers);

    // Simulate Email Sending
    // We construct the URL. Assuming the file is on the same level.
    const currentPath = window.location.href;
    const basePath = currentPath.substring(0, currentPath.lastIndexOf('/'));
    const link = `${basePath}/promotionproject.html?id=${id}`;

    alert(`[SIMULATION EMAIL]
    
À: ${dossiers[index].step1.email}
Sujet: Votre dossier a été validé - Suite

Bonjour ${dossiers[index].step1.fullname},

Votre demande initiale a été traitée avec succès.
Veuillez cliquer sur le lien suivant pour compléter votre dossier (Step 2 & 3) :

${link}
    `);
}

// TOAST
function simulateNewDossier() {
    const toast = document.getElementById('toast');
    toast.classList.add('active');
    setTimeout(() => {
        toast.classList.remove('active');
    }, 4000);
}

// INIT
document.addEventListener('DOMContentLoaded', renderDashboard);
