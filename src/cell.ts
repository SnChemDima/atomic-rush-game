import { bonds_per_atom, type CellType } from "./game-rules";

export class Cell {
    x: number;
    y: number;
    cell_type: CellType = "empty";
    free_bonds: number = 0;
    was_processed: boolean = false;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    is_empty() {
        return this.cell_type === "empty";
    }

    set_type(new_type: CellType) {
        if (!this.is_empty() || !bonds_per_atom.has(new_type))
            return false;
        this.cell_type = new_type;
        this.free_bonds = bonds_per_atom.get(new_type)!;
        return true;
    }

    reset() {
        this.was_processed = false;
        this.free_bonds = 0;
        this.cell_type = "empty";
    }
}