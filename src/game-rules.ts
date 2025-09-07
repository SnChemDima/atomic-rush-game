
export type CellType = "empty" | "H_atom" | "O_atom" | "N_atom" | "C_atom";
export const bonds_per_atom = new Map<CellType, number>();
bonds_per_atom.set("empty", 0);
bonds_per_atom.set("H_atom", 1);
bonds_per_atom.set("O_atom", 2);
bonds_per_atom.set("N_atom", 3);
bonds_per_atom.set("C_atom", 4);

export class CellSpawner{
    static atom_types: Array<CellType> = [
        ...Array<CellType>(8).fill('H_atom'),
        ...Array<CellType>(3).fill('O_atom'),
        ...Array<CellType>(2).fill('N_atom'),
        ...Array<CellType>(1).fill('C_atom')
    ];

    static next_atom_type() {
        return CellSpawner.atom_types[Math.floor(Math.random() * CellSpawner.atom_types.length)];
    }
}