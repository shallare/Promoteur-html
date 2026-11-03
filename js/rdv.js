// DATA MANAGEMENT
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

// target: { dateId: "YYYY-MM-DD", time: "HH:MM", isBooked: boolean }
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

// CALENDAR STATE
let currentDate = new Date();
let selectedDate = new Date(); // Date currently clicked on

// INIT
document.addEventListener('DOMContentLoaded', () => {
    updateHeaderDate();
    initCalendar();
    renderSelectedDay();
    renderDossiersToSchedule();
    renderUpcomingRdvs();
});

// HEADER DATE
function updateHeaderDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = new Date().toLocaleDateString('fr-FR', options);
    // Capitalize first letter
    const formatted = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    document.getElementById('current-date-header').textContent = formatted;
}

// CALENDAR LOGIC
function initCalendar() {
    renderCalendar(currentDate);
}

function changeMonth(delta) {
    currentDate.setMonth(currentDate.getMonth() + delta);
    renderCalendar(currentDate);
}

function renderCalendar(date) {
    const year = date.getFullYear();
    const month = date.getMonth();

    // Update Header
    const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    document.getElementById('calendar-month-year').textContent = `${monthNames[month]} ${year}`;

    // Calculate days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Mon = 0
    const totalDays = lastDay.getDate();

    const calendarDays = document.getElementById('calendar-days');
    calendarDays.innerHTML = '';

    const availabilities = getAvailabilities();

    // Fill blanks before start of month
    for (let i = 0; i < startDayOfWeek; i++) {
        calendarDays.innerHTML += `<div class="calendar-day empty"></div>`;
    }

    // Fill days
    for (let i = 1; i <= totalDays; i++) {
        const d = new Date(year, month, i);
        const dateId = getDateId(d);

        let classes = 'calendar-day';

        // Is selected?
        if (getDateId(selectedDate) === dateId) {
            classes += ' selected';
        }

        // Is today?
        const today = new Date();
        if (dateId === getDateId(today) && getDateId(selectedDate) !== dateId) {
            classes += ' muted'; // Just make today slightly visible if not selected
        }

        // Has event/slot?
        const daySlots = availabilities[dateId] || [];
        const hasUnbookedSlot = daySlots.some(s => !s.isBooked);
        const hasBookedSlot = daySlots.some(s => s.isBooked);

        if (hasBookedSlot) {
            classes += ' has-booked-event';
        } else if (hasUnbookedSlot) {
            classes += ' has-open-event';
        }

        calendarDays.innerHTML += `
            <div class="${classes}" onclick="selectDate(${year}, ${month}, ${i})">${i}</div>
        `;
    }
}

function getDateId(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDisplayDate(date) {
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    return date.toLocaleDateString('fr-FR', options);
}

function selectDate(year, month, day) {
    selectedDate = new Date(year, month, day);
    renderCalendar(currentDate); // Re-render to update selected styling
    renderSelectedDay();
}


// SLOTS LOGIC
function renderSelectedDay() {
    const displaySpan = document.getElementById('selected-date-display');
    displaySpan.textContent = formatDisplayDate(selectedDate);

    const dateId = getDateId(selectedDate);
    const availabilities = getAvailabilities();
    const daySlots = availabilities[dateId] || [];

    const container = document.getElementById('slots-container');
    container.innerHTML = '';

    if (daySlots.length === 0) {
        container.innerHTML = `<div style="color:var(--gray-400); font-size:0.85rem; padding: 8px 0;">Aucune disponibilité enregistrée pour cette date.</div>`;
    } else {
        daySlots.sort((a, b) => a.time.localeCompare(b.time));

        daySlots.forEach(slot => {
            if (slot.isBooked) {
                // Find the dossier that corresponds to this booking
                const dossiers = getDossiers();
                const bookedDossier = dossiers.find(d => d.rdv === `${dateId} ${slot.time}`);
                const schoolName = bookedDossier && bookedDossier.step1 ? bookedDossier.step1.schoolName : 'Inconnu';

                container.innerHTML += `
                    <div class="slot-pill" style="background:var(--blue-light); color:var(--blue-dark); border: 1px solid var(--blue);">
                        <b>${slot.time}</b> : Rendez-vous avec <i>${schoolName}</i>
                    </div>`;
            } else {
                container.innerHTML += `
                    <div class="slot-pill">
                        ${slot.time}
                        <button onclick="removeSlot('${dateId}', '${slot.time}')">
                            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                `;
            }
        });
    }

    // Also re-render assignment dropdown if modal is open
    populateAssignSelect();
}

function addSlot() {
    const timeInput = document.getElementById('new-slot-time');
    const timeValue = timeInput.value;

    if (!timeValue) {
        alert("Veuillez sélectionner une heure.");
        return;
    }

    const dateId = getDateId(selectedDate);
    const availabilities = getAvailabilities();

    if (!availabilities[dateId]) availabilities[dateId] = [];

    // Check if already exists
    if (availabilities[dateId].find(s => s.time === timeValue)) {
        alert("Ce créneau existe déjà.");
        return;
    }

    availabilities[dateId].push({ time: timeValue, isBooked: false });
    saveAvailabilities(availabilities);

    timeInput.value = '';
    renderSelectedDay();
    renderCalendar(currentDate); // Update dots on calendar
}

function removeSlot(dateId, time) {
    const availabilities = getAvailabilities();
    if (!availabilities[dateId]) return;

    availabilities[dateId] = availabilities[dateId].filter(s => s.time !== time);
    saveAvailabilities(availabilities);

    renderSelectedDay();
    renderCalendar(currentDate);
}


// DOSSIERS LOGIC
function renderDossiersToSchedule() {
    const dossiers = getDossiers();
    const toSchedule = dossiers.filter(d =>
        (d.status === 'completed' || d.status === 'approved') && !d.rdv
    );

    const list = document.getElementById('dossiers-to-schedule-list');
    list.innerHTML = '';

    if (toSchedule.length === 0) {
        list.innerHTML = `<div style="padding: 20px; color: var(--gray-400); text-align: center;">Aucun dossier en attente de planification.</div>`;
        return;
    }

    toSchedule.forEach(d => {
        const s1 = d.step1 || {};
        list.innerHTML += `
             <div class="dossier-list-item">
                <div class="dossier-dot">
                   ${s1.schoolName ? s1.schoolName.charAt(0).toUpperCase() : '?'}
                </div>
                <div class="dossier-info">
                    <h4>${s1.schoolName || 'Sans nom'}</h4>
                    <p>${s1.fullname} • ${d.status === 'approved' ? 'Dossier Validé' : 'Vérification en cours'}</p>
                </div>
                <div class="dossier-actions">
                    <button class="btn-action btn-schedule" onclick="openProposeModal('${d.id}', '${s1.schoolName}')">Proposer des RDV</button>
                </div>
            </div>
        `;
    });
}

function renderUpcomingRdvs() {
    const dossiers = getDossiers();
    // Needs to have RDV and be in future (for simplicity, we just check if it has RDV)
    // Format is "YYYY-MM-DD HH:MM"
    const upcoming = dossiers.filter(d => d.rdv).sort((a, b) => a.rdv.localeCompare(b.rdv));

    const list = document.getElementById('upcoming-rdv-list');
    list.innerHTML = '';

    if (upcoming.length === 0) {
        list.innerHTML = `<div style="color: var(--gray-400); font-size: 0.85rem; padding: 12px;">Aucun rendez-vous prévu.</div>`;
        return;
    }

    // Show only next 5
    upcoming.slice(0, 5).forEach(d => {
        const s1 = d.step1 || {};

        // Parse date string for display
        const textParts = d.rdv.split(" ");
        let datePart = textParts[0];
        let timePart = textParts.length > 1 ? textParts[1] : '';

        list.innerHTML += `
             <div class="reminder-card">
                <div class="reminder-icon">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                </div>
                <div class="reminder-info">
                    <h4>${s1.schoolName || 'Dossier'}</h4>
                    <p>${datePart} à ${timePart}</p>
                </div>
            </div>
        `;
    });
}


// ASSIGNMENT MODAL
let currentAssignDossierId = null;

function openAssignModal(dossierId, schoolName) {
    currentAssignDossierId = dossierId;
    document.getElementById('assign-target-name').textContent = schoolName;

    const select = document.getElementById('slot-select');
    populateAssignSelect();

    if (select.options.length === 0) {
        alert("Veuillez d'abord ajouter des disponibilités dans le calendrier (zone centrale) !");
        return;
    }

    document.getElementById('assign-modal').classList.add('active');
}

function closeAssignModal() {
    document.getElementById('assign-modal').classList.remove('active');
    currentAssignDossierId = null;
}

function populateAssignSelect() {
    const select = document.getElementById('slot-select');
    if (!select) return;
    select.innerHTML = '';

    const availabilities = getAvailabilities();
    const sortedDates = Object.keys(availabilities).sort();

    sortedDates.forEach(dateId => {
        const slots = availabilities[dateId];
        slots.forEach(slot => {
            if (!slot.isBooked) {
                const opt = document.createElement('option');
                opt.value = `${dateId} ${slot.time}`; // Payload we save

                // Format for display
                const dateObj = new Date(dateId);
                const options = { weekday: 'short', day: 'numeric', month: 'short' };
                const formattedDate = dateObj.toLocaleDateString('fr-FR', options);

                opt.textContent = `${formattedDate} à ${slot.time}`;
                select.appendChild(opt);
            }
        });
    });
}

function confirmAssignRdv() {
    const select = document.getElementById('slot-select');
    if (!select.value || !currentAssignDossierId) return;

    const rdvValue = select.value; // "YYYY-MM-DD HH:MM"
    const [dateId, timeStr] = rdvValue.split(" ");

    // 1. Update Dossier
    const dossiers = getDossiers();
    const dIndex = dossiers.findIndex(d => d.id === currentAssignDossierId);
    if (dIndex === -1) return;

    dossiers[dIndex].rdv = rdvValue;
    saveDossiers(dossiers);

    // 2. Update Availability to booked
    const availabilities = getAvailabilities();
    if (availabilities[dateId]) {
        const slotIndex = availabilities[dateId].findIndex(s => s.time === timeStr);
        if (slotIndex !== -1) {
            availabilities[dateId][slotIndex].isBooked = true;
            saveAvailabilities(availabilities);
        }
    }

    // 3. Simulate Email
    const s1 = dossiers[dIndex].step1;
    alert(`[SIMULATION EMAIL]
--------------------------
À : ${s1.email}
Objet : Convocation à un rendez-vous - ${s1.schoolName}

Bonjour ${s1.fullname},

Suite au traitement de votre dossier, nous vous invitons à un rendez-vous le :
${rdvValue}

Merci de vous présenter muni des originaux de vos documents.

Cordialement,
L'Administration.
--------------------------`);

    // 4. Cleanup & Re-render
    closeAssignModal();
    renderDossiersToSchedule();
    renderUpcomingRdvs();
    renderSelectedDay(); // in case selected day was the booked one
    renderCalendar(currentDate); // Update dots
}


// PROPOSE MODAL LOGIC
let currentProposeDossierId = null;
let currentPropositions = []; // Array of {dateId, time}

function openProposeModal(dossierId, schoolName) {
    currentProposeDossierId = dossierId;
    document.getElementById('propose-target-name').textContent = schoolName;
    currentPropositions = [];
    renderPropositionsList();

    // Set min date to today
    const activeDateInput = document.getElementById('propose-date');
    if (activeDateInput) {
        activeDateInput.min = new Date().toISOString().split("T")[0];
    }

    document.getElementById('propose-modal').classList.add('active');
}

function closeProposeModal() {
    document.getElementById('propose-modal').classList.remove('active');
    currentProposeDossierId = null;
    currentPropositions = [];
}

function addProposition() {
    const dateInput = document.getElementById('propose-date').value;
    const timeInput = document.getElementById('propose-time').value;

    if (!dateInput || !timeInput) {
        alert("Veuillez sélectionner une date et une heure valides.");
        return;
    }

    // Checking if it already exists
    const exists = currentPropositions.some(p => p.dateId === dateInput && p.time === timeInput);
    if (exists) {
        alert("Cette proposition existe déjà pour ce dossier !");
        return;
    }

    currentPropositions.push({ dateId: dateInput, time: timeInput });

    // reset inputs
    document.getElementById('propose-date').value = '';
    document.getElementById('propose-time').value = '';

    renderPropositionsList();
}

function removeProposition(index) {
    currentPropositions.splice(index, 1);
    renderPropositionsList();
}

function renderPropositionsList() {
    const list = document.getElementById('propositions-list');
    const badge = document.getElementById('propose-count-badge');

    if (badge) {
        badge.textContent = currentPropositions.length;
        if (currentPropositions.length > 0) {
            badge.style.background = 'var(--blue)';
            badge.style.color = 'white';
        } else {
            badge.style.background = 'var(--gray-200)';
            badge.style.color = 'var(--gray-800)';
        }
    }

    list.innerHTML = '';

    if (currentPropositions.length === 0) {
        list.innerHTML = `
            <div style="padding: 20px 16px; text-align: center; border: 1px dashed var(--gray-300); border-radius: 12px; color:var(--gray-500); font-size:0.9rem; background: var(--gray-50);">
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none" stroke-width="1.5" style="margin: 0 auto 8px; display: block; color: var(--gray-400);"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                Aucun créneau sélectionné pour le moment.<br>Ajoutez des propositions ci-dessus.
            </div>
        `;
        return;
    }

    // Sort chronologically
    currentPropositions.sort((a, b) => {
        const strA = `${a.dateId} ${a.time}`;
        const strB = `${b.dateId} ${b.time}`;
        return strA.localeCompare(strB);
    });

    const displayOptions = { weekday: 'long', day: 'numeric', month: 'long' };

    currentPropositions.forEach((p, index) => {
        const dateObj = new Date(p.dateId);
        let formattedDate = dateObj.toLocaleDateString('fr-FR', displayOptions);
        formattedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1); // Capitalize first letter

        list.innerHTML += `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: var(--white); border: 1px solid var(--blue-light); border-left: 4px solid var(--blue); border-radius: 10px; box-shadow: 0 2px 8px rgba(21,101,192,0.05);">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="background: var(--blue-light); color: var(--blue-dark); width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-family: var(--font-display);">
                        ${p.time.split(':')[0]}h
                    </div>
                    <div>
                        <div style="font-weight: 600; color: var(--dark); font-size: 0.95rem;">${p.time}</div>
                        <div style="color: var(--gray-600); font-size: 0.8rem;">${formattedDate}</div>
                    </div>
                </div>
                <button onclick="removeProposition(${index})" style="background: none; border: none; color: var(--gray-400); cursor: pointer; padding: 8px; border-radius: 50%; transition: all 0.2s;" onmouseover="this.style.color='#ef4444'; this.style.background='#fee2e2';" onmouseout="this.style.color='var(--gray-400)'; this.style.background='transparent';">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
        `;
    });
}

function sendPropositions() {
    if (currentPropositions.length === 0) {
        alert("Vous devez ajouter au moins une proposition avant d'envoyer.");
        return;
    }

    if (!currentProposeDossierId) return;

    const dossiers = getDossiers();
    const dIndex = dossiers.findIndex(d => d.id === currentProposeDossierId);
    if (dIndex === -1) return;

    // 1. Save proposals
    dossiers[dIndex].proposedRdvs = currentPropositions;
    dossiers[dIndex].status = 'waiting_rdv';
    saveDossiers(dossiers);

    const s1 = dossiers[dIndex].step1;

    // Create link for the client
    const currentPath = window.location.href;
    const basePath = currentPath.substring(0, currentPath.lastIndexOf('/'));
    const link = `${basePath}/client_rdv.html?id=${currentProposeDossierId}`;

    alert(`[SIMULATION EMAIL]
--------------------------
À : ${s1.email}
Objet : Fixons l'heure de votre rendez-vous - ${s1.schoolName}

Bonjour ${s1.fullname},

Votre dossier est en bonne voie de finalisation. Afin de procéder à son approbation finale, nous vous avons proposé plusieurs créneaux pour un rendez-vous administratif. 

Veuillez choisir la date et l'heure qui vous conviennent le mieux en cliquant sur le lien sécurisé ci-dessous :

${link}

Cordialement,
L'Administration.
--------------------------`);

    closeProposeModal();
    renderDossiersToSchedule();
    renderUpcomingRdvs();
    renderSelectedDay(); // in case selected day was the booked one
    renderCalendar(currentDate); // Update dots
}
