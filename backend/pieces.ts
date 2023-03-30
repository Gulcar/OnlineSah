import { PieceMove } from ".";

export class Piece
{
    white: boolean;

    constructor(white: boolean) {
        this.white = white;
    }

    GetPossibleMoves(board: Piece[], index: number): PieceMove[] {
        console.log("GetPossibleMoves called on the parent class Piece!");
        return [];
    }
}

export class Pawn extends Piece
{
    Check(board: Piece[], moves: PieceMove[], x: number, y: number, from: number) {
        if (x < 0 || x >= 8)
            return;
        if (y < 0 || y >= 8)
            return;

        let index = x + y * 8;
        if (board[index] != null && board[index].white != this.white) {
            moves.push({ from: from, to: index });
        }
    }

    GetPossibleMoves(board: Piece[], index: number): PieceMove[] {
        
        let moves: PieceMove[] = [];

        let x = index % 8;
        let y = Math.floor(index / 8);

        if (this.white) {
            if (board[index - 8] == null) {
                moves.push({ from: index, to: index - 8 });
                if (index >= 48 && index <= 55 && 
                    board[index - 16] == null) {
                    moves.push({ from: index, to: index - 16});
                }
            }
            this.Check(board, moves, x - 1, y - 1, index);
            this.Check(board, moves, x + 1, y - 1, index)
        }
        else {
            if (board[index + 8] == null) {
                moves.push({ from: index, to: index + 8 });
                if (index >= 8 && index <= 15 && 
                    board[index + 16] == null) {
                    moves.push({ from: index, to: index + 16});
                }
            }
            this.Check(board, moves, x - 1, y + 1, index);
            this.Check(board, moves, x + 1, y + 1, index);
        }
        return moves;
    }
}

export class Rook extends Piece
{
    GetPossibleMoves(board: Piece[], index: number): PieceMove[] {

        let moves: PieceMove[] = [];

        // desno
        for (let i = index + 1; i < index - (index % 8) + 8; i++) {
            if (board[i] == null) {
                moves.push({ from: index, to: i});
            } else {
                if (board[i].white != this.white) {
                    moves.push({ from: index, to: i });
                }
                break;
            }
        }
        // levo
        for (let i = index - 1; i >= index - (index % 8); i--) {
            if (board[i] == null) {
                moves.push({ from: index, to: i});
            } else {
                if (board[i].white != this.white) {
                    moves.push({ from: index, to: i });
                }
                break;
            }
        }
        // gor
        for (let i = index - 8; i >= 0; i -= 8) {
            if (board[i] == null) {
                moves.push({ from: index, to: i});
            } else {
                if (board[i].white != this.white) {
                    moves.push({ from: index, to: i });
                }
                break;
            }
        }
        // dol
        for (let i = index + 8; i < 64; i += 8) {
            if (board[i] == null) {
                moves.push({ from: index, to: i});
            } else {
                if (board[i].white != this.white) {
                    moves.push({ from: index, to: i });
                }
                break;
            }
        }
        return moves;
    }
}

export class Knight extends Piece
{
    Check(board: Piece[], moves: PieceMove[], x: number, y: number, startIndex: number) {
        if (x < 0 || x >= 8)
            return;
        if (y < 0 || y >= 8)
            return;

        let index = x + y * 8;
        if (board[index] == null || board[index].white != this.white) {
            moves.push({ from: startIndex, to: index });
        }
    }

    GetPossibleMoves(board: Piece[], index: number): PieceMove[] {
        let moves: PieceMove[] = [];
        
        let x = index % 8;
        let y = Math.floor(index / 8);

        this.Check(board, moves, x - 2, y - 1, index);
        this.Check(board, moves, x - 2, y + 1, index);
        this.Check(board, moves, x + 2, y - 1, index);
        this.Check(board, moves, x + 2, y + 1, index);

        this.Check(board, moves, x - 1, y - 2, index);
        this.Check(board, moves, x - 1, y + 2, index);
        this.Check(board, moves, x + 1, y - 2, index);
        this.Check(board, moves, x + 1, y + 2, index);

        return moves;
    }
}

export class Bishop extends Piece
{
    Check(board: Piece[], moves: PieceMove[], x: number, y: number, from: number): boolean {
        if (x < 0 || x >= 8)
            return false;
        if (y < 0 || y >= 8)
            return false;
        
        let index = x + y * 8;
        if (board[index] == null) {
            moves.push({ from: from, to: index });
            return true;
        }
        if (board[index].white != this.white) {
            moves.push({ from: from, to: index });
        }
        return false;
    }

    GetPossibleMoves(board: Piece[], index: number): PieceMove[] {
        let moves: PieceMove[] = [];

        let x = index % 8;
        let y = Math.floor(index / 8);

        for (let i = 1; i < 8; i++) {
            if (this.Check(board, moves, x + i, y + i, index) == false)
                break;
        }
        for (let i = 1; i < 8; i++) {
            if (this.Check(board, moves, x - i, y + i, index) == false)
                break;
        }
        for (let i = 1; i < 8; i++) {
            if (this.Check(board, moves, x + i, y - i, index) == false)
                break;
        }
        for (let i = 1; i < 8; i++) {
            if (this.Check(board, moves, x - i, y - i, index) == false)
                break;
        }
        return moves;
    }
}

export class Queen extends Piece
{
    GetPossibleMoves(board: Piece[], index: number): PieceMove[] {
        let bishop = new Bishop(this.white);
        let rook = new Rook(this.white);

        let moves: PieceMove[] = [];
        moves.push(...bishop.GetPossibleMoves(board, index));
        moves.push(...rook.GetPossibleMoves(board, index));

        return moves;
    }
}

export class King extends Piece
{
    Check(board: Piece[], moves: PieceMove[], x: number, y: number, from: number) {
        if (x < 0 || x >= 8)
            return;
        if (y < 0 || y >= 8)
            return;

        let index = x + y * 8;
        if (board[index] == null || board[index].white != this.white) {
            moves.push({ from: from, to: index });
        }
    }

    GetPossibleMoves(board: Piece[], index: number): PieceMove[] {
        let moves: PieceMove[] = [];

        let x = index % 8;
        let y = Math.floor(index / 8);

        this.Check(board, moves, x - 1, y + 1, index);
        this.Check(board, moves, x    , y + 1, index);
        this.Check(board, moves, x + 1, y + 1, index);
        this.Check(board, moves, x - 1, y    , index);
        this.Check(board, moves, x    , y    , index);
        this.Check(board, moves, x + 1, y    , index);
        this.Check(board, moves, x - 1, y - 1, index);
        this.Check(board, moves, x    , y - 1, index);
        this.Check(board, moves, x + 1, y - 1, index);

        return moves;
    }
}