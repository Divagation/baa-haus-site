/**
 * baa.haus — 3D Voxel Chess Game
 */

// Configuration
const headerText = "let's play!";
const normalTypingSpeed = 150;
const fastTypingSpeed = 30;
const startDelay = 500;

// Get elements
const playText = document.getElementById('playText');
const cursor = document.getElementById('cursor');
const canvas = document.getElementById('chessCanvas');
const gameInfo = document.getElementById('gameInfo');
const gameControls = document.getElementById('gameControls');
const turnInfo = document.getElementById('turnInfo');
const statusInfo = document.getElementById('statusInfo');

let currentIndex = 0;
let typingSpeed = normalTypingSpeed;
let isSpacePressed = false;
let gameStarted = false;

// Speed up typing when space is held
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && !isSpacePressed && !gameStarted) {
    e.preventDefault();
    isSpacePressed = true;
    typingSpeed = fastTypingSpeed;
  }
});

document.addEventListener('keyup', (e) => {
  if (e.code === 'Space' && !gameStarted) {
    isSpacePressed = false;
    typingSpeed = normalTypingSpeed;
  }
});

// Type header
function typeHeader() {
  if (currentIndex < headerText.length) {
    playText.textContent += headerText.charAt(currentIndex);
    currentIndex++;
    setTimeout(typeHeader, typingSpeed);
  } else {
    cursor.style.display = 'none';
    setTimeout(showGame, 500);
  }
}

// Show game
function showGame() {
  canvas.classList.add('active');
  gameInfo.classList.add('active');
  gameControls.classList.add('active');
  initChess3D();
}

// Start typing after delay
setTimeout(() => {
  typeHeader();
}, startDelay);

// ============================================
// 3D CHESS GAME
// ============================================

let scene, camera, renderer, raycaster, mouse;
let board = [];
let pieces3D = [];
let selectedSquare = null;
let possibleMoves = [];
let currentTurn = 'white';
let boardSquares = [];

// Colors
const COLORS = {
  lightSquare: 0xfffff0,
  darkSquare: 0x4a4a4a,
  whitePiece: 0xfffffb,
  blackPiece: 0x3a3a3a,
  selected: 0x6a6a6a,
  possibleMove: 0x6b9bd1,
  background: 0x2b2b2b,
  highlight: 0xff8c00
};

let selectedPiece3D = null;

// Initial board setup
const initialBoard = [
  ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
  ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
  ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
];

function initChess3D() {
  gameStarted = true;
  board = initialBoard.map(row => [...row]);

  // Setup Three.js scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.background);

  // Camera
  camera = new THREE.PerspectiveCamera(45, canvas.width / canvas.height, 0.1, 1000);
  camera.position.set(0, 20, 16);
  camera.lookAt(0, 0, 0);

  // Renderer
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.setSize(canvas.width, canvas.height);

  // Raycaster for mouse picking
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 7);
  scene.add(directionalLight);

  // Create board
  createBoard();
  createPieces();

  // Mouse and touch controls
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };
  let previousTouchDistance = 0;

  // Mouse events
  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) { // Left click
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), deltaX * 0.005);

      const axis = new THREE.Vector3().crossVectors(camera.up, camera.position).normalize();
      camera.position.applyAxisAngle(axis, deltaY * 0.005);

      camera.lookAt(0, 0, 0);
      previousMousePosition = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    }
  });

  canvas.addEventListener('mouseup', () => {
    isDragging = false;
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomSpeed = 0.1;
    const direction = e.deltaY > 0 ? 1 : -1;

    camera.position.multiplyScalar(1 + direction * zoomSpeed);
    camera.position.clampLength(10, 40);
  });

  // Touch events for mobile
  let touchStartTime = 0;
  let touchStartPos = { x: 0, y: 0 };
  let hasMoved = false;

  canvas.addEventListener('touchstart', (e) => {
    touchStartTime = Date.now();
    hasMoved = false;

    if (e.touches.length === 1) {
      // Single touch - could be tap or drag
      previousMousePosition = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
      touchStartPos = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
      isDragging = false; // Don't start dragging immediately
    } else if (e.touches.length === 2) {
      // Two finger pinch - zoom
      isDragging = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      previousTouchDistance = Math.sqrt(dx * dx + dy * dy);
      e.preventDefault();
    }
  });

  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1) {
      // Check if moved significantly
      const deltaX = e.touches[0].clientX - touchStartPos.x;
      const deltaY = e.touches[0].clientY - touchStartPos.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance > 10) { // Moved more than 10px, it's a drag
        hasMoved = true;
        isDragging = true;
      }

      if (isDragging) {
        // Rotation
        const dx = e.touches[0].clientX - previousMousePosition.x;
        const dy = e.touches[0].clientY - previousMousePosition.y;

        camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), dx * 0.01);

        const axis = new THREE.Vector3().crossVectors(camera.up, camera.position).normalize();
        camera.position.applyAxisAngle(axis, dy * 0.01);

        camera.lookAt(0, 0, 0);
        previousMousePosition = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        };
        e.preventDefault();
      }
    } else if (e.touches.length === 2) {
      // Pinch zoom
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (previousTouchDistance > 0) {
        const delta = distance - previousTouchDistance;
        const zoomSpeed = 0.01;

        camera.position.multiplyScalar(1 - delta * zoomSpeed);
        camera.position.clampLength(10, 40);
      }

      previousTouchDistance = distance;
      e.preventDefault();
    }
  });

  canvas.addEventListener('touchend', (e) => {
    const touchDuration = Date.now() - touchStartTime;

    // If it was a quick tap without movement, treat it as a click
    if (!hasMoved && touchDuration < 300 && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const fakeEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY
      };
      onCanvasClick(fakeEvent);
    }

    isDragging = false;
    if (e.touches.length < 2) {
      previousTouchDistance = 0;
    }
  });

  canvas.addEventListener('click', onCanvasClick);

  // Animate
  animate();
}

function createBoard() {
  const squareSize = 2;
  const boardSize = 8;
  const offset = (boardSize * squareSize) / 2 - squareSize / 2;

  for (let row = 0; row < 8; row++) {
    boardSquares[row] = [];
    for (let col = 0; col < 8; col++) {
      const geometry = new THREE.BoxGeometry(squareSize, 0.3, squareSize);
      const isLight = (row + col) % 2 === 0;
      const material = new THREE.MeshLambertMaterial({
        color: isLight ? COLORS.lightSquare : COLORS.darkSquare
      });

      const square = new THREE.Mesh(geometry, material);
      square.position.set(
        col * squareSize - offset,
        0,
        row * squareSize - offset
      );
      square.userData = { row, col, type: 'square', originalColor: material.color.getHex() };

      scene.add(square);
      boardSquares[row][col] = square;
    }
  }
}

function createVoxelPiece(pieceType, isWhite) {
  const group = new THREE.Group();
  const voxelSize = 0.3;
  const color = isWhite ? COLORS.whitePiece : COLORS.blackPiece;
  const material = new THREE.MeshLambertMaterial({ color });

  function addVoxel(x, y, z) {
    const geometry = new THREE.BoxGeometry(voxelSize, voxelSize, voxelSize);
    const voxel = new THREE.Mesh(geometry, material);
    voxel.position.set(x * voxelSize, y * voxelSize, z * voxelSize);
    group.add(voxel);
  }

  const type = pieceType.toLowerCase();

  // Base for all pieces - thicker 3x3
  for (let x = -1; x <= 1; x++) {
    for (let z = -1; z <= 1; z++) {
      addVoxel(x, 0, z);
    }
  }

  // Piece-specific voxels - thicker designs
  if (type === 'p') { // Pawn - Chunky
    // Thick body 2x2
    for (let y = 1; y <= 3; y++) {
      addVoxel(-1, y, 0);
      addVoxel(0, y, 0);
      addVoxel(1, y, 0);
      addVoxel(0, y, -1);
      addVoxel(0, y, 1);
    }
    // Top sphere-ish
    for (let x = -1; x <= 1; x++) {
      for (let z = -1; z <= 1; z++) {
        addVoxel(x, 4, z);
      }
    }
  } else if (type === 'r') { // Rook - Thick castle
    // Wide body
    for (let y = 1; y <= 4; y++) {
      for (let x = -1; x <= 1; x++) {
        for (let z = -1; z <= 1; z++) {
          addVoxel(x, y, z);
        }
      }
    }
    // Battlements - corners
    addVoxel(-1, 5, -1);
    addVoxel(-1, 5, 1);
    addVoxel(1, 5, -1);
    addVoxel(1, 5, 1);
    addVoxel(-1, 6, -1);
    addVoxel(-1, 6, 1);
    addVoxel(1, 6, -1);
    addVoxel(1, 6, 1);
  } else if (type === 'n') { // Knight - Chunky L-shape
    // Thick neck
    for (let y = 1; y <= 3; y++) {
      addVoxel(-1, y, 0);
      addVoxel(0, y, 0);
      addVoxel(1, y, 0);
      addVoxel(-1, y, 1);
      addVoxel(0, y, 1);
      addVoxel(1, y, 1);
    }
    // Thick head
    for (let y = 4; y <= 5; y++) {
      addVoxel(-1, y, 1);
      addVoxel(0, y, 1);
      addVoxel(1, y, 1);
      addVoxel(0, y, 2);
    }
    // Top
    addVoxel(0, 6, 1);
  } else if (type === 'b') { // Bishop - Thick with point
    // Thick body
    for (let y = 1; y <= 5; y++) {
      addVoxel(-1, y, 0);
      addVoxel(0, y, 0);
      addVoxel(1, y, 0);
      addVoxel(0, y, -1);
      addVoxel(0, y, 1);
    }
    // Cross
    addVoxel(-1, 6, -1);
    addVoxel(0, 6, 0);
    addVoxel(1, 6, 1);
    addVoxel(-1, 6, 1);
    addVoxel(1, 6, -1);
    // Point
    addVoxel(0, 7, 0);
  } else if (type === 'q') { // Queen - Thick with crown
    // Thick tall body
    for (let y = 1; y <= 6; y++) {
      addVoxel(-1, y, 0);
      addVoxel(0, y, 0);
      addVoxel(1, y, 0);
      addVoxel(0, y, -1);
      addVoxel(0, y, 1);
    }
    // Crown ring
    for (let x = -1; x <= 1; x++) {
      for (let z = -1; z <= 1; z++) {
        if (x !== 0 || z !== 0) {
          addVoxel(x, 7, z);
        }
      }
    }
    // Top
    addVoxel(0, 8, 0);
  } else if (type === 'k') { // King - Thickest with cross
    // Very thick body
    for (let y = 1; y <= 7; y++) {
      addVoxel(-1, y, 0);
      addVoxel(0, y, 0);
      addVoxel(1, y, 0);
      addVoxel(0, y, -1);
      addVoxel(0, y, 1);
    }
    // Cross horizontal
    addVoxel(-2, 8, 0);
    addVoxel(-1, 8, 0);
    addVoxel(0, 8, 0);
    addVoxel(1, 8, 0);
    addVoxel(2, 8, 0);
    // Cross vertical
    addVoxel(0, 9, 0);
    addVoxel(0, 10, 0);
  }

  return group;
}

function createPieces() {
  pieces3D = [];
  const squareSize = 2;
  const offset = (8 * squareSize) / 2 - squareSize / 2;

  for (let row = 0; row < 8; row++) {
    pieces3D[row] = [];
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        const isWhite = piece === piece.toUpperCase();
        const piece3D = createVoxelPiece(piece, isWhite);
        piece3D.position.set(
          col * squareSize - offset,
          0.15,
          row * squareSize - offset
        );
        piece3D.userData = { row, col, type: 'piece', pieceType: piece };
        scene.add(piece3D);
        pieces3D[row][col] = piece3D;
      } else {
        pieces3D[row][col] = null;
      }
    }
  }
}

function onCanvasClick(event) {
  if (currentTurn !== 'white') return;

  const rect = canvas.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // Check pieces first
  const allPieces = pieces3D.flat().filter(p => p !== null);
  const pieceIntersects = raycaster.intersectObjects(allPieces, true);

  if (pieceIntersects.length > 0) {
    let piece = pieceIntersects[0].object;
    while (piece.parent && !piece.userData.type) {
      piece = piece.parent;
    }
    if (piece.userData.type === 'piece') {
      handlePieceClick(piece.userData.row, piece.userData.col);
      return;
    }
  }

  // Check squares
  const squareIntersects = raycaster.intersectObjects(boardSquares.flat());
  if (squareIntersects.length > 0) {
    const square = squareIntersects[0].object;
    handleSquareClick(square.userData.row, square.userData.col);
  }
}

function handlePieceClick(row, col) {
  const piece = board[row][col];
  if (!piece) return;

  if (isWhitePiece(piece)) {
    // Select own piece
    selectedSquare = { row, col };
    selectedPiece3D = pieces3D[row][col];
    possibleMoves = getPossibleMoves(row, col);
    updateBoardHighlights();
    updatePieceHighlight();
  } else if (selectedSquare) {
    // Clicked enemy piece - try to capture it if valid move
    const isValidMove = possibleMoves.some(m => m.row === row && m.col === col);

    if (isValidMove) {
      makeMove(selectedSquare.row, selectedSquare.col, row, col);
      selectedSquare = null;
      selectedPiece3D = null;
      possibleMoves = [];
      updateBoardHighlights();
      updatePieceHighlight();

      setTimeout(() => {
        if (currentTurn === 'black') {
          makeAIMove();
        }
      }, 500);
    }
  }
}

function handleSquareClick(row, col) {
  if (!selectedSquare) return;

  const isValidMove = possibleMoves.some(m => m.row === row && m.col === col);

  if (isValidMove) {
    makeMove(selectedSquare.row, selectedSquare.col, row, col);
    selectedSquare = null;
    selectedPiece3D = null;
    possibleMoves = [];
    updateBoardHighlights();
    updatePieceHighlight();

    setTimeout(() => {
      if (currentTurn === 'black') {
        makeAIMove();
      }
    }, 500);
  } else {
    selectedSquare = null;
    selectedPiece3D = null;
    possibleMoves = [];
    updateBoardHighlights();
    updatePieceHighlight();
  }
}

function updateBoardHighlights() {
  // Reset all squares
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = boardSquares[row][col];
      square.material.color.setHex(square.userData.originalColor);
    }
  }

  // Highlight selected square
  if (selectedSquare) {
    const square = boardSquares[selectedSquare.row][selectedSquare.col];
    square.material.color.setHex(COLORS.selected);
  }

  // Highlight possible moves
  for (const move of possibleMoves) {
    const square = boardSquares[move.row][move.col];
    square.material.color.setHex(COLORS.possibleMove);
  }
}

function updatePieceHighlight() {
  // Reset all piece colors
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece3D = pieces3D[row][col];
      if (piece3D) {
        const pieceType = board[row][col];
        const isWhite = pieceType === pieceType.toUpperCase();
        const originalColor = isWhite ? COLORS.whitePiece : COLORS.blackPiece;

        piece3D.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material.color.setHex(originalColor);
          }
        });
      }
    }
  }

  // Highlight selected piece in orange
  if (selectedPiece3D) {
    selectedPiece3D.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material.color.setHex(COLORS.highlight);
      }
    });
  }
}

function makeMove(fromRow, fromCol, toRow, toCol) {
  // Update board data
  board[toRow][toCol] = board[fromRow][fromCol];
  board[fromRow][fromCol] = null;

  // Update 3D pieces
  const piece3D = pieces3D[fromRow][fromCol];
  if (pieces3D[toRow][toCol]) {
    scene.remove(pieces3D[toRow][toCol]);
  }

  pieces3D[toRow][toCol] = piece3D;
  pieces3D[fromRow][fromCol] = null;

  const squareSize = 2;
  const offset = (8 * squareSize) / 2 - squareSize / 2;

  piece3D.position.set(
    toCol * squareSize - offset,
    0.15,
    toRow * squareSize - offset
  );
  piece3D.userData.row = toRow;
  piece3D.userData.col = toCol;

  currentTurn = currentTurn === 'white' ? 'black' : 'white';
  updateTurnInfo();
}

function updateTurnInfo() {
  if (currentTurn === 'white') {
    turnInfo.textContent = 'your turn (white)';
  } else {
    turnInfo.textContent = "ai's turn (black)";
  }
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

// ============================================
// CHESS LOGIC (Same as before)
// ============================================

function isWhitePiece(piece) {
  return piece === piece.toUpperCase();
}

function isBlackPiece(piece) {
  return piece === piece.toLowerCase();
}

function getPossibleMoves(row, col) {
  const piece = board[row][col];
  if (!piece) return [];

  const moves = [];
  const pieceType = piece.toLowerCase();

  switch (pieceType) {
    case 'p': moves.push(...getPawnMoves(row, col, piece)); break;
    case 'r': moves.push(...getRookMoves(row, col, piece)); break;
    case 'n': moves.push(...getKnightMoves(row, col, piece)); break;
    case 'b': moves.push(...getBishopMoves(row, col, piece)); break;
    case 'q': moves.push(...getQueenMoves(row, col, piece)); break;
    case 'k': moves.push(...getKingMoves(row, col, piece)); break;
  }

  return moves;
}

function getPawnMoves(row, col, piece) {
  const moves = [];
  const direction = isWhitePiece(piece) ? -1 : 1;
  const startRow = isWhitePiece(piece) ? 6 : 1;

  if (board[row + direction]?.[col] === null) {
    moves.push({ row: row + direction, col });

    if (row === startRow && board[row + direction * 2]?.[col] === null) {
      moves.push({ row: row + direction * 2, col });
    }
  }

  for (const dcol of [-1, 1]) {
    const target = board[row + direction]?.[col + dcol];
    if (target && isWhitePiece(piece) !== isWhitePiece(target)) {
      moves.push({ row: row + direction, col: col + dcol });
    }
  }

  return moves;
}

function getRookMoves(row, col, piece) {
  const moves = [];
  const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

  for (const [drow, dcol] of directions) {
    let r = row + drow;
    let c = col + dcol;

    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const target = board[r][c];
      if (target === null) {
        moves.push({ row: r, col: c });
      } else {
        if (isWhitePiece(piece) !== isWhitePiece(target)) {
          moves.push({ row: r, col: c });
        }
        break;
      }
      r += drow;
      c += dcol;
    }
  }

  return moves;
}

function getKnightMoves(row, col, piece) {
  const moves = [];
  const jumps = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ];

  for (const [drow, dcol] of jumps) {
    const r = row + drow;
    const c = col + dcol;

    if (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const target = board[r][c];
      if (target === null || isWhitePiece(piece) !== isWhitePiece(target)) {
        moves.push({ row: r, col: c });
      }
    }
  }

  return moves;
}

function getBishopMoves(row, col, piece) {
  const moves = [];
  const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

  for (const [drow, dcol] of directions) {
    let r = row + drow;
    let c = col + dcol;

    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const target = board[r][c];
      if (target === null) {
        moves.push({ row: r, col: c });
      } else {
        if (isWhitePiece(piece) !== isWhitePiece(target)) {
          moves.push({ row: r, col: c });
        }
        break;
      }
      r += drow;
      c += dcol;
    }
  }

  return moves;
}

function getQueenMoves(row, col, piece) {
  return [...getRookMoves(row, col, piece), ...getBishopMoves(row, col, piece)];
}

function getKingMoves(row, col, piece) {
  const moves = [];
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], [0, 1],
    [1, -1], [1, 0], [1, 1]
  ];

  for (const [drow, dcol] of directions) {
    const r = row + drow;
    const c = col + dcol;

    if (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const target = board[r][c];
      if (target === null || isWhitePiece(piece) !== isWhitePiece(target)) {
        moves.push({ row: r, col: c });
      }
    }
  }

  return moves;
}

function makeAIMove() {
  const allMoves = [];

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && isBlackPiece(piece)) {
        const moves = getPossibleMoves(row, col);
        for (const move of moves) {
          allMoves.push({
            from: { row, col },
            to: move,
            score: evaluateMove(row, col, move.row, move.col)
          });
        }
      }
    }
  }

  if (allMoves.length === 0) {
    statusInfo.textContent = 'you win!';
    return;
  }

  allMoves.sort((a, b) => b.score - a.score);
  const bestMove = allMoves[0];

  makeMove(bestMove.from.row, bestMove.from.col, bestMove.to.row, bestMove.to.col);
}

function evaluateMove(fromRow, fromCol, toRow, toCol) {
  let score = Math.random() * 10;

  const target = board[toRow][toCol];
  if (target) {
    const pieceValues = { 'p': 10, 'n': 30, 'b': 30, 'r': 50, 'q': 90, 'k': 900 };
    score += pieceValues[target.toLowerCase()] || 0;
  }

  const centerDistance = Math.abs(toRow - 3.5) + Math.abs(toCol - 3.5);
  score += (7 - centerDistance) * 2;

  return score;
}
