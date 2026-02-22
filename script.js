// --- CONFIGURAZIONE MENU ---
const menu = [
    { id: 1, nome: "Costolette", prezzo: 15.00, quantità: 10, categoria: 'piatto' },
    { id: 2, nome: "Pollo arrosto", prezzo: 12.50, quantità: 15, categoria: 'piatto' },
    { id: 3, nome: "Bistecca", prezzo: 17.50, quantità: 8, categoria: 'piatto' },
    { id: 4, nome: "Insalata Coleslaw", prezzo: 4.00, quantità: 0, categoria: 'piatto' },
    { id: 5, nome: "Patate al forno", prezzo: 4.00, quantità: 20, categoria: 'piatto' },
    { id: 6, nome: "Carpaccio di manzo", prezzo: 14.00, quantità: 5, categoria: 'piatto' },
    { id: 7, nome: "Vino", prezzo: 6.00, quantità: 5, categoria: 'bibita' },
    { id: 8, nome: "Birra", prezzo: 6.00, quantità: 5, categoria: 'bibita' },
    { id: 9, nome: "Acqua", prezzo: 2.00, quantità: 20, categoria: 'bibita' },
];

// --- DATABASE PERSISTENTE ---
let dbTavoli = JSON.parse(localStorage.getItem('ristorante_ordini')) || {
    1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [], 10: []
};

function salvaDati() {
    localStorage.setItem('ristorante_ordini', JSON.stringify(dbTavoli));
}

let carrelloAttuale = [];

// --- FUNZIONE RAGGRUPPAMENTO (FONDAMENTALE) ---
function raggruppa(lista) {
    return lista.reduce((acc, p) => {
        if (!acc[p.id]) acc[p.id] = { ...p, qta: 0 };
        acc[p.id].qta++;
        return acc;
    }, {});
}

// --- INIZIALIZZAZIONE PAGINE ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Logica per HOME.HTML
    if (document.getElementById('lista-piatti')) {
        aggiornaMenuUI();
        document.getElementById('numero-tavolo').addEventListener('change', () => {
            carrelloAttuale = [];
            aggiornaCarrelloUI();
            aggiornaMenuUI();
        });
    }

    // 2. Logica per CASSA.HTML (Generazione mappa circolare)
    if (document.getElementById('container-mappa')) {
        generaMappaTavoli();
    }
});

// --- LOGICA HOME ---
function aggiornaMenuUI() {
    const pContainer = document.getElementById('lista-piatti');
    const bContainer = document.getElementById('lista-bibite');
    if (!pContainer) return;

    pContainer.innerHTML = '';
    bContainer.innerHTML = '';

    menu.forEach(item => {
        const giaPresi = Object.values(dbTavoli).flat().filter(p => p.id === item.id).length;
        const nelCarrello = carrelloAttuale.filter(p => p.id === item.id).length;
        const disp = item.quantità - giaPresi - nelCarrello;

        const card = document.createElement('div');
        card.className = 'piatto-card';
        card.innerHTML = `
            <h3>${item.nome}</h3>
            <p>€${item.prezzo.toFixed(2)}</p>
            <p>Disp: ${disp}</p>
            <button onclick="aggiungiAOrdine(${item.id})" ${disp <= 0 ? 'disabled' : ''}>Aggiungi</button>`;
        
        (item.categoria === 'bibita' ? bContainer : pContainer).appendChild(card);
    });
}

function aggiungiAOrdine(id) {
    const t = document.getElementById('numero-tavolo').value;
    if (!t) return alert("Scegli un tavolo!");
    carrelloAttuale.push({...menu.find(p => p.id === id)});
    aggiornaCarrelloUI();
    aggiornaMenuUI();
}

function aggiornaCarrelloUI() {
    const lista = document.getElementById('lista-ordine');
    const tot = document.getElementById('prezzo-totale');
    const t = document.getElementById('numero-tavolo').value;
    if (!lista) return;

    lista.innerHTML = '';
    let somma = 0;

    // Carrello attuale raggruppato
    const raggrC = raggruppa(carrelloAttuale);
    Object.values(raggrC).forEach(p => {
        const li = document.createElement('li');
        li.className = 'ordine-attuale';
        li.textContent = `${p.nome} x${p.qta} - €${(p.prezzo * p.qta).toFixed(2)}`;
        lista.appendChild(li);
        somma += p.prezzo * p.qta;
    });

    // Storico raggruppato
    if (t && dbTavoli[t].length > 0) {
        lista.innerHTML += `<li class="separatore">── In Cucina ──</li>`;
        const raggrS = raggruppa(dbTavoli[t]);
        Object.values(raggrS).forEach(p => {
            lista.innerHTML += `<li class="ordine-completato">${p.nome} x${p.qta}</li>`;
        });
    }
    tot.textContent = somma.toFixed(2);
}

function eseguiOrdine() {
    const t = document.getElementById('numero-tavolo').value;
    if (carrelloAttuale.length === 0) return;
    dbTavoli[t].push(...carrelloAttuale);
    salvaDati();
    alert("Ordine inviato!");
    carrelloAttuale = [];
    aggiornaCarrelloUI();
    aggiornaMenuUI();
}

function azzeraTavolo() {
    const t = document.getElementById('numero-tavolo').value;
    if (t && confirm("Azzerare?")) {
        dbTavoli[t] = [];
        salvaDati();
        aggiornaCarrelloUI();
        aggiornaMenuUI();
    }
}

// --- LOGICA CASSA ---
function generaMappaTavoli() {
    const container = document.getElementById('container-mappa');
    const raggio = 150;
    for (let i = 1; i <= 10; i++) {
        const angolo = (i * 2 * Math.PI) / 10;
        const x = 175 + raggio * Math.cos(angolo);
        const y = 175 + raggio * Math.sin(angolo);

        const tDiv = document.createElement('div');
        tDiv.className = 'tavolo-grafico';
        tDiv.id = `tavolo-mappa-${i}`;
        tDiv.style.left = `${x}px`;
        tDiv.style.top = `${y}px`;
        tDiv.textContent = i;
        
        // Se il tavolo ha ordini, cambiamo colore
        if (dbTavoli[i].length > 0) tDiv.style.backgroundColor = "#e67e22";

        tDiv.onclick = () => {
            document.getElementById('tavolo-select').value = i;
            caricaOrdine();
            document.querySelectorAll('.tavolo-grafico').forEach(d => d.classList.remove('selezionato'));
            tDiv.classList.add('selezionato');
        };
        container.appendChild(tDiv);
    }
}

function caricaOrdine() {
    const t = document.getElementById('tavolo-select').value;
    const det = document.getElementById('ordine-details');
    const tot = document.getElementById('totale-cassa');
    if (!det) return;

    const items = dbTavoli[t] || [];
    if (items.length === 0) {
        det.innerHTML = "Tavolo libero";
        tot.textContent = "Totale: € 0.00";
        return;
    }

    const raggr = raggruppa(items);
    let html = "<ul>";
    let somma = 0;
    Object.values(raggr).forEach(p => {
        html += `<li>${p.nome} <b>x${p.qta}</b> - €${(p.prezzo * p.qta).toFixed(2)}</li>`;
        somma += p.prezzo * p.qta;
    });
    det.innerHTML = html + "</ul>";
    tot.textContent = `Totale: € ${somma.toFixed(2)}`;
}

function pagaOrdine() {
    const t = document.getElementById('tavolo-select').value;
    if (dbTavoli[t].length === 0) return;
    dbTavoli[t] = [];
    salvaDati();
    alert("Pagato!");
    location.reload(); // Ricarica per aggiornare mappa colori
}
