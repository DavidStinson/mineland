/*-----------------------------------------------------------------------------
================================== Variables ==================================
-----------------------------------------------------------------------------*/
let rows = null
let columns = null
let time = null
let bombs = null
let playerFlags = null
let playerCells = null
let cellCount = null
let cells = null
let cellsWithBombs = null
let gameOver = null
let cellsToBeRevealed = null

/*-----------------------------------------------------------------------------
=================================== Objects ===================================
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
      if (!cell.isRevealed) {
        if (!cell.hasFlag) {
          if (!cell.hasBomb) {
            if (cell.hasNeighboringBombs) {
              document.getElementById(cell.id).style.background = 'orange'
              cell.isRevealed = true
            }
            if (!cell.hasNeighboringBombs) {
              cell.isRevealed = true
              document.getElementById(cell.id).style.background = 'green'
              //Round and round we go
              cell.cascade()
            }
          }
        }
      }
    })
  }
}

let colorMode = {
  dark: 1,
	light: 0,
	change: false,
  changeColorMode: function() {
    if (colorMode.dark) {
      colorMode.light = 1
			colorMode.dark = 0
			colorMode.change = true
    } else {
      colorMode.light = 0
			colorMode.dark = 1
			colorMode.change = true
    }
    preRender()
  },
}

/*-----------------------------------------------------------------------------
==================================== Cache ====================================
-----------------------------------------------------------------------------*/

const boundingEl = document.querySelector('main')
const titleEl = document.querySelector('#title')
const flagCountEl = document.querySelector('#flag-count')
const mineCatEl = document.querySelector('#mine-cat')
const countdownEl = document.querySelector('#countdown')
const gameboardEl = document.querySelector('#gameboard')

/*-----------------------------------------------------------------------------
=============================== Event Listeners ===============================
-----------------------------------------------------------------------------*/

gameboardEl.addEventListener('click', handleCellClick)
gameboardEl.addEventListener('auxclick', handleCellAuxClick)
mineCatEl.addEventListener('click', checkForEndGame)

/*-----------------------------------------------------------------------------
================================= Functions ===================================
-----------------------------------------------------------------------------*/

// init
/*
 *EVENTUALLY* Querry the user for everything, or query them to choose a
 *difficulty */
function init() {
  /* 2 rows and columns are added compared to what the user inputs, because the 
	first and last of each are hidden from the user view*/
  // Don't allow user to set less than 12 columns
  rows = 10
  columns = 14
  playerFlags = 20
  bombs = 10
  time = 999
  gameOver = cellCount = cellsWithBombs = 0
  cells = []
  boardBuilder()
  cellBuilder()
  plantBombs()
  placeNumbers()
}

function boardBuilder() {
  /* Determine the height of the bounding box with the number of user facing 
rows, multiplied by the size of each cell, plus the height of all the elements
within the bounding box. Do the same for the width using the columns. */
  boundingEl.style.height = (rows - 2) * 25 + 107 + 4 + 'px'
  boundingEl.style.width = (columns - 2) * 25 + 10 + 4 + 'px'
  /* Determine the height of the board with the number of user facing rows,
	multiplied by the size of each cell. Do the same for the width using the
	columns */
  gameboardEl.style.columns = (rows - 2) * 25 + 'px'
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
        newCell.hasBomb = true
      } else {
        let newCellEl = document.createElement('div')
        newCellEl.setAttribute('id', cellCount)
        newCellEl.classList.add('cell')
        gameboardEl.appendChild(newCellEl)
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
      document.getElementById(cells[cellId].id).textContent = 'b'
    }
  }
  /*Prevent the edge case of a 9 bombs within a 3x3 area (or 6 bombs within
		2x3 area around the edges OR 4 bombs within a 2x2 area in the corners)*/
  cells.forEach(cell => {
    if (!cell.isEdge()) {
      if (cell.hasBomb) {
        if (cell.countNeighborsWithBombs() === 8) {
          cell.hasBomb = false
          cellsWithBombs--
          document.getElementById(cell.id).textContent = ''
          //Round and round we go
          plantBombs()
        }
      }
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
    if (!cell.isEdge()) {
      if (!cell.hasBomb) {
        cell.hasNeighboringBombs = cell.countNeighborsWithBombs()
        document.getElementById(cell.id).textContent = cell.hasNeighboringBombs
      }
    }
  })
}

function handleCellClick(evnt) {
  let cell = cells[evnt.target.id]
  if (!gameOver) {
    if (!cell.hasFlag) {
      if (!cell.isRevealed) {
        if (cell.hasBomb) {
          cell.isRevealed = true
          return
        } else {
          if (cell.hasNeighboringBombs) {
            document.getElementById(cell.id).style.background = 'orange'
            cell.isRevealed = true
          } else {
            document.getElementById(cell.id).style.background = 'green'
            cell.isRevealed = true
            cell.cascade()
          }
        }
        checkForEndGame()
      }
    }
  }
}

function handleCellAuxClick(evnt) {
  let cell = cells[evnt.target.id]
  if (!gameOver) {
    if (playerFlags) {
      if (!cell.isRevealed) {
        cell.hasFlag
          ? ((cell.hasFlag = false), playerFlags++)
          : ((cell.hasFlag = true), playerFlags--)
      }
    } else {
      //FLASH FLAG COUNTER HERE
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
  if (cellsToBeRevealed === bombs) {
    if (!gameOver) {
      gameOver = 1
    }
    if (gameOver) {
      cells.forEach(cell => {
        cell.isRevealed = true
      })
    }
  }
}

// render

/*  Render cells
		render framing
		render countdown
		render emoji button */

function preRender() {
  if (colorMode.colo) {
    boundingEl.classList
  }
  colorMode.dark ? render('dm') : render('lm')
}

function render(color) {
  cells.forEach(cell => {
    if (cell.isRevealed) {
      if (cell.hasBomb) {
      }
    }
  })
}

function getRandomIntInclusive(minNum, maxNum) {
  minNum = Math.ceil(minNum)
  maxNum = Math.floor(maxNum)
  return Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum
}

init()
