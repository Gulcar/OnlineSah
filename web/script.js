const board = document.getElementById("board");
let squares = [];
let selectedSquare = -1;
let boardWidth = 0;

let socket = io();

let id = location.pathname.substring(6, location.pathname.length - 6);
socket.emit("start-playing", id);

socket.on("move-piece", move => {
    MovePiece(move.from, move.to);
    HideAllPossibleMoves();
    squares[move.from].classList.add("square-selected");
    squares[move.to].classList.add("square-selected");
    selectedSquare = -1;
});

let possibleMoves = [];
socket.on("possible-moves", moves => {
    possibleMoves = moves;
});

socket.on("playing-white", () => {
    GenSquares();
    GenPieces();
    Resize();
    addEventListener("resize", Resize);
});

socket.on("playing-black", () => {
    GenSquaresFlippedForBlack();
    GenPieces();
    Resize();
    addEventListener("resize", Resize);
});

socket.on("move", url => {
    location.href = url;
});

socket.on("en-passant", index => {
    squares[index].classList.remove("white-pawn");
    squares[index].classList.remove("black-pawn");
});

function GetPiece(sqrIndex) {
    let sqr = squares[sqrIndex];
    let possiblePieces = ["black-rook", "black-knight", "black-bishop", "black-queen",
        "black-king", "black-pawn", "white-rook", "white-knight", "white-bishop",
        "white-queen", "white-king", "white-pawn"];

    for (let i = 0; i < possiblePieces.length; i++) {
        if (sqr.classList.contains(possiblePieces[i]))
            return possiblePieces[i];
    }
    return "";
}

function GenSquares() {
    let col = false;
    for (let i = 0; i < 64; i++) {
        col = !col;
        if (i % 8 == 0)
            col = false;
        if (i % 16 == 0)
            col = true;
        let c = col ? "square-light" : "square-dark";
        //board.innerHTML += `<div onclick="OnClick(${i})" id="square${i}" class="${c} square">${i}</div>`;
        board.innerHTML += `<div onclick="OnClick(${i})" id="square${i}" class="${c} square"></div>`;
    }
    squares = document.getElementsByClassName("square");
}

function GenSquaresFlippedForBlack() {
    let col = false;
    for (let i = 63; i >= 0; i--) {
        col = !col;
        if (i % 8 == 7)
             col = false;
        if (i % 16 == 15)
             col = true;
        let c = col ? "square-light" : "square-dark";
        //board.innerHTML += `<div onclick="OnClick(${i})" id="square${i}" class="${c} square">${i}</div>`;
        board.innerHTML += `<div onclick="OnClick(${i})" id="square${i}" class="${c} square"></div>`;
    }
    squares = document.getElementsByClassName("square");
    squares = [...squares];
    squares = squares.reverse();
}

function GenPieces() {
    squares[0].classList.add("black-rook");
    squares[1].classList.add("black-knight");
    squares[2].classList.add("black-bishop");
    squares[3].classList.add("black-queen");
    squares[4].classList.add("black-king");
    squares[5].classList.add("black-bishop");
    squares[6].classList.add("black-knight");
    squares[7].classList.add("black-rook");

    for (let i = 8; i < 16; i++) {
        squares[i].classList.add("black-pawn");
    }

    squares[56].classList.add("white-rook");
    squares[57].classList.add("white-knight");
    squares[58].classList.add("white-bishop");
    squares[59].classList.add("white-queen");
    squares[60].classList.add("white-king");
    squares[61].classList.add("white-bishop");
    squares[62].classList.add("white-knight");
    squares[63].classList.add("white-rook");

    for (let i = 48; i < 56; i++) {
        squares[i].classList.add("white-pawn");
    }
}

function Resize() {
    let boardWidth = Math.min(window.innerWidth, window.innerHeight * 0.9);
    board.style.width = `${boardWidth}px`;
    board.style.height = `${boardWidth}px`;
}

function MovePiece(from, to) {
    let piece = GetPiece(from);
    if (piece != "") {

        squares[from].classList.remove(piece);

        // remove piece that we will override with a new one
        let p2 = GetPiece(to);
        if (p2 != "") {
            squares[to].classList.remove(p2);
        }

        // promotion
        if (to < 8 && piece == "white-pawn") {
            piece = "white-queen";
        }
        else if (to >= 56 && piece == "black-pawn") {
            piece = "black-queen";
        }

        squares[to].classList.add(piece);
    }
}

function HideAllPossibleMoves() {
    for (let i = 0; i < 64; i++) {
        squares[i].classList.remove("square-selected");
    }
}

function ShowPossibleMoves() {
    possibleMoves
        .filter(move => move.from == selectedSquare)
        .forEach(move => {
            squares[move.to].classList.add("square-selected");
        });
    
    squares[selectedSquare].classList.add("square-selected");
}

function OnClick(sqrIndex) {

    if (selectedSquare != -1 && selectedSquare != sqrIndex) {
        
        if (possibleMoves.find(m => m.from == selectedSquare && m.to == sqrIndex) != undefined) {
            socket.emit("move-piece", id, { from: selectedSquare, to: sqrIndex });
        }
        
        if (GetPiece(sqrIndex) == "") {
            HideAllPossibleMoves();
            selectedSquare = -1;
        } else {
            selectedSquare = sqrIndex;
            HideAllPossibleMoves();
            ShowPossibleMoves();
        }
    }
    else if (selectedSquare != -1 && selectedSquare == sqrIndex)
    {
        HideAllPossibleMoves();
        selectedSquare = -1;
    }
    else
    {
        selectedSquare = sqrIndex;
        HideAllPossibleMoves();
        ShowPossibleMoves();
    }
}