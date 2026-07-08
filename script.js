document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('imageInput').addEventListener('change', handleImageUpload);
});

let totalCards = 0;
let rowsCurrent = 0;
let colsCurrent = 0;
let uploadedImagesURLs = []; // Guardará las rutas temporales de las imágenes
let gameCards = []; // Array final con las parejas mezcladas
let cardsToMatch = [];
let intentos = 0;
let record = 0;
let lockBoard = false; // Candado para evitar clics múltiples rápidos

function setDifficulty(rows, cols) {
  rowsCurrent = rows;
  colsCurrent = cols;
  totalCards = rows * cols;
  const requiredImages = totalCards / 2;

  const difficultySelector = document.getElementById('difficulty');
  const imageUploadSection = document.getElementById('imageUpload');

  difficultySelector.classList.add('hidden');
  imageUploadSection.classList.remove('hidden');

  document.getElementById('imageCount').textContent = `Necesitas subir ${requiredImages} imágenes`;

  // Limpiar input si se eligió otra dificultad
  document.getElementById('imageInput').value = '';
  document.getElementById('startButton').disabled = true;
  uploadedImagesURLs = [];
}

function handleImageUpload(event) {
  const files = Array.from(event.target.files);
  const requiredImages = totalCards / 2;

  if (files.length === requiredImages) {
    uploadedImagesURLs = []; // Reiniciamos el array
    let loadedCount = 0;

    // Usamos FileReader para leer las imágenes como Base64 DataURL
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = function (e) {
        uploadedImagesURLs.push(e.target.result);
        loadedCount++;

        // Cuando terminen de cargarse todas, habilitamos el juego
        if (loadedCount === requiredImages) {
          document.getElementById('imageCount').textContent = '¡Imágenes listas para jugar!';
          document.getElementById('imageCount').className = 'mb-4 text-lg font-semibold text-green-600';
          document.getElementById('startButton').disabled = false;
        }
      };
      reader.readAsDataURL(file);
    });

  } else if (files.length < requiredImages) {
    document.getElementById('imageCount').textContent = `Te faltan ${requiredImages - files.length} imágenes`;
    document.getElementById('imageCount').className = 'mb-4 text-lg font-semibold text-red-500';
    document.getElementById('startButton').disabled = true;
  } else {
    document.getElementById('imageCount').textContent = `Te sobran ${files.length - requiredImages} imágenes`;
    document.getElementById('imageCount').className = 'mb-4 text-lg font-semibold text-red-500';
    document.getElementById('startButton').disabled = true;
  }
}

function startGame() {
  document.getElementById('imageUpload').classList.add('hidden');
  document.getElementById('gameBoard').classList.remove('hidden');
  document.getElementById('controls').classList.remove('hidden');
  document.getElementById('score').classList.remove('hidden');
  document.getElementById('winScreen').classList.add('hidden');

  intentos = 0;
  actualizarScore();

  // Duplicar las imágenes para hacer los pares
  gameCards = [...uploadedImagesURLs, ...uploadedImagesURLs];
  shuffle(gameCards);
  createBoard();
}

function createBoard() {
  const boardElement = document.getElementById('board');
  boardElement.innerHTML = '';

  // Limpiamos clases de grillas previas para que no se pisen
  boardElement.className = "grid gap-3 w-full";

  // BUG FIX: Asignamos clases fijas de Tailwind según las columnas del tablero
  if (colsCurrent === 4) {
    boardElement.classList.add('grid-cols-4');
  } else if (colsCurrent === 5) {
    // Si usas Tailwind v2 básico, grid-cols-5 a veces requiere ser forzado de esta manera:
    boardElement.style.gridTemplateColumns = 'repeat(5, minmax(0, 1fr))';
  } else if (colsCurrent === 6) {
    boardElement.classList.add('grid-cols-6');
  }

  for (let i = 0; i < totalCards; i++) {
    const card = document.createElement('div');
    // Aseguramos un tamaño mínimo (h-24 o h-32) para que las cartas no colapsen a 0 píxeles
    card.className = 'relative w-full h-24 md:h-32 cursor-pointer perspective-1000';
    card.dataset.index = i;
    card.dataset.image = gameCards[i];

    card.innerHTML = `
      <div class="card-inner absolute w-full h-full transition-transform duration-500 transform-style-3d shadow-md rounded-xl pointer-events-none">
        <div class="card-front absolute w-full h-full bg-[#EED9C4] rounded-xl backface-hidden border-4 border-white flex items-center justify-center">
            <span class="text-4xl text-white font-bold">?</span>
        </div>
        <div class="card-back absolute w-full h-full bg-white rounded-xl backface-hidden rotate-y-180 overflow-hidden border-2 border-[#B9D3E0] flex items-center justify-center">
            <img src="${gameCards[i]}" class="w-full h-full object-cover" alt="Memory Card">
        </div>
      </div>
    `;

    card.addEventListener('click', handleCardClick);
    boardElement.appendChild(card);
  }
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function handleCardClick(event) {
  if (lockBoard) return; // Evita clics si hay dos cartas procesándose

  const cardElement = event.currentTarget;

  // Si ya le dimos clic a esta misma carta, ignorar
  if (cardElement === cardsToMatch[0]) return;
  if (cardElement.classList.contains('matched')) return;

  const cardInner = cardElement.querySelector('.card-inner');
  cardInner.classList.add('rotate-y-180');

  cardsToMatch.push(cardElement);

  if (cardsToMatch.length === 2) {
    lockBoard = true;
    intentos++;
    actualizarScore();
    setTimeout(checkMatch, 1000);
  }
}

function checkMatch() {
  const firstCard = cardsToMatch[0];
  const secondCard = cardsToMatch[1];

  // Comparamos el atributo data-image que le asignamos al crear la carta
  if (firstCard.dataset.image === secondCard.dataset.image) {
    firstCard.classList.add('matched');
    secondCard.classList.add('matched');
    resetBoardState();

    if (document.querySelectorAll('.matched').length === totalCards) {
      setTimeout(showWinScreen, 500);
    }
  } else {
    // Si no coinciden, quitamos la clase de giro
    firstCard.querySelector('.card-inner').classList.remove('rotate-y-180');
    secondCard.querySelector('.card-inner').classList.remove('rotate-y-180');
    resetBoardState();
  }
}

function resetBoardState() {
  cardsToMatch = [];
  lockBoard = false;
}

function actualizarScore() {
  document.getElementById('intentosTexto').textContent = intentos;
  document.getElementById('recordTexto').textContent = record;
}

function showWinScreen() {
  document.getElementById('gameBoard').classList.add('hidden');
  document.getElementById('controls').classList.add('hidden');
  document.getElementById('score').classList.add('hidden');

  const winScreenSection = document.getElementById('winScreen');
  winScreenSection.classList.remove('hidden');
  document.getElementById('intentosFinales').textContent = intentos;

  if (intentos < record || record === 0) {
    record = intentos;
  }
}

function restartGame() {
  // Reinicia usando las mismas imágenes ya cargadas
  document.getElementById('winScreen').classList.add('hidden');
  startGame();
}

function resetApp() {
  intentos = 0;
  totalCards = 0;
  uploadedImagesURLs = []; // Limpieza directa

  document.getElementById('difficulty').classList.remove('hidden');
  document.getElementById('imageUpload').classList.add('hidden');
  document.getElementById('gameBoard').classList.add('hidden');
  document.getElementById('controls').classList.add('hidden');
  document.getElementById('score').classList.add('hidden');
  document.getElementById('winScreen').classList.add('hidden');

  // Restablecer estilos del contador
  const imageCount = document.getElementById('imageCount');
  imageCount.textContent = 'Selecciona la dificultad primero';
  imageCount.className = 'mb-4 text-lg font-semibold';
}