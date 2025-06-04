const board = document.getElementById("board");
const status = document.getElementById("status");
const size = 5;
let grid = Array.from({ length: size }, () => Array(size).fill(0));
let usedDirections = new Set();
let moves = 0;
let gameOver = false;

const EMPTY = 0;
const FLOWER = 1;
const SEEDLING = 2;

const EMOJIS = {
	[FLOWER]: "🌼",
	[SEEDLING]: "🌱",
};

function createCell(r, c) {
	const cell = document.createElement("div");
	cell.className = "cell";

	const value = grid[r][c];

	if (value === FLOWER) {
		cell.classList.add("flower");
		cell.textContent = EMOJIS[FLOWER];
	} else if (value === SEEDLING) {
		cell.textContent = EMOJIS[SEEDLING];
	} else {
		cell.onclick = () => plantFlower(r, c);
		cell.classList.add("clickable");
	}

	return cell;
}

const directionMap = [
	{ dr: -1, dc: 0, rotation: 0, name: "N" },
	{ dr: -1, dc: 1, rotation: 45, name: "NE" },
	{ dr: 0, dc: 1, rotation: 90, name: "E" },
	{ dr: 1, dc: 1, rotation: 135, name: "SE" },
	{ dr: 1, dc: 0, rotation: 180, name: "S" },
	{ dr: 1, dc: -1, rotation: 225, name: "SW" },
	{ dr: 0, dc: -1, rotation: 270, name: "W" },
	{ dr: -1, dc: -1, rotation: 315, name: "NW" },
];

function createCompass() {
	const compass = document.querySelector(".radial-compass");

	directionMap.forEach(({ dr, dc, rotation, name }) => {
		const arrow = document.createElement("div");
		arrow.className = "arrow";
		arrow.title = name;
		arrow.style.setProperty("--angle", `${rotation}deg`);
		arrow.style.transform = `rotate(${rotation}deg)`;
		arrow.style.transformOrigin = "bottom center";
		arrow.dataset.dir = `${dr},${dc}`;
		arrow.onclick = () => blowWind(dr, dc);

		const label = document.createElement("span");
		label.className = "arrow-label";
		label.textContent = name;

		arrow.appendChild(label);
		compass.appendChild(arrow);
	});
}

function renderBoard() {
	board.innerHTML = "";
	for (let r = 0; r < size; r++) {
		for (let c = 0; c < size; c++) {
			board.appendChild(createCell(r, c));
		}
	}
}

function plantFlower(r, c) {
	if (gameOver || grid[r][c]) return;
	grid[r][c] = 1;
	renderBoard();
	status.textContent = "Wind's turn: Choose a direction to blow";
	setCompassEnabled(true);
	board.querySelectorAll(".cell").forEach((cell) => (cell.onclick = null));
	checkEnd();
}

function triggerWindAnimation(dr, dc) {
	const gust = document.getElementById("wind-gust");
	gust.innerHTML = "";

	const angle = Math.atan2(dr, dc) * (180 / Math.PI);
	const moveDistance = "120px"; // Less distance for smaller gusts

	const gridSize = 6; // 6x6 grid
	const spacing = 100; // spacing between gusts
	const offsetX = 50; // padding from left
	const offsetY = 50; // padding from top

	for (let row = 0; row < gridSize; row++) {
		for (let col = 0; col < gridSize; col++) {
			const outer = document.createElement("div");
			outer.className = "wind-gust-image";
			outer.style.top = `${offsetY + row * spacing}px`;
			outer.style.left = `${offsetX + col * spacing}px`;
			outer.style.transform = `rotate(${angle}deg)`;

			const inner = document.createElement("div");
			inner.className = "gust-inner";
			inner.style.setProperty("--move-distance", moveDistance);

			// Optional: Add a random delay for staggered effect
			const delay = (Math.random() * 0.5).toFixed(2);
			inner.style.animationDelay = `${delay}s`;

			outer.appendChild(inner);
			gust.appendChild(outer);
		}
	}
}

function propagateSeeds(dr, dc) {
	const newGrid = grid.map((row) => row.slice());
	const seedlings = [];

	for (let r = 0; r < size; r++) {
		for (let c = 0; c < size; c++) {
			if (grid[r][c] === FLOWER) {
				let nr = r + dr,
					nc = c + dc;
				while (nr >= 0 && nr < size && nc >= 0 && nc < size) {
					if (newGrid[nr][nc] === EMPTY) {
						newGrid[nr][nc] = SEEDLING;
						seedlings.push([nr, nc]);
					}
					nr += dr;
					nc += dc;
				}
			}
		}
	}

	return { newGrid, seedlings };
}

function blowWind(dr, dc) {
	if (gameOver) return;
	const dirKey = `${dr},${dc}`;
	if (usedDirections.has(dirKey)) return; // already handled
	usedDirections.add(dirKey);

	const arrow = document.querySelector(`.arrow[data-dir='${dirKey}']`);
	if (arrow) {
		arrow.style.pointerEvents = "none";
		arrow.style.opacity = "0.3";
	}

	triggerWindAnimation(dr, dc);

	const { newGrid, seedlings } = propagateSeeds(dr, dc);
	grid = newGrid;

	// ⏳ Delay seed appearance
	setTimeout(() => {
		renderBoard();
		status.textContent = "Seeds are growing...";

		// 🌱 Delay flower growth
		setTimeout(() => {
			for (let [r, c] of seedlings) {
				grid[r][c] = 1;
			}
			renderBoard();

			moves++;
			checkEnd();
			if (!gameOver) {
				status.textContent =
					"Flower's turn: Click a cell to plant a flower";
				setCompassEnabled(false);
			}
		}, 1000); // flower grows 1s after seeds appear
	}, 300); // seeds appear 0.3s after propagation is computed
}

function checkEnd() {
	const filled = grid.flat().filter((x) => x).length;
	if (filled === size * size) {
		status.textContent = "🌼 Flower wins!";
		gameOver = true;
	} else if (moves === 7) {
		status.textContent = "🌬️ Wind wins!";
		gameOver = true;
	}
}

function setCompassEnabled(enabled) {
	document.querySelectorAll(".radial-compass .arrow").forEach((arrow) => {
		const dir = arrow.dataset.dir;
		if (usedDirections.has(dir)) return; // ⛔ Skip used arrows

		arrow.style.pointerEvents = enabled ? "auto" : "none";
		arrow.style.opacity = enabled ? "1" : "0.4";
	});
}

renderBoard();
createCompass();
setCompassEnabled(false);
