import type { Cell } from "./cell";
import { bonds_per_atom } from "./game-rules";

export class Molecule {
    atoms: Set<Cell> = new Set();

    addAtom(cell: Cell) {
        if (this.atoms.has(cell))
            return;
        this.atoms.add(cell);
    }

    can_be_deleted() {
        let result = true;
        for (const atom of this.atoms) {
            result = (result && (atom.free_bonds === 0));
        }
        return result;
    }

    calculate_score() {
        let score = 0;
        for (const atom of this.atoms)
            score += (bonds_per_atom.get(atom.cell_type) ?? -1);
        return score * this.atoms.size;
    }
}