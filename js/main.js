/*-----------------------------------------------------------------------------
================================== Variables ==================================
-----------------------------------------------------------------------------*/
let rows = null
let columns = null
let time = null
let bombs = null
let flagCount = null
let playerCells = null
let cellCount = null
let cells = null
let cellsWithBombs = null
let gameOver = null
let cellsToBeRevealed = null
let timer = null
let cellEls = null
let firstClick = null

/*-----------------------------------------------------------------------------
============================= Objects and Classes =============================
-----------------------------------------------------------------------------*/
// Object constructor for cells
class Cell {
  constructor(
    id,
    xcor,
    ycor,
    hasBomb,
    hasFlag,
    hasNeighboringBombs,
    isRevealed,
    neighbors
  ) {
    this.id = id
    this.xcor = xcor
    this.ycor = ycor
    this.hasBomb = hasBomb
    this.hasFlag = hasFlag
    this.hasNeighboringBombs = hasNeighboringBombs
    this.isRevealed = isRevealed
    this.neighbors = neighbors
  }
  isEdge() {
    if (
      this.xcor === 0 ||
      this.xcor === columns - 1 ||
      this.ycor === 0 ||
      this.ycor == rows - 1
    ) {
      return true
    }
    return false
  }
  countNeighborsWithBombs() {
    let neighborBombCount = 0
    this.neighbors.forEach(neighbor => {
      if (cells[neighbor].hasBomb) neighborBombCount++
    })
    return neighborBombCount
  }
  cascade() {
    this.neighbors.forEach(neighbor => {
      let cell = cells[neighbor]
      if (!cell.isRevealed && !cell.hasFlag) {
        if (cell.hasNeighboringBombs) {
          cellEls[cell.id].classList.add('animated', 'flash')
          cell.isRevealed = true
        }
        if (!cell.hasNeighboringBombs) {
          cell.isRevealed = true
          cellEls[cell.id].classList.add('animated', 'flash')
          //Round and round we go
          cell.cascade()
        }
      }
    })
  }
}

let colorMode = {
  dark: 0,
  light: 1,
	change: false,
	colorStr: "light",
  changeColorMode: function() {
    if (this.dark) {
      this.light = 1
      this.dark = 0
			this.change = true
			this.colorStr = "light"
    } else {
      this.light = 0
      this.dark = 1
			this.change = true
			this.colorStr = "dark"
    }
    preRender()
  },
}

const explosionMedia = new Audio('../media/explosion.wav')
const yayMedia = new Audio('../media/yay.mp3')

/*-----------------------------------------------------------------------------
==================================== Cache ====================================
-----------------------------------------------------------------------------*/

// Query these elements only to style them.
const bodyEl = document.querySelector('body')
const boundingEl = document.querySelector('main')
// Query these for logic
const titleEl = document.querySelector('#title')
const flagCountEl = document.querySelector('#flag-count')
const mineCatEl = document.querySelector('#mine-cat')
const timeEl = document.querySelector('#time')
const gameboardEl = document.querySelector('#gameboard')
const navEl = document.querySelector('.nav')
const navBtnEl = document.querySelectorAll('.nav-button')
// Nav bar elements
const lightDarkBtnEl = document.querySelector('#light-dark-btn')
const subColumnsBtnEl = document.querySelector('#sub-columns-btn')
const columnsInputEl = document.querySelector('#columns-input')
const posColumnsBtnEl = document.querySelector('#pos-columns-btn')
const subRowsBtnEl = document.querySelector('#sub-rows-btn')
const rowsInputEl = document.querySelector('#rows-input')
const posRowsBtnEl = document.querySelector('#pos-rows-btn')
const subBombsBtnEl = document.querySelector('#sub-bombs-btn')
const bombsInputEl = document.querySelector('#bombs-input')
const posBombsBtnEl = document.querySelector('#pos-bombs-btn')

/*-----------------------------------------------------------------------------
=============================== Event Listeners ===============================
-----------------------------------------------------------------------------*/

gameboardEl.addEventListener('click', handleCellClick)
gameboardEl.addEventListener('auxclick', handleCellAuxClick)
mineCatEl.addEventListener('click', init)
subColumnsBtnEl.addEventListener('click', subFromInputField, "columns")
posColumnsBtnEl.addEventListener('click', posToInputField, "columns")
subRowsBtnEl.addEventListener('click', subFromInputField, "rows")
posRowsBtnEl.addEventListener('click', posToInputField, "rows")
subBombsBtnEl.addEventListener('click', subFromInputField, "bombs")
posBombsBtnEl.addEventListener('click', posToInputField, "bombs")
columnsInputEl
rowsInputEl
bombsInputEl

/*-----------------------------------------------------------------------------
================================= Functions ===================================
-----------------------------------------------------------------------------*/

// *EVENTUALLY* Querry the user for everything, or query them to choose a
// *difficulty
function init() {
  /* 2 rows and columns are added compared to what the user inputs, because the 
	first and last of each are hidden from the user view*/
  // Don't allow user to set less than 12 columns
  rows = 10
  columns = 12
  flagCount = bombs = 10
  time = 0
  gameOver = cellCount = cellsWithBombs = 0
  cells = []
  cellEls = []
  firstClick = 1
  clearInterval(timer)
  timer = 0
  timeEl.textContent = '000'
  mineCatEl.textContent = '😸'
  while (gameboardEl.firstChild) {
    gameboardEl.removeChild(gameboardEl.firstChild)
  }
  boardBuilder()
  cellBuilder()
  plantBombs()
  placeNumbers()
  preRender()
}

/*========================= Board and Cell Creation =========================*/

function boardBuilder() {
  /* Determine the height of the bounding box with the number of user facing 
rows, multiplied by the size of each cell, plus the height of all the elements
within the bounding box. Do the same for the width using the columns. */
  boundingEl.style.height = (rows - 2) * 25 + 107 + 4 + 20 + 'px'
  boundingEl.style.width = (columns - 2) * 25 + 10 + 4 + 20 + 'px'
  /* Determine the height of the board with the number of user facing rows,
	multiplied by the size of each cell. Do the same for the width using the
	columns */
  gameboardEl.style.height = (rows - 2) * 25 + 'px'
  gameboardEl.style.width = (columns - 2) * 25 + 'px'
}

function cellBuilder() {
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      let newCell = new Cell(
        cellCount,
        column,
        row,
        null,
        false,
        false,
        false,
        [
          cellCount - columns - 1,
          cellCount - columns,
          cellCount - columns + 1,
          cellCount - 1,
          cellCount + 1,
          cellCount + columns - 1,
          cellCount + columns,
          cellCount + columns + 1,
        ]
      )
      /* Places cells onto the board, places a bomb in any cell not revealed on
			the board to remove literal edge cases in bomb placement logic */
      if (newCell.isEdge()) {
        // Fill outside edges with bombs, don't show them to the player
        let newCellEl = document.createElement('div')
        cellEls.push(newCellEl)
        newCell.hasBomb = true
      } else {
        let newCellEl = document.createElement('div')
        newCellEl.setAttribute('id', cellCount)
        newCellEl.classList.add('cell', 'light')
        gameboardEl.appendChild(newCellEl)
        cellEls.push(newCellEl)
      }
      // From this point, logic is carried out using the cells array
      cells.push(newCell)
      cellCount++
    }
  }
}

function plantBombs() {
  while (cellsWithBombs < bombs) {
    let cellId = getRandomIntInclusive(0, cells.length - 1)
    if (!cells[cellId].hasBomb) {
      cells[cellId].hasBomb = true
      cellsWithBombs++
    }
  }
  /*Prevent the edge case of a 9 bombs within a 3x3 area (or 6 bombs within
		2x3 area around the edges OR 4 bombs within a 2x2 area in the corners)*/
  cells.forEach(cell => {
    if (!cell.isEdge() && cell.hasBomb && cell.countNeighborsWithBombs() == 8) {
      cell.hasBomb = false
      cellsWithBombs--
      //Round and round we go
      plantBombs()
    }
  })
}

function placeNumbers() {
  /* Remove bombs from outside cells, they will interfere with number placement.
Fill cells with a number and mark them as revealed. We are now done with edges*/
  cells.forEach(cell => {
    if (cell.isEdge()) {
      cell.hasBomb = false
      cell.hasNeighboringBombs = 1
      cell.isRevealed = true
    }
  })
  cells.forEach(cell => {
    if (!cell.isEdge() && !cell.hasBomb) {
      cell.hasNeighboringBombs = cell.countNeighborsWithBombs()
      //document.getElementById(cell.id).textContent = cell.hasNeighboringBombs
    }
  })
}

/*============================= Event Functions =============================*/

function handleCellClick(evnt) {
  if (firstClick) {
    timer = setInterval(renderTime, 1000)
  }
  let cell = cells[evnt.target.id]
  let cellEl = cellEls[evnt.target.id]
  if (!gameOver && !cell.hasFlag && !cell.isRevealed) {
    if (cell.hasBomb) {
      cell.isRevealed = true
      cellEl.classList.add('animated', 'flash')
      explosionMedia.play()
      gameOver = -1
    } else if (cell.hasNeighboringBombs) {
      cell.isRevealed = true
      cellEl.classList.add('animated', 'flash')
    } else {
      cell.isRevealed = true
      cellEl.classList.add('animated', 'flash')
      cell.cascade()
    }
    checkForEndGame()
  }
}

function handleCellAuxClick(evnt) {
  let cell = cells[evnt.target.id]
  if (!gameOver && !cell.isRevealed) {
    if (flagCount) {
      cell.hasFlag
        ? ((cell.hasFlag = false), flagCount++)
        : ((cell.hasFlag = true), flagCount--)
    } else {
      flagCountEl.classList.add('animated', 'flash')
    }
  }
  preRender()
}

function checkForEndGame() {
  cellsToBeRevealed = null
  cells.forEach(cell => {
    if (!cell.isRevealed) {
      cellsToBeRevealed++
    }
  })
  if (!gameOver && cellsToBeRevealed === bombs) {
    gameOver = 1
    yayMedia.play()
  }
  if (gameOver) {
    cells.forEach(cell => {
      cell.isRevealed = true
      cellEls[cell.id].classList.add('animated', 'flash')
    })
  }
  preRender()
}

/*================================== Render ==================================*/

function preRender() {
  if (colorMode.change) {
    if (colorMode.dark) {
      body.classList.replace('light', 'dark')
      boundingEl.classList.replace('light', 'dark')
      titleEl.classList.replace('light', 'dark')
      flagCountEl.classList.replace('light', 'dark')
      mineCatEl.classList.replace('light', 'dark')
      timeEl.classList.replace('light', 'dark')
      cellEls.forEach(cellEl => cellEl.classList.replace('light', 'dark'))
    } else {
      boundingEl.classList.replace('dark', 'light')
      titleEl.classList.replace('dark', 'light')
      flagCountEl.classList.replace('dark', 'light')
      mineCatEl.classList.replace('dark', 'light')
      timeEl.classList.replace('dark', 'light')
      cellEls.forEach(cellEl => cellEl.classList.replace('dark', 'light'))
    }
    colorMode.change = false
  }
  render()
}

function render() {
  let flagCountStr = formatNumberWithPadding(flagCount, '0', 3)
  flagCountEl.textContent = flagCountStr
  if (gameOver) {
    gameOver === 1
      ? (mineCatEl.textContent = '😻')
      : (mineCatEl.textContent = '🙀')
  }
  cellEls.forEach((cellEl, idx) => {
    let cell = cells[idx]
    if (cell.isRevealed) {
      cellEl.classList.add('revealed')
      if (cell.hasBomb) {
        gameOver === 1
          ? (cellEl.textContent = '😻')
          : (cellEl.textContent = '💣')
      } else if (cell.hasNeighboringBombs) {
        cellEl.textContent = cell.hasNeighboringBombs
        cellEl.classList.add(`num${cell.hasNeighboringBombs}`)
      } else {
        cellEl.textContent = ''
      }
    }
    if (cell.hasFlag) cellEl.textContent = '🚩'
    if (!cell.isRevealed && !cell.hasFlag) cellEl.textContent = ''
  })
}

function renderTime() {
  firstClick = 0
  if (!gameOver) {
    if (time < 999) {
      time++
      console.log(time)
      let timeStr = formatNumberWithPadding(time, '0', 3)
      console.log(timeStr)
      timeEl.textContent = timeStr
    }
  }
}

/*============================= Helper Functions =============================*/

function formatNumberWithPadding(num, pad, len) {
  num += ''
  if (num.length >= len) return num
  return pad.repeat(len - num.length) + num
}

function getRandomIntInclusive(minNum, maxNum) {
  minNum = Math.ceil(minNum)
  maxNum = Math.floor(maxNum)
  return Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum
}

init()
