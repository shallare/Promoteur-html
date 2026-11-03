// DATA HELPERS
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

function getAvailabilities() {
    try {
        return JSON.parse(localStorage.getItem('promoteur_rdv_slots') || '{}');
    } catch (e) {
        return {};
    }
}

function saveAvailabilities(slots) {
    localStorage.setItem('promoteur_rdv_slots', JSON.stringify(slots));
}

// STATE
let dossierId = null;
let currentDossier = null;
let selectedDateId = null; // "YYYY-MM-DD"
let originalTime = null; // "HH:MM"

// INIT
document.addEventListener('DOMContentLoaded', () => {
    // Get ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    dossierId = urlParams.get('id');

    if (!dossierId) {
        document.getElementById('loading').textContent = "Lien invalide ou expiré.";
        return;
    }

    const dossiers = getDossiers();
    currentDossier = dossiers.find(d => d.id === dossierId);

    if (!currentDossier) {
        document.getElementById('loading').textContent = "Dossier introuvable.";
        return;
    }

    // Checking if already booked
    if (currentDossier.rdv) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('greeting-title').textContent = "Rendez-vous déjà fixé";
        document.getElementById('greeting-desc').innerHTML = `
            Votre rendez-vous pour <strong>${currentDossier.step1.schoolName}</strong> a déjà été programmé au :<br>
            <strong style="color:var(--blue); font-size:1.1rem; display:block; margin-top:8px">${currentDossier.rdv}</strong>
        `;
        return;
    }

    // Set Welcome info
    document.getElementById('greeting-title').textContent = `Bienvenue, ${currentDossier.step1.fullname}`;
    document.getElementById('greeting-desc').textContent = `Veuillez sélectionner un créneau horaire disponible ci-dessous pour votre rendez-vous de validation pour ${currentDossier.step1.schoolName}.`;

    renderAvailableSlots();
});

function renderAvailableSlots() {
    const list = currentDossier.proposedRdvs || [];
    const grid = document.getElementById('slots-grid');
    document.getElementById('loading').style.display = 'none';

    if (list.length === 0) {
        grid.style.display = 'block';
        grid.innerHTML = `<div style="text-align:center; color:var(--gray-600); grid-column:1/-1">Aucun créneau proposé par l'administration pour le moment. Veuillez réessayer plus tard ou les contacter.</div>`;
        return;
    }

    grid.style.display = 'grid';
    grid.innerHTML = '';

    // Process and sort options
    const sortedProposals = [...list].sort((a, b) => {
        const strA = `${a.dateId} ${a.time}`;
        const strB = `${b.dateId} ${b.time}`;
        return strA.localeCompare(strB);
    });

    const options = { weekday: 'short', day: 'numeric', month: 'long' };

    sortedProposals.forEach((slot, index) => {
        const dateObj = new Date(slot.dateId);
        const displayDate = dateObj.toLocaleDateString('fr-FR', options);
        // capitalize
        const formattedDate = displayDate.charAt(0).toUpperCase() + displayDate.slice(1);

        grid.innerHTML += `
            <div class="slot-card" id="slot-card-${index}" onclick="selectSlot('${slot.dateId}', '${slot.time}', ${index})">
                <div class="slot-checkbox"></div>
                <div class="slot-details">
                    <div class="slot-date">${formattedDate}</div>
                    <div class="slot-time">Heure proposée : ${slot.time}</div>
                </div>
            </div>
        `;
    });
}

function selectSlot(dateId, timeStr, index) {
    selectedDateId = dateId;
    originalTime = timeStr;

    // Reset styles
    document.querySelectorAll('.slot-card').forEach(el => el.classList.remove('selected'));

    // Set active style
    document.getElementById(`slot-card-${index}`).classList.add('selected');

    // Update Display
    const dateObj = new Date(dateId);
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    const displayDate = dateObj.toLocaleDateString('fr-FR', options);

    document.getElementById('selected-display').innerHTML = `<strong>${displayDate}</strong>`;

    // Fill the custom time input with the suggested time
    document.getElementById('custom-time').value = timeStr;

    // Enable button
    document.getElementById('btn-submit').disabled = false;
    document.getElementById('booking-actions').style.display = 'block';
}

function confirmBooking() {
    if (!selectedDateId || !currentDossier) return;

    const btn = document.getElementById('btn-submit');
    btn.textContent = "Envoi en cours...";
    btn.disabled = true;

    // Take the user's custom time if they changed it, otherwise the original suggested time
    const customTime = document.getElementById('custom-time').value || originalTime;
    const finalSlot = `${selectedDateId} ${customTime}`;

    setTimeout(() => {
        // 1. Update Dossier
        const dossiers = getDossiers();
        const dIndex = dossiers.findIndex(d => d.id === dossierId);

        dossiers[dIndex].status = 'rdv_set';
        dossiers[dIndex].rdv = finalSlot;
        // Optional: clear proposedRdvs if we don't need them anymore
        dossiers[dIndex].proposedRdvs = [];
        saveDossiers(dossiers);

        // 2. Register Booking in Admin Availabilities
        const availabilities = getAvailabilities();
        if (!availabilities[selectedDateId]) availabilities[selectedDateId] = [];

        // Push as booked
        availabilities[selectedDateId].push({ time: customTime, isBooked: true });
        saveAvailabilities(availabilities);

        // 3. Show Success
        document.getElementById('main-container').style.display = 'none';
        document.getElementById('success-state').style.display = 'flex';

    }, 1200); // Simulate network request
}
