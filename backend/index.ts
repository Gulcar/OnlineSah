const express = require('express');
import { Request, Response } from "express";
const app = express();
const http = require('http');
const server = http.createServer(app);
import { Server, Socket } from "socket.io";
const io = new Server(server);
var path = require('path');
import { v4 as uuid } from 'uuid';
import { Piece, Pawn, Rook, Knight, Bishop, Queen, King } from "./pieces";

export interface PieceMove {
    from: number,
    to: number
}

interface AvaiableGame {
    id: string,
    opponent: string
}

let availableGames: AvaiableGame[] = [
    { id: uuid(), opponent: "Janez" },
    { id: uuid(), opponent: "Lojze" },
    { id: uuid(), opponent: "GM Gal" },
    { id: uuid(), opponent: "Magnus" }
]

interface CastleOptions {
    blackLong: boolean;
    blackShort: boolean;
    whiteLong: boolean;
    whiteShort: boolean;
}

class Game
{
    id: string;
    whiteSocketId: string;
    blackSocketId: string;
    turnWhite: boolean;

    board: Array<Piece | null>;
    possibleMoves: PieceMove[];

    castleOptions: CastleOptions;
    currentAvailableCastles: [PieceMove, PieceMove][];

    prevMove: PieceMove;

    constructor(id: string) {
        this.id = id;
        this.whiteSocketId = "";
        this.blackSocketId = "";
        this.turnWhite = true;

        this.castleOptions = {
            blackLong: true,
            blackShort: true,
            whiteLong: true,
            whiteShort: true
        };
        this.currentAvailableCastles = [];

        this.prevMove = { from: 0, to: 0 };

        this.board = [];
        for (let i = 8; i <= 15; i++) {
            this.board[i] = new Pawn(false);
        }
        for (let i = 48; i <= 55; i++) {
            this.board[i] = new Pawn(true);
        }
        this.board[0] = new Rook(false);
        this.board[1] = new Knight(false);
        this.board[2] = new Bishop(false);
        this.board[3] = new Queen(false);
        this.board[4] = new King(false);
        this.board[5] = new Bishop(false);
        this.board[6] = new Knight(false);
        this.board[7] = new Rook(false);

        this.board[56] = new Rook(true);
        this.board[57] = new Knight(true);
        this.board[58] = new Bishop(true);
        this.board[59] = new Queen(true);
        this.board[60] = new King(true);
        this.board[61] = new Bishop(true);
        this.board[62] = new Knight(true);
        this.board[63] = new Rook(true);

        this.possibleMoves = [];
        this.getAllPossibleMoves();
    }

    isCheck(white: boolean): boolean {

        let kingIndex = -1;

        for (let i = 0; i < 64; i++) {
            if (this.board[i] != null) {
                if (this.board[i]!.white == white && this.board[i] instanceof King) {
                    kingIndex = i;
                    break;
                }
            }
        }

        for (let i = 0; i < 64; i++) {
            if (this.board[i] != null && this.board[i]!.white != this.turnWhite) {

                let movesForPiece = this.board[i]!.GetPossibleMoves(this.board, i);

                for (let j = 0; j < movesForPiece.length; j++) {
                    
                    if (movesForPiece[j].to == kingIndex) {
                        return true;
                    }

                }
            }
        }
        return false;
    }

    getAllPossibleMoves() {
        this.possibleMoves = [];

        for (let i = 0; i < 64; i++) {
            if (this.board[i] != null && this.board[i]!.white == this.turnWhite) {

                let movesForPiece = this.board[i]!.GetPossibleMoves(this.board, i);

                movesForPiece.forEach(move => {

                    let pieceFrom = this.board[move.from];
                    let pieceTo = this.board[move.to];

                    this.board[move.to] = pieceFrom;
                    this.board[move.from] = null;

                    if (this.isCheck(this.turnWhite) == false) {
                        this.possibleMoves.push(move);
                    }

                    this.board[move.to] = pieceTo;
                    this.board[move.from] = pieceFrom;

                });
            }
        }

        this.checkPossibleCastles();

        this.checkEnPassant();

        this.possibleMoves.push(...(this.currentAvailableCastles.map(c => c[0])));
        console.log(JSON.stringify(this.castleOptions));
        console.log(JSON.stringify(this.currentAvailableCastles));

        if (this.possibleMoves.length == 0) {
            console.log("sah mat na igri " + this.id);
        }

        io.to(this.whiteSocketId).emit("possible-moves", this.possibleMoves);
        io.to(this.blackSocketId).emit("possible-moves", this.possibleMoves);
    }

    isSquareInCheck(index: number): boolean {

        if (this.board[index] != null) {
            if ((this.board[index] instanceof King) == false) {
                console.log("square", index, "is blocked");
                return true;
            }
        }
        
        for (let i = 0; i < 64; i++) {
            if (this.board[i] != null && this.board[i]!.white != this.turnWhite) {

                let moves = this.board[i]!.GetPossibleMoves(this.board, i);

                for (let j = 0; j < moves.length; j++) {

                    if (moves[j].to == index) {
                        console.log("square", index, "is in check");
                        return true;
                    }

                }

            }
        }

        console.log("square", index, "not in check");
        return false;
    }

    checkPossibleCastles() {

        this.currentAvailableCastles = [];

        if (this.turnWhite) {

            if (this.castleOptions.whiteLong &&
                this.isSquareInCheck(58) == false &&
                this.isSquareInCheck(59) == false &&
                this.isSquareInCheck(60) == false &&
                this.board[57] == null) {

                this.currentAvailableCastles.push([
                    {from: 60, to: 58},
                    {from: 56, to: 59}
                ]);
            }

            if (this.castleOptions.whiteShort &&
                this.isSquareInCheck(60) == false &&
                this.isSquareInCheck(61) == false &&
                this.isSquareInCheck(62) == false) {
 
                this.currentAvailableCastles.push([
                    {from:60, to: 62},
                    {from:63, to: 61}
                ]);
            }
        }
        else // turn black
        {
            if (this.castleOptions.blackLong &&
                this.isSquareInCheck(2) == false &&
                this.isSquareInCheck(3) == false &&
                this.isSquareInCheck(4) == false &&
                this.board[1] == null) {
                
                this.currentAvailableCastles.push([
                    {from: 4, to: 2},
                    {from: 0, to: 3}
                ]);
            }

            if (this.castleOptions.blackShort &&
                this.isSquareInCheck(4) == false &&
                this.isSquareInCheck(5) == false &&
                this.isSquareInCheck(6) == false) {

                this.currentAvailableCastles.push([
                    {from: 4, to: 6},
                    {from: 7, to: 5}
                ]);
            }
        }
    }

    checkEnPassant() {
        if ((this.board[this.prevMove.to] instanceof Pawn) == false)
            return;
        
        if (Math.abs(this.prevMove.from - this.prevMove.to) != 16)
            return;

        let x = this.prevMove.to % 8;
        let y = Math.floor(this.prevMove.to / 8);

        const isTherePawn = (x: number, y: number): boolean => {
            if (x < 0 || x >= 8)
                return false;
            if (y < 0 || y >= 8)
                return false;
            
            let index = x + y * 8;
            if (this.board[index] != null) {
                if (this.board[index] instanceof Pawn && this.board[index]!.white == this.turnWhite) {
                    return true;
                }
            }
            return false;
        }

        // TODO MAKE SURE IT IS NOT CHECK IF EN PASSANT PLAYED!!

        let moves: PieceMove[] = [];

        let diagMove = this.prevMove.to - 8;
        if (this.turnWhite == false) {
            diagMove = this.prevMove.to + 8;
        }
        if (isTherePawn(x + 1, y))
            moves.push({ from: this.prevMove.to + 1, to: diagMove });
        if (isTherePawn(x - 1, y))
            moves.push({ from: this.prevMove.to - 1, to: diagMove });

        moves.forEach(move => {

            let pieceFrom = this.board[move.from];
            let pieceTo = this.board[move.to];
            let pieceRm = this.board[this.prevMove.to];

            this.board[move.to] = pieceFrom;
            this.board[move.from] = null;
            this.board[this.prevMove.to] = null;

            if (this.isCheck(this.turnWhite) == false) {
                this.possibleMoves.push(move);
            }

            this.board[move.to] = pieceTo;
            this.board[move.from] = pieceFrom;
            this.board[this.prevMove.to] = pieceRm;
        });
    }

    removeCastleOptions(move: PieceMove) {
        if (move.from == 0 || move.to == 0)
            this.castleOptions.blackLong = false;
        else if (move.from == 7 || move.to == 7)
            this.castleOptions.blackShort = false;
        else if (move.from == 56 || move.to == 56)
            this.castleOptions.whiteLong = false;
        else if (move.from == 63 || move.to == 63)
            this.castleOptions.whiteShort = false;
        
        if (move.from == 60 || move.to == 60) {
            this.castleOptions.whiteLong = false;
            this.castleOptions.whiteShort = false;
        }
        else if (move.from == 4 || move.to == 4) {
            this.castleOptions.blackLong = false;
            this.castleOptions.blackShort = false;
        }
    }

    checkIfMoveCastled(move: PieceMove) {

        for (let i = 0; i < this.currentAvailableCastles.length; i++) {
            if (move.from == this.currentAvailableCastles[i][0].from &&
                move.to == this.currentAvailableCastles[i][0].to) {

                let rookMove = this.currentAvailableCastles[i][1];

                io.to(this.whiteSocketId).emit("move-piece", rookMove);
                io.to(this.blackSocketId).emit("move-piece", rookMove);

                this.board[rookMove.to] = this.board[rookMove.from]
                this.board[rookMove.from] = null;
                
                console.log("castle happened!");

                return;
            }
        }

    }

    checkIfMoveEnPassant(move: PieceMove) {
        if ((this.board[move.to] instanceof Pawn) == false)
            return;
        if (Math.abs(move.to - move.from) == 7 ||
            Math.abs(move.to - move.from) == 9) {

            let rmIndex: number;
            if (this.board[move.to]!.white) {
                rmIndex = move.to + 8;
            } else {
                rmIndex = move.to - 8;
            }

            io.to(this.whiteSocketId).emit("en-passant", rmIndex);
            io.to(this.blackSocketId).emit("en-passant", rmIndex);

            this.board[rmIndex] = null;

            console.log("en passant happened!");
        }
    }

    checkPromotion(index: number) {
        if (index < 8 && this.board[index]!.white &&
            this.board[index]! instanceof Pawn) {
            
            this.board[index] = new Queen(true);
            console.log("queen promotion on", index);
        }

        else if (index >= 56 && this.board[index]!.white == false &&
            this.board[index]! instanceof Pawn) {
            
            this.board[index] = new Queen(false);
            console.log("queen promotion on", index);
        }
    }

    movePiece(move: PieceMove, socketid: string) {
        if (this.whiteSocketId === "" || this.blackSocketId === "")
            return;
        if (socketid == this.whiteSocketId && this.turnWhite == false)
            return;
        if (socketid == this.blackSocketId && this.turnWhite == true)
            return;

        if (this.possibleMoves.find(m => m.from == move.from && m.to == move.to) == undefined)
            return;

        this.prevMove.from = move.from;
        this.prevMove.to = move.to;
            
        io.to(this.whiteSocketId).emit("move-piece", move);
        io.to(this.blackSocketId).emit("move-piece", move);

        this.board[move.to] = this.board[move.from]
        this.board[move.from] = null;

        this.checkPromotion(move.to);

        this.removeCastleOptions(move);
        this.checkIfMoveCastled(move);

        this.checkIfMoveEnPassant(move);
        
        this.turnWhite = !this.turnWhite;
        this.getAllPossibleMoves();
    }

    async arePlayersConnected(): Promise<boolean> {

        let whiteSockets = await io.to(this.whiteSocketId).fetchSockets();
        let blackSockets = await io.to(this.blackSocketId).fetchSockets();

        if (whiteSockets.length > 0 || blackSockets.length > 0)
            return true;
        
        return false;
    }
}

let playingGames: Game[] = [];

app.use(express.static('../web/'));

app.get('/', (req: Request, res: Response) => {
    res.sendFile(path.resolve('../web/index.html'));
});

app.get('/igra/:id', (req: Request, res: Response) => {
    res.sendFile(path.resolve('../web/igra.html'));
});

io.on('connection', (socket: Socket) => {

    console.log(`connection from socket: ${socket.id}`);

    socket.emit('available-games', availableGames);

    socket.on('add-game', opponent => {
        let game = {
            id: uuid(),
            opponent: opponent
        };
        availableGames.push(game);
        io.emit('available-games', [game]);

        console.log(`add-game: ${JSON.stringify(game)}}`);
        socket.emit('move', `igra/${game.id}`);
    });

    socket.on('join-game', id => {
        console.log(`join-game: ${id}`);

        availableGames = availableGames.filter(game => game.id !== id);
        io.emit('remove-available-game', id);

        socket.emit('move', `igra/${id}`);
    });

    socket.on('start-playing', id => {
        let game = playingGames.find(game => game.id === id)!;
        if (game == null) {
            playingGames.push(new Game(id));
            game = playingGames[playingGames.length - 1];
        }

        if (game.whiteSocketId === "" && game.blackSocketId === "") {

            if (Math.random() > 0.5) {
                game.whiteSocketId = socket.id;
                socket.emit("playing-white");
            }
            else {
                game.blackSocketId = socket.id;
                socket.emit("playing-black");
            }
        }
        else if (game.whiteSocketId === "") {
            game.whiteSocketId = socket.id;
            socket.emit("playing-white");
        }
        else if (game.blackSocketId === "") {
            game.blackSocketId = socket.id;
            socket.emit("playing-black");
        }
        else {
            socket.emit("move", "/");
        }

        socket.emit("possible-moves", game.possibleMoves);

        console.log("game id:", game.id, "white:", game.whiteSocketId,
            "black", game.blackSocketId);
    });

    socket.on('move-piece', (id: string, move: PieceMove) => {
        console.log("move-piece: ", { id, move });
        let game = playingGames.find(game => game.id === id);
        if (game != null) {

            game.movePiece(move, socket.id);

        } else {
            console.log("game is null in move-piece for id " + id);
        }
    });

    socket.on('disconnect', async () => {
        console.log(`disconnected socket: ${socket.id}`);

        for (let i = 0; i < playingGames.length; i++) {
            let connected = await playingGames[i].arePlayersConnected();
            if (connected == false) {
                console.log("removed game with id", playingGames[i].id);
                playingGames.splice(i, 1);
                i--;
            }
        }

    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});