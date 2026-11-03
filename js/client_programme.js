// PLAGES HORAIRES PROPOSÉES
const programs = [
    { id: 'creneau1', title: 'Lundi 12 Mai 2026', desc: 'Matin: 09:00 - 11:30' },
    { id: 'creneau2', title: 'Mardi 13 Mai 2026', desc: 'Après-midi: 14:00 - 16:30' },
    { id: 'creneau3', title: 'Jeudi 15 Mai 2026', desc: 'Matin: 10:00 - 12:30' },
    { id: 'creneau4', title: 'Vendredi 16 Mai 2026', desc: 'Après-midi: 15:00 - 17:00' }
];

let selectedProgramId = null;
let currentDossierId = null;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Get ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentDossierId = urlParams.get('id');

    // 2. Mock initialization loading
    setTimeout(() => {
        initializePage();
    }, 800);
});

function getDossiers() {
    try {
        return JSON.parse(localStorage.getItem('promoteur_dossiers') || '[]');
    } catch (e) {
        return [];
    }
}

function saveDossiers(dossiers) {
    localStorage.setItem('promoteur_dossiers', JSON.stringify(dossiers));
}

function initializePage() {
    document.getElementById('loading').style.display = 'none';

    if (!currentDossierId) {
        // No ID, simulated mode or error mode
        document.getElementById('greeting-title').innerText = "Programmation de Visite (Démo)";
    } else {
        const dossiers = getDossiers();
        const dossier = dossiers.find(d => d.id === currentDossierId);
        if (dossier && dossier.step1) {
            document.getElementById('greeting-title').innerText = `Bonjour ${dossier.step1.fullname}`;
            document.getElementById('greeting-desc').innerText = `Voici les propositions de l'administration pour la visite de votre établissement : ${dossier.step1.schoolName}. Veuillez choisir celle qui vous convient.`;

            // Si le programme est déjà sélectionné
            if (dossier.programme) {
                selectedProgramId = dossier.programme;
            }
        }
    }

    renderPrograms();
    document.getElementById('slots-grid').style.display = 'grid';
    document.getElementById('booking-actions').style.display = 'block';

    updateSelection();
}

function renderPrograms() {
    const grid = document.getElementById('slots-grid');
    grid.innerHTML = '';

    programs.forEach(prog => {
        const div = document.createElement('div');
        div.className = `slot-card ${prog.id === selectedProgramId ? 'selected' : ''}`;
        div.onclick = () => selectProgram(prog.id, div);

        div.innerHTML = `
            <div class="slot-checkbox"></div>
            <div class="slot-details">
                <div class="slot-date">${prog.title}</div>
                <div class="slot-time">${prog.desc}</div>
            </div>
        `;
        grid.appendChild(div);
    });
}

function selectProgram(id, element) {
    selectedProgramId = id;

    // UI updates
    document.querySelectorAll('.slot-card').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');

    updateSelection();
}

function updateSelection() {
    const display = document.getElementById('selected-display');
    const btn = document.getElementById('btn-submit');

    if (selectedProgramId) {
        const prog = programs.find(p => p.id === selectedProgramId);
        display.innerText = prog.title;
        display.style.fontWeight = '600';
        btn.disabled = false;
    } else {
        display.innerText = "Aucun";
        display.style.fontWeight = '400';
        btn.disabled = true;
    }
}

function confirmProgram() {
    const btn = document.getElementById('btn-submit');
    btn.innerText = "Enregistrement...";
    btn.disabled = true;

    // Simulate API call
    setTimeout(() => {
        if (currentDossierId) {
            // Sauvegarder dans le localStorage pour la persistance locale
            const dossiers = getDossiers();
            const index = dossiers.findIndex(d => d.id === currentDossierId);
            if (index !== -1) {
                const prog = programs.find(p => p.id === selectedProgramId);
                dossiers[index].programme = `${prog.title} - ${prog.desc}`;
                saveDossiers(dossiers);
            }
        }

        // Show success state
        document.getElementById('main-container').style.display = 'none';

        const successState = document.getElementById('success-state');
        successState.style.display = 'flex';

        // Petite animation
        successState.style.opacity = '0';
        successState.style.transform = 'translateY(10px)';
        successState.style.transition = 'all 0.5s ease';

        requestAnimationFrame(() => {
            successState.style.opacity = '1';
            successState.style.transform = 'translateY(0)';
        });

    }, 1000);
}
