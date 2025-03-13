document.addEventListener("DOMContentLoaded", function() {
    const sortareSelect = document.getElementById("sortare");
    const sorteazaBtn = document.getElementById("sorteazaBtn");
    const cartiLista = document.getElementById("carti-lista");
    const rangeInput = document.getElementById("range");
    const valoareRange = document.getElementById("valoare-range");
    const filtreazaBtn = document.getElementById("filtreazaBtn");

    let carti = Array.from(document.querySelectorAll(".carte"));

    // Funcția de sortare a cărților după autor și scor minim
    function sorteazaCarti() {
        let directie = sortareSelect.value;  // Obținem direcția de sortare (ascendent sau descendent)

        carti.sort((a, b) => {
            // Extragem numele autorilor din fiecare carte
            let autorA = a.querySelector("p strong").nextElementSibling.textContent.trim().toLowerCase();
            let autorB = b.querySelector("p strong").nextElementSibling.textContent.trim().toLowerCase();

            // Comparăm autorii
            if (autorA !== autorB) {
                return (directie === "ascendent") ? autorA.localeCompare(autorB) : autorB.localeCompare(autorA);
            }

            // Dacă autorii sunt egali, sortăm după scorul minim
            let scoruriA = a.querySelector(".scoruri");
            let scoruriB = b.querySelector(".scoruri");

            let scorMinA = scoruriA ? Math.min(...Array.from(scoruriA.querySelectorAll("td")).map(s => parseFloat(s.textContent))) : Infinity;
            let scorMinB = scoruriB ? Math.min(...Array.from(scoruriB.querySelectorAll("td")).map(s => parseFloat(s.textContent))) : Infinity;

            // Comparăm scorurile minime
            return (scorMinA !== scorMinB) ? scorMinA - scorMinB : 0;
        });

        // Reintroducem cărțile sortate în containerul cartiLista
        cartiLista.innerHTML = "";
        carti.forEach(carte => cartiLista.appendChild(carte));  // Adăugăm cărțile sortate
    }

    // Eveniment pentru sortare
    sorteazaBtn.addEventListener("click", function() {
        sorteazaCarti();
    });

    // Filtrare după scorul mediu
    function filtreazaCarti() {
        let valoareMinima = parseFloat(rangeInput.value);

        carti.forEach(carte => {
            let scoruriA = carte.querySelector(".scoruri");
            let scoruri = scoruriA ? Array.from(scoruriA.querySelectorAll("td")).map(s => parseFloat(s.textContent)) : [];
            let scorMediu = scoruri.length > 0 ? scoruri.reduce((sum, score) => sum + score, 0) / scoruri.length : 0;

            // Dacă scorul mediu este mai mic decât valoarea din range, ascundem cartea
            if (scorMediu < valoareMinima) {
                carte.style.display = "none";
            } else {
                carte.style.display = "block";
            }
        });
    }

    // Eveniment pentru filtrare
    filtreazaBtn.addEventListener("click", filtreazaCarti);

    // Actualizare valoare range
    rangeInput.addEventListener("input", function() {
        valoareRange.textContent = rangeInput.value;
    });

    // Generare aleatorie a scorurilor
    document.addEventListener("keydown", function(event) {
        if (event.key === "r") {
            carti.forEach(carte => {
                let scoruriA = carte.querySelector(".scoruri");
                if (scoruriA) {
                    Array.from(scoruriA.querySelectorAll("td")).forEach(s => {
                        let scorAleator = (Math.random() * 10).toFixed(1);  // Generăm un scor aleator între 0 și 10
                        s.textContent = scorAleator;  // Schimbăm scorul
                    });
                }
            });
        }
    });
});
