// DATA MANAGEMENT
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
    renderTable(); // Re-render table on save
}

let dossiers = getDossiers();

// FILTER LOGIC
let currentFilter = 'all';
let currentPage = 1;
const itemsPerPage = 10;

function setFilter(status, element) {
    currentFilter = status;
    currentPage = 1;

    // Update UI
    document.querySelectorAll('.filter-tab').forEach(el => el.classList.remove('active'));
    element.classList.add('active');

    renderTable();
}

// RENDER TABLE
function renderTable() {
    dossiers = getDossiers(); // Refresh data
    const tbody = document.getElementById('table-body');
    const paginationContainer = document.getElementById('pagination-container');

    // Filter Logic
    const filtered = dossiers.filter(d => {
        if (currentFilter === 'all') return true;
        if (currentFilter === 'pending') return d.status === 'pending' || d.status === 'waiting_step2';
        if (currentFilter === 'done') return d.status === 'approved' || d.status === 'completed';
        return d.status === currentFilter;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = '<div style="padding:40px;text-align:center;color:var(--gray-400);grid-column:1/-1">Aucun dossier trouvé.</div>';
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }

    // Pagination Logic
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedItems = filtered.slice(start, end);

    // Clear existing content
    tbody.innerHTML = '';

    // Create rows
    const rows = paginatedItems.map((d) => {
        const s1 = d.step1 || {};
        const s2 = d.step2 || {};

        let statusClass = '';
        let statusText = '';

        // Determine Status Display
        switch (d.status) {
            case 'pending':
                statusClass = 'status-pending'; statusText = 'Nouveau'; break;
            case 'waiting_step2':
                statusClass = 'status-pending'; statusText = 'En attente pièces'; break;
            case 'completed':
                statusClass = 'status-pending'; statusText = 'À valider'; break;
            case 'approved':
                statusClass = 'status-done'; statusText = 'Approuvé'; break;
            case 'rejected':
                statusClass = 'status-rejected'; statusText = 'Rejeté'; break;
            default:
                statusClass = 'status-pending'; statusText = d.status;
        }

        const row = document.createElement('div');
        row.className = `dossier-row fade-in`;
        row.onclick = () => openModal(d.id);
        row.innerHTML = `
            <div class="cell-id" data-label="ID">#${d.id.substring(0, 8)}...</div>
            <div class="cell-main" data-label="Candidat">
                <div>${s1.fullname || 'Inconnu'}</div>
                <div class="cell-sub">${s1.email || '-'}</div>
            </div>
            <div class="cell-main" data-label="Établissement">
                <div>${s1.schoolName || 'Sans nom'}</div>
                <div class="cell-sub">${s1.typeEtab || '-'}</div>
            </div>
            <div class="cell-sub" data-label="Dép.">${s1.departement || '-'}</div>
            <div data-label="Statut"><span class="status-badge ${statusClass}">${statusText}</span></div>
            <div class="cell-sub" data-label="Date">${new Date(d.createdAt).toLocaleDateString()}</div>
            <div style="display:flex;justify-content:center">
                <div class="action-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                </div>
            </div>
        `;
        return row;
    });

    // Append rows
    rows.forEach(row => tbody.appendChild(row));

    renderPagination(totalPages, filtered.length, start + 1, Math.min(end, filtered.length));
}

function renderPagination(totalPages, totalItems, rangeStart, rangeEnd) {
    const container = document.getElementById('pagination-container');
    if (!container) return;

    if (totalItems === 0) {
        container.innerHTML = '';
        return;
    }

    let pagesHTML = '';
    for (let i = 1; i <= totalPages; i++) {
        pagesHTML += `
            <button class="page-num ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">
                ${i}
            </button>
        `;
    }

    container.innerHTML = `
        <div class="pagination-wrapper">
            <div class="pagination-info">
                ${rangeStart}-${rangeEnd} sur ${totalItems}
            </div>
            <div class="pagination-controls">
                <button class="page-arrow" onclick="changePage(-1)" ${currentPage === 1 ? 'disabled' : ''}>
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <div class="page-numbers">
                    ${pagesHTML}
                </div>
                <button class="page-arrow" onclick="changePage(1)" ${currentPage === totalPages ? 'disabled' : ''}>
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
            </div>
        </div>
    `;
}

function changePage(direction) {
    currentPage += direction;
    renderTable();
}

function goToPage(page) {
    currentPage = page;
    renderTable();
}

// MODAL LOGIC
let currentDossierId = null;

function openModal(id) {
    currentDossierId = id;
    dossiers = getDossiers(); // Refresh
    const d = dossiers.find(x => x.id === id);
    if (!d) return;

    const s1 = d.step1 || {};
    const s2 = d.step2 || {};
    const modal = document.getElementById('detail-modal');
    const content = document.getElementById('modal-content');

    let actionButtons = '';
    let filesHTML = '';
    let statusMessage = '';

    // Logic based on status
    if (d.status === 'pending') {
        statusMessage = `<div style="padding:10px; background:#fff7ed; color:#ea580c; border-radius:8px; margin-bottom:15px; font-size:0.9rem;">
            <strong>Nouveau dossier :</strong> En attente de traitement initial.
        </div>`;
        actionButtons = `
            <button onclick="processDossier('${d.id}')" style="width:100%; padding:12px; background:var(--blue); color:white; border:none; border-radius:12px; font-weight:600; cursor:pointer;">
                Traiter & Envoyer Lien
            </button>
        `;
        filesHTML = `<div style="color:var(--gray-400); font-style:italic;">Aucun document soumis pour le moment.</div>`;

    } else if (d.status === 'waiting_step2') {
        statusMessage = `<div style="padding:10px; background:#eff6ff; color:#1d4ed8; border-radius:8px; margin-bottom:15px; font-size:0.9rem;">
            <strong>En cours :</strong> Le candidat a reçu le lien et doit déposer ses pièces.
        </div>`;
        actionButtons = `
             <button style="width:100%; padding:12px; background:var(--gray-200); color:var(--gray-600); border:none; border-radius:12px; font-weight:600; cursor:not-allowed;" disabled>
                En attente du candidat...
            </button>
        `;
        filesHTML = `<div style="color:var(--gray-400); font-style:italic;">En attente des fichiers...</div>`;

    } else if (d.status === 'completed') {
        statusMessage = `<div style="padding:10px; background:#f0fdf4; color:#15803d; border-radius:8px; margin-bottom:15px; font-size:0.9rem;">
            <strong>Complet :</strong> Les pièces ont été fournies. À vous de valider.
        </div>`;

        // Show files
        if (s2.files && s2.files.length > 0) {
            filesHTML = s2.files.map((f, index) => {
                let actionLinks = `<span style="color:var(--gray-400); font-size:0.85rem;">Indisponible</span>`;

                if (f.content) {
                    actionLinks = `
                        <a href="#" onclick="viewFile(${index}, '${d.id}'); return false;" style="color:var(--blue); font-size:0.85rem; text-decoration:none; margin-right:10px;">Visualiser</a>
                        <a href="${f.content}" download="${f.fileName}" style="color:var(--gray-600); font-size:0.85rem; text-decoration:none;">Télécharger</a>
                     `;
                }

                return `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:var(--gray-50); border-radius:8px; margin-bottom:8px;">
                    <span style="font-weight:500; font-size:0.9rem;">${f.name}</span>
                    <div>${actionLinks}</div>
                </div>
            `}).join('');
        } else {
            filesHTML = `<div style="color:var(--gray-400); font-style:italic;">Aucun fichier trouvé (Erreur ?).</div>`;
        }

        actionButtons = `
            <div style="display:flex; gap:10px; margin-bottom:12px;">
                <button onclick="rejectDossier('${d.id}')" style="flex:1; padding:12px; background:#fee2e2; color:#ef4444; border:none; border-radius:12px; font-weight:600; cursor:pointer;">
                    Refuser
                </button>
                <button onclick="validateDossier('${d.id}')" style="flex:1; padding:12px; background:#dcfce7; color:#16a34a; border:none; border-radius:12px; font-weight:600; cursor:pointer;">
                    Valider (Dossier OK)
                </button>
            </div>
            <button onclick="setRendezVous('${d.id}')" style="width:100%; padding:12px; background:var(--blue-light); color:var(--blue-dark); border:none; border-radius:12px; font-weight:600; cursor:pointer;">
                📅 Définir un Rendez-vous
            </button>
        `;

    } else if (d.status === 'approved') {
        statusMessage = `<div style="padding:10px; background:#dcfce7; color:#16a34a; border-radius:8px; margin-bottom:15px; font-size:0.9rem;">
            <strong>Approuvé :</strong> Ce dossier a été validé.
        </div>`;

        if (s2.files && s2.files.length > 0) {
            filesHTML = s2.files.map(f => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:var(--gray-50); border-radius:8px; margin-bottom:8px;">
                    <span style="font-weight:500;">${f.name}</span>
                    <span style="color:var(--green); font-size:0.85rem;">Validé</span>
                </div>
            `).join('');
        }

        actionButtons = `
            <button onclick="setRendezVous('${d.id}')" style="width:100%; padding:12px; background:var(--blue-light); color:var(--blue-dark); border:none; border-radius:12px; font-weight:600; cursor:pointer; margin-bottom: 10px;">
                📅 Définir / Modifier le Rendez-vous
            </button>
            <button onclick="sendProgram('${d.id}')" style="width:100%; padding:12px; background:var(--blue); color:white; border:none; border-radius:12px; font-weight:600; cursor:pointer;">
                📅 Proposer un Programme de Visite
            </button>
        `;
    } else if (d.status === 'rejected') {
        statusMessage = `<div style="padding:10px; background:#fee2e2; color:#ef4444; border-radius:8px; margin-bottom:15px; font-size:0.9rem;">
            <strong>Rejeté :</strong> Dossier incomplet ou invalide.
        </div>`;
    }

    content.innerHTML = `
        <!-- LEFT COLUMN: INFO -->
        <div class="info-group">
            ${statusMessage}
            
            ${d.rdv ? `<div style="padding:10px; background:#f3e8ff; color:#7e22ce; border-radius:8px; margin-bottom:15px; font-size:0.9rem;">
                <strong>📅 Rendez-vous :</strong> ${d.rdv}
            </div>` : ''}

            ${d.programme ? `<div style="padding:10px; background:#e0f2fe; color:#0369a1; border-radius:8px; margin-bottom:15px; font-size:0.9rem;">
                <strong>🚙 Visite Programmée :</strong> ${d.programme}
            </div>` : ''}

            <div class="section-title">
                Informations Candidat
            </div>
            <div class="detail-item">
                <label>Établissement</label>
                <div>${s1.schoolName || '-'}</div>
            </div>
            <div class="detail-item">
                <label>Promoteur</label>
                <div>${s1.fullname || '-'}</div>
            </div>
            <div class="detail-item">
                <label>Contact</label>
                <div>${s1.phone || '-'} • ${s1.email || '-'}</div>
            </div>
             <div class="detail-item">
                <label>Type / Département</label>
                <div>${s1.typeEtab || '-'} • ${s1.departement || '-'}</div>
            </div>
            
            <div style="margin:24px 0;border-top:1px solid #eee"></div>
            
            <div class="section-title">Documents Fournis</div>
            ${filesHTML}
        </div>

        <!-- RIGHT COLUMN: ACTIONS -->
        <div class="progress-card" style="display:flex; flex-direction:column; justify-content:space-between;">
           <div>
               <div class="section-title" style="margin-top:0">Actions Administratives</div>
               <p style="font-size:0.9rem; color:var(--gray-600); margin-bottom:20px;">
                   Effectuez les actions ci-dessous pour faire avancer le dossier dans le workflow.
               </p>
           </div>
           
           <div>
               ${actionButtons}
           </div>
        </div>
    `;

    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('detail-modal').classList.remove('active');
}

// ADMIN ACTIONS
function processDossier(id) {
    if (!confirm("Envoyer le mail de demande de pièces au candidat ?")) return;

    dossiers = getDossiers();
    const index = dossiers.findIndex(d => d.id === id);
    if (index === -1) return;

    // Simulate sending email with link
    const s1 = dossiers[index].step1;
    const currentPath = window.location.href;
    const basePath = currentPath.substring(0, currentPath.lastIndexOf('/'));
    const link = `${basePath}/finalisationdossier.html?id=${id}`;

    alert(`[SIMULATION EMAIL]
--------------------------
À : ${s1.email}
Objet : Votre dossier ${s1.schoolName} - Étape suivante

Bonjour ${s1.fullname},

Votre demande d'ouverture a bien été reçue. 
Pour poursuivre l'instruction de votre dossier, veuillez déposer les pièces justificatives via ce lien :

${link}

Cordialement,
L'Administration.
--------------------------`);

    dossiers[index].status = 'waiting_step2';
    saveDossiers(dossiers);
    closeModal();
}

function validateDossier(id) {
    if (!confirm("Valider définitivement ce dossier ? Un mail d'approbation sera envoyé.")) return;

    dossiers = getDossiers();
    const index = dossiers.findIndex(d => d.id === id);
    if (index === -1) return;

    const s1 = dossiers[index].step1;

    alert(`[SIMULATION EMAIL]
--------------------------
À : ${s1.email}
Objet : Félicitations - Dossier Approuvé

Bonjour ${s1.fullname},

Nous avons le plaisir de vous informer que votre dossier pour ${s1.schoolName} est COMPLET et VALIDÉ.
L'arrêté d'ouverture vous sera transmis sous peu.

Cordialement,
L'Administration.
--------------------------`);

    dossiers[index].status = 'approved';
    saveDossiers(dossiers);
    closeModal();
}

function rejectDossier(id) {
    const motif = prompt("Motif du rejet (sera inclus dans le mail) :", "Pièces manquantes ou non conformes");
    if (!motif) return;

    dossiers = getDossiers();
    const index = dossiers.findIndex(d => d.id === id);
    if (index === -1) return;

    const s1 = dossiers[index].step1;

    alert(`[SIMULATION EMAIL]
--------------------------
À : ${s1.email}
Objet : MISE À JOUR - Dossier Incomplet

Bonjour ${s1.fullname},

Après examen de votre dossier pour ${s1.schoolName}, nous ne pouvons pas lui donner une suite favorable en l'état.

Motif : ${motif}

Veuillez compléter votre dossier ou nous contacter.

Cordialement,
L'Administration.
--------------------------`);

    dossiers[index].status = 'rejected';
    saveDossiers(dossiers);
    closeModal();
}

function setRendezVous(id) {
    // Redirige vers la nouvelle page de gestion des RDV (rdv.html)
    window.location.href = 'rdv.html';
}

function sendProgram(id) {
    if (!confirm("Envoyer le planning de visite proposé pour l'inspection au candidat ?")) return;

    dossiers = getDossiers();
    const index = dossiers.findIndex(d => d.id === id);
    if (index === -1) return;

    const s1 = dossiers[index].step1;
    const currentPath = window.location.href;
    const basePath = currentPath.substring(0, currentPath.lastIndexOf('/'));
    const link = `${basePath}/client_programme.html?id=${id}`;

    alert(`[SIMULATION EMAIL]
--------------------------
À : ${s1.email}
Objet : Programmation de la Visite d'Inspection - ${s1.schoolName}

Bonjour ${s1.fullname},

Votre dossier administratif étant validé, la prochaine étape est l'inspection de vos futurs locaux.
L'administration vous propose plusieurs créneaux pour cette visite.

Veuillez cliquer sur le lien ci-dessous pour choisir la date et l'heure qui vous conviennent :

${link}

Cordialement,
L'Administration pour l'Enseignement Privé.
--------------------------`);

    closeModal();
}

// Helper to view file
function viewFile(fileIndex, dossierId) {
    const d = getDossiers().find(x => x.id === dossierId);
    if (!d || !d.step2 || !d.step2.files || !d.step2.files[fileIndex]) return;

    const file = d.step2.files[fileIndex];
    if (file.content) {
        const win = window.open();
        win.document.write(`
            <iframe src="${file.content}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>
            <style>body { margin: 0; }</style>
        `);
    }
}

// Click outside modal
document.getElementById('detail-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('detail-modal')) closeModal();
});

// INIT
renderTable();
