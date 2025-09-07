import { Cell } from "./cell";
import { type CellType, CellSpawner } from "./game-rules";
import { Molecule } from "./molecule";

export class Game {
    static img_side_size: number = 128;
    static img_side_size_half: number = this.img_side_size / 2;
    static bar_width: number = 64;
    static bar_color: string = "rgb(0, 231, 131)";
    static imgs: Map<string, HTMLImageElement> = Game.load_images();
    static debug: boolean = false;

    molecules: Array<Molecule> = [];
    game_ended: boolean = false;
    game_score: number = 0;
    last_added_score: number = 0;
    target_score: number;
    game_field: Cell[][];
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    ctx_height: number;
    ctx_width: number;
    x_size: number;
    y_size: number;
    current_atom: CellType = 'empty';
    current_atom_view: HTMLImageElement;

    constructor(
        canvas: HTMLCanvasElement,
        target_score: number,
        x_size: number,
        y_size: number,
        current_atom_view: HTMLImageElement
    ) {
        this.target_score = target_score;
        this.x_size = x_size;
        this.y_size = y_size;
        this.game_field = Game.create_field(this.x_size, this.y_size);
        this.canvas = canvas;
        this.ctx = Game.create_canvas_context(this.canvas, this.x_size, this.y_size);
        this.ctx_height = this.ctx.canvas.height;
        this.ctx_width = this.ctx.canvas.width;
        this.current_atom_view = current_atom_view;
        this.populate_field();
        this.update_current_atom();
    }

    private static create_field(x_size: number, y_size: number) {
        const game_field: Cell[][] = [];
        for (let y = 0; y < y_size; y++){
            game_field.push([]);
            for (let x = 0; x < x_size; x++)
                game_field[y].push(new Cell(x, y));
        }
        return game_field;
    }

    private static load_images() {
        const img_root = "./img/";
        const img_names = ["empty.png", "H_atom.png", "O_atom.png", "N_atom.png", "C_atom.png"];
        return new Map(img_names.map(img_name => {
            const image = new Image(Game.img_side_size, Game.img_side_size);
            image.src = img_root + img_name;
            return [img_name.split('.')[0], image];
        }));
    }

    private static create_canvas_context(canvas: HTMLCanvasElement, x_size: number, y_size: number) {
        canvas.width = Game.img_side_size * x_size + Game.bar_width;
        canvas.height = Game.img_side_size * y_size;

        const ctx = canvas.getContext("2d")!;
        const style = ctx.fillStyle;
        ctx.fillStyle = "rgb(52, 135, 148)";
        ctx.font = "24px serif";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = style;
        return ctx;
    }

    reset() {
        this.game_field = Game.create_field(this.x_size, this.y_size);
        this.molecules = [];
        this.game_ended = false;
        this.game_score = 0;
        this.last_added_score = 0;
        this.ctx = Game.create_canvas_context(this.canvas, this.x_size, this.y_size);
        this.ctx_height = this.ctx.canvas.height;
        this.ctx_width = this.ctx.canvas.width;
        this.draw();
        this.populate_field();
        this.draw();
    }

    try_update_cell(x_pos: number, y_pos: number) {
        if (this.game_ended)
            return false;
        const x_index = Math.trunc(x_pos / Game.img_side_size);
        const y_index = Math.trunc(y_pos / Game.img_side_size);
        if (y_index < this.game_field.length && x_index < this.game_field[0].length)
            return this.game_field[y_index][x_index].set_type(this.current_atom);
        return false;
    }

    draw() {
        const style = this.ctx.fillStyle;
        this.ctx.fillStyle = "rgb(52, 135, 148)";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        //field
        for (let y = 0; y < this.game_field.length; y++) {
            const row = this.game_field[y];
            const y_pos = y * Game.img_side_size;
            for (let x = 0; x < row.length; x++) {
                const x_pos = x * Game.img_side_size;
                const img = Game.imgs.get(row[x].cell_type) ?? Game.imgs.get("empty")!;
                if (!row[x].is_empty())
                    this.ctx.drawImage(Game.imgs.get("empty")!, x_pos, y_pos, Game.img_side_size, Game.img_side_size);
                this.ctx.drawImage(img, x_pos, y_pos, Game.img_side_size, Game.img_side_size);
                if (!row[x].is_empty() && row[x].free_bonds === 0) {
                    this.ctx.beginPath();
                    this.ctx.arc(x_pos + Game.img_side_size_half,
                        y_pos + Game.img_side_size_half,
                        Game.img_side_size_half - 3,
                        0, 2 * Math.PI
                    );
                    this.ctx.fillStyle = "rgba(115, 252, 135, 0.47)";
                    this.ctx.strokeStyle = "rgba(115, 252, 135, 0.47)";
                    this.ctx.fill();
                    this.ctx.stroke();
                    this.ctx.fillStyle = style;
                }
            }
        }
        //bar
        const bar_height = this.game_score * this.ctx_height / this.target_score;
        this.ctx.fillStyle = Game.bar_color;
        this.ctx.fillRect(this.ctx_width - Game.bar_width, this.ctx_height - bar_height, Game.bar_width, bar_height);
        //show score
        this.ctx.fillStyle = "rgb(0, 191, 255)";
        this.ctx.fillRect(this.ctx_width - Game.bar_width + 7, this.ctx_height - 30, Game.bar_width - 15, 25);
        this.ctx.fillStyle = style;
        this.ctx.fillText(Math.min(this.game_score, this.target_score).toString(), this.ctx_width - Game.bar_width + 10, this.ctx_height - 10);
        if (this.last_added_score > 0)
            this.ctx.fillText("+" + this.last_added_score.toString(), this.ctx_width - Game.bar_width + 10, this.ctx_height - bar_height - 10);
        if (Game.debug) this.debug_draw();
    }

    update_game_field() {
        function process_cell_pair(active_cell: Cell, other_cell: Cell, molecules: Array<Molecule>) {
            if (!other_cell || other_cell.free_bonds === 0 || active_cell.free_bonds === 0)
                return false;
            active_cell.free_bonds -= 1;
            other_cell.free_bonds -= 1;
            molecules.find(m => m.atoms.has(other_cell))!.addAtom(active_cell);
            return true;
        }
        if (this.game_ended)
            return;
        let cell = this.get_cell_to_process();
        while (cell) {
            let neighbor_found: boolean = false;
            neighbor_found = (process_cell_pair(cell, this.game_field[cell.y][cell.x - 1], this.molecules) || neighbor_found);
            neighbor_found = (process_cell_pair(cell, this.game_field[cell.y][cell.x + 1], this.molecules) || neighbor_found);
            let row = this.game_field[cell.y - 1];
            if (row)
                neighbor_found = (process_cell_pair(cell, row[cell.x], this.molecules) || neighbor_found);
            row = this.game_field[cell.y + 1];
            if (row)
                neighbor_found = (process_cell_pair(cell, row[cell.x], this.molecules) || neighbor_found);
            cell.was_processed = true;
            if (!neighbor_found) {
                const molecule = new Molecule();
                this.molecules.push(molecule);
                molecule.addAtom(cell);
                break;
            } else {
                const found = this.molecules.filter(m => m.atoms.has(cell!));
                const first_mol = found[0];
                for (let i = 1; i < found.length; i++) {
                    const molecule = found[i];
                    molecule.atoms.forEach(a => first_mol.addAtom(a));
                    this.molecules.splice(this.molecules.indexOf(molecule), 1);
                }
            }
            cell = this.get_cell_to_process();
        }
        let added_score = 0;
        for (let i = this.molecules.length - 1; i >= 0; i--) {
            if (!this.molecules[i].can_be_deleted())
                continue;
            const molecule = this.molecules.splice(i, 1)[0];
            added_score += molecule.calculate_score();
            molecule.atoms.forEach(c => c.reset());
        }
        this.game_score += added_score;
        if (added_score > 0)
            this.last_added_score = added_score;
        this.game_ended = (this.game_score >= this.target_score)
    }

    update_current_atom() {
        this.current_atom = CellSpawner.next_atom_type();
        this.current_atom_view.src = `./img/${this.current_atom}.png`;
    }

    check_is_finished() {
        if (!this.game_ended && !this.is_over())
            return;
        const style = this.ctx.fillStyle;
        const font = this.ctx.font;
        this.ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        this.ctx.fillRect(0, 0, this.ctx_width, this.ctx_height);
        this.ctx.font = "bold 50px Courier";
        this.ctx.fillStyle = this.game_ended ? "rgb(0, 142, 85)" : "rgb(150, 0, 8)";
        this.ctx.fillText(this.game_ended ? "Victory!" : "Defeat!", (this.ctx_width - Game.bar_width) / 2 - 60, this.ctx_height / 2);
        this.game_ended = true;
        this.ctx.font = font;
        this.ctx.fillStyle = style;
    }

    private is_over() {
        for (let y = 0; y < this.game_field.length; y++) {
            const row = this.game_field[y];
            for (let x = 0; x < row.length; x++) {
                if (row[x].is_empty())
                    return false;
            }
        }
        return true;
    }

    private populate_field() {
        for (let y = 0; y < this.y_size; y++){
            for (let x = 0; x < this.x_size; x++){
                if (Math.random() < 0.75)
                    continue;
                const cell = this.game_field[y][x];
                cell.set_type(CellSpawner.next_atom_type());
                this.update_game_field();
            }
        }
    }

    private get_cell_to_process() {
        for (let y = 0; y < this.game_field.length; y++) {
            const row = this.game_field[y];
            for (let x = 0; x < row.length; x++) {
                const current = row[x];
                if (current.is_empty() || current.was_processed)
                    continue;
                return current;
            }
        }
    }

    private debug_draw() {
        const font = this.ctx.font;
        this.ctx.font = "9px Arial";
        for (let y = 0; y < this.game_field.length; y++) {
            const row = this.game_field[y];
            const y_pos = y * Game.img_side_size;
            for (let x = 0; x < row.length; x++) {
                const x_pos = x * Game.img_side_size;
                const style = this.ctx.fillStyle;
                this.ctx.fillStyle = "rgba(255, 255, 255, 0.47)";
                this.ctx.fillRect(x_pos + 8, y_pos + 3, 52, 48);
                this.ctx.fillStyle = style;
                this.ctx.fillText("bond: " + row[x].free_bonds.toString(), x_pos + 10, y_pos + 15);
                this.ctx.fillText("proc: " + row[x].was_processed.toString(), x_pos + 10, y_pos + 25);
                this.ctx.fillText("pos_x: " + row[x].x.toString() + "; " + x.toString(), x_pos + 10, y_pos + 35);
                this.ctx.fillText("pos_y: " + row[x].y.toString() + "; " + y.toString(), x_pos + 10, y_pos + 45);
                this.molecules.forEach(m => {
                    this.ctx.beginPath();
                    this.ctx.lineWidth = 5;
                    m.atoms.forEach(c => {
                        this.ctx.lineTo(c.x * Game.img_side_size + Game.img_side_size_half, c.y * Game.img_side_size + Game.img_side_size_half);
                    });
                    this.ctx.stroke();
                });
            }
        }
        this.ctx.font = font;
    }
}