/*******************************************************************
 * Game of Life                                                    *
 * Written by Martin Forsgren 2011                                 *
 * inspired by http://clj-me.cgrand.net/index.php?s=game+of+life   *
 *******************************************************************/

// TODO: ändra player1 > player2 ? så om lika blir cellen oförändrad
// kanske.., eller lättare (och bättre ?) ändra bara på nyskapade celler.

var canvas, ctx;
var cellSize = 10;
//var cells = {};
var cells = {"10,10":[10,10,false],"10,11":[10,11,true],"11,11":[11,11,false],"11,10":[11,10,true]}
var oldCells = cells;

var numToWin = 4; // how many needed in a row to win

var player1 = true;
var player2 = false
var currPlayer = player1;

var color1 = '#00f'; // blue
var color2 = '#f00'; // red

//// Helper functions:
function wrapX(n) {
    var width = Math.ceil(canvas.width/cellSize);
    return (n < 0) ? width + n : n % width;
}

function wrapY(n) {
    var height = Math.ceil(canvas.height/cellSize);
    return (n < 0) ? height + n : n % height;
}

function getCursorPosition(e) {
    var x, y;
    if (e.pageX || e.pageY) {
	x = e.pageX;
	y = e.pageY;
    }
    else {
	x = e.clientX + document.body.scrollLeft +
            document.documentElement.scrollLeft;
	y = e.clientY + document.body.scrollTop +
            document.documentElement.scrollTop;
    }
    // Convert to coordinates relative to the canvas
    x -= canvas.offsetLeft;
    y -= canvas.offsetTop; 
    return [Math.floor(x/cellSize), Math.floor(y/cellSize)];
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}


//// Game logic:
function neighbours(cell) {
    var x = cell[0];
    var y = cell[1];
    var neighbs = {};
    var dx = [-1, 0, 1];
    for(var i in dx) {
	var dy = (dx[i] == 0) ? [-1,1] : [-1,0,1];
        for(var j in dy) {
            var neighbour =  [wrapX(dx[i] + x), wrapY(dy[j] + y)];
            neighbs[neighbour] = [neighbour[0], neighbour[1], cell[2]];
        }
    }
    return neighbs;
}

// returns a map with elements that looks like: 
// cell:[neighbourcount, the player most of the neighbours belonged to]
// (if equal player2  will be returned, but that will never be used
// since the information is only used when new cells are created, so
// (neighbourcount == 3) == (p1freq != p2freq)
function freqsWithPlayer(cells) {
    freqs = {};
    for(var i in cells) {
        cell = [cells[i][0],cells[i][1]];
        player = cells[i][2];
        if(freqs[cell] == undefined)
            freqs[cell] = {true:0, false:0};
        freqs[cell][player]++;
    }
    for(var i in freqs) {
        var p1freq = freqs[i][player1];
        var p2freq = freqs[i][player2];
        freqs[i] = [p1freq + p2freq, p1freq > p2freq]; 
    }
    return freqs;
}

function nextGen(cells) {
    var allNeighbours = [];
    for(i in cells) {
        var neighbs = neighbours(cells[i]);
        for(j in neighbs) {
            allNeighbours.push(neighbs[j]);
        }
    } 
    var neighbourfreqs = freqsWithPlayer(allNeighbours);

    var next = {};
    for(var cell in neighbourfreqs) {
        var freq = neighbourfreqs[cell][0];
        var player = neighbourfreqs[cell][1];
        var cellAsArray = cell.split(",").map(function(a){return parseInt(a,10);});
        if(cells[cell] && (freq == 2 || freq == 3)) {
            // don't change color of cells that already exist. 
            next[cell] = [ cellAsArray[0], cellAsArray[1], cells[cell][2] ];
        } else if(freq == 3) {
            // Set the color of a cell to the same as the most common among neighbours
            next[cell] = [cellAsArray[0], cellAsArray[1], player];
        }
    }
    return next;
}

function checkForVictory(cells) {
    for(i in cells) {
        var counts = [1, 1, 1, 1];
        var x = cells[i][0];
        var y = cells[i][1];
        var player = cells[i][2];
        function existsAndSamePlayer(cell) {
            return cells[cell] && cells[cell][2] == player;
        }
        for(var i = 1; i < numToWin; i++) {
            if(existsAndSamePlayer([x+i, y]))   counts[0]++; // horizontal
            if(existsAndSamePlayer([x, y+i]))   counts[1]++; // vertical
            if(existsAndSamePlayer([x+i, y-i])) counts[2]++; // diag up
            if(existsAndSamePlayer([x+i, y+i])) counts[3]++; // diag down
        }
        if(counts.indexOf(numToWin) > -1)
            return player ? 1 : 2;
    }
    return false;
}

// If the given position is free, a cell of the current players color
// is placed on there, true is returned, If the position is occupied 
// nothing happens and false is returned.
function addCell(pos) {
    if(cells[pos]) {
        alert("No!");
        return false;
    } else {
        cells[pos] = [pos[0],pos[1],currPlayer];
        return true;
    }
}

//// 
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);  
    // draw cells
    for(var i in cells) {
        ctx.fillStyle = cells[i][2] ? color1 : color2;
        ctx.fillRect(cellSize*cells[i][0], cellSize*cells[i][1], 
                     cellSize, cellSize);
    }
    // display current player
    ctx.fillText(currPlayer ? "Player 1" : "Player 2", 10, 20);
}

function drawNext() {
    oldCells = cells;
    cells = nextGen(cells);
    draw();
}

function undo() {
    cells = oldCells;
    currPlayer = !currPlayer;
    draw();
}

function onClick (e) {
    if(addCell(getCursorPosition(e))) {
        currPlayer = !currPlayer;
        draw();
        var winner = checkForVictory(cells);
        if(winner)
            alert("Player " + winner + " won!");
        setTimeout(drawNext, 500);
    }
}

function init() {
    canvas = document.getElementById('gol');
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.onresize = resizeCanvas;
    canvas.addEventListener('click', onClick);
    draw();
}
