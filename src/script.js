"use strict";
var _a;
const atom_bond = new Map();
atom_bond.set("empty", 0);
atom_bond.set("H_atom", 1);
atom_bond.set("O_atom", 2);
atom_bond.set("N_atom", 3);
atom_bond.set("C_atom", 4);
const atom_names = Array.from(atom_bond.keys()).slice(1);
const atom_types = Array();
atom_types.push(...Array(8).fill(atom_names[0]));
atom_types.push(...Array(3).fill(atom_names[1]));
atom_types.push(...Array(2).fill(atom_names[2]));
atom_types.push(...Array(1).fill(atom_names[3]));
function next_atom_name() {
    return atom_types[Math.floor(Math.random() * atom_types.length)];
}
function update_current_atom() {
    current_atom = next_atom_name();
    current_atom_view.src = `./img/${current_atom}.png`;
}
function start_game(target_score, x_size, y_size) {
    game_content.style.display = "block";
    content.style.display = "none";
    game = new Game(canvas, target_score, x_size, y_size);
    update_current_atom();
    document.getElementById("reset-btn").onclick = () => game === null || game === void 0 ? void 0 : game.reset();
}
const game_content = document.getElementById("game-content");
const content = document.getElementById("content");
game_content.style.display = "none";
content.style.display = "block";
const current_atom_view = document.getElementById("current-atom");
const canvas = document.getElementById("game-canvas");
let game = undefined;
let current_atom = next_atom_name();
canvas.onclick = function (ev) {
    if (game === undefined)
        return;
    if (!game.try_update_cell(ev.offsetX, ev.offsetY, current_atom))
        return;
    game.update_game_field();
    game.draw();
    update_current_atom();
    game.check_is_finished();
};
document.getElementById("small-start-btn").onclick = () => start_game(100, 4, 3);
document.getElementById("medium-start-btn").onclick = () => start_game(300, 5, 4);
document.getElementById("huge-start-btn").onclick = () => start_game(700, 6, 5);
document.getElementById("home-btn").onclick = () => {
    game_content.style.display = "none";
    content.style.display = "block";
};
class Cell {
    constructor(x, y) {
        this.cell_type = "empty";
        this.free_bonds = 0;
        this.was_processed = false;
        this.x = x;
        this.y = y;
    }
    is_empty() {
        return this.cell_type === "empty";
    }
    set_type(new_type) {
        if (!this.is_empty() || !atom_bond.has(new_type))
            return false;
        this.cell_type = new_type;
        this.free_bonds = atom_bond.get(new_type);
        return true;
    }
    reset() {
        this.was_processed = false;
        this.free_bonds = 0;
        this.cell_type = "empty";
    }
}
class Molecule {
    constructor() {
        this.atoms = new Set();
    }
    addAtom(cell) {
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
        var _b;
        let score = 0;
        for (const atom of this.atoms)
            score += ((_b = atom_bond.get(atom.cell_type)) !== null && _b !== void 0 ? _b : -1);
        return score * this.atoms.size;
    }
}
class Game {
    constructor(canvas, target_score, x_size, y_size) {
        this.molecules = [];
        this.game_ended = false;
        this.game_score = 0;
        this.last_added_score = 0;
        this.target_score = target_score;
        this.x_size = x_size;
        this.y_size = y_size;
        this.game_field = Game.create_field(this.x_size, this.y_size);
        this.ctx = Game.create_canvas_context(canvas, this.x_size, this.y_size);
        this.ctx_height = this.ctx.canvas.height;
        this.ctx_width = this.ctx.canvas.width;
        this.draw();
        this.populate_field();
        this.draw();
    }
    static create_field(x_size, y_size) {
        const game_field = [];
        for (let y = 0; y < y_size; y++) {
            game_field.push([]);
            for (let x = 0; x < x_size; x++)
                game_field[y].push(new Cell(x, y));
        }
        return game_field;
    }
    static load_images() {
        const img_root = "./img/";
        const img_names = ["empty.png", "H_atom.png", "O_atom.png", "N_atom.png", "C_atom.png"];
        return new Map(img_names.map(img_name => {
            const image = new Image(Game.img_side_size, Game.img_side_size);
            image.src = img_root + img_name;
            return [img_name.split('.')[0], image];
        }));
    }
    static create_canvas_context(canvas, x_size, y_size) {
        canvas.width = Game.img_side_size * x_size + Game.bar_width;
        canvas.height = Game.img_side_size * y_size;
        const ctx = canvas.getContext("2d");
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
        this.ctx = Game.create_canvas_context(canvas, this.x_size, this.y_size);
        this.ctx_height = this.ctx.canvas.height;
        this.ctx_width = this.ctx.canvas.width;
        this.draw();
        this.populate_field();
        this.draw();
    }
    try_update_cell(x_pos, y_pos, cell_type) {
        if (this.game_ended)
            return false;
        const x_index = Math.trunc(x_pos / Game.img_side_size);
        const y_index = Math.trunc(y_pos / Game.img_side_size);
        if (y_index < this.game_field.length && x_index < this.game_field[0].length)
            return this.game_field[y_index][x_index].set_type(cell_type);
        return false;
    }
    draw() {
        var _b;
        const style = this.ctx.fillStyle;
        this.ctx.fillStyle = "rgb(52, 135, 148)";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        //field
        for (let y = 0; y < this.game_field.length; y++) {
            const row = this.game_field[y];
            const y_pos = y * Game.img_side_size;
            for (let x = 0; x < row.length; x++) {
                const x_pos = x * Game.img_side_size;
                const img = (_b = Game.imgs.get(row[x].cell_type)) !== null && _b !== void 0 ? _b : Game.imgs.get("empty");
                if (!row[x].is_empty())
                    this.ctx.drawImage(Game.imgs.get("empty"), x_pos, y_pos, Game.img_side_size, Game.img_side_size);
                this.ctx.drawImage(img, x_pos, y_pos, Game.img_side_size, Game.img_side_size);
                if (!row[x].is_empty() && row[x].free_bonds === 0) {
                    this.ctx.beginPath();
                    this.ctx.arc(x_pos + Game.img_side_size_half, y_pos + Game.img_side_size_half, Game.img_side_size_half - 3, 0, 2 * Math.PI);
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
        if (Game.debug)
            this.debug_draw();
    }
    update_game_field() {
        function process_cell_pair(active_cell, other_cell, molecules) {
            if (!other_cell || other_cell.free_bonds === 0 || active_cell.free_bonds === 0)
                return false;
            active_cell.free_bonds -= 1;
            other_cell.free_bonds -= 1;
            molecules.find(m => m.atoms.has(other_cell)).addAtom(active_cell);
            return true;
        }
        if (this.game_ended)
            return;
        let cell = this.get_cell_to_process();
        while (cell) {
            let neighbor_found = false;
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
            }
            else {
                const found = this.molecules.filter(m => m.atoms.has(cell));
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
        this.game_ended = (this.game_score >= this.target_score);
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
    is_over() {
        for (let y = 0; y < this.game_field.length; y++) {
            const row = this.game_field[y];
            for (let x = 0; x < row.length; x++) {
                if (row[x].is_empty())
                    return false;
            }
        }
        return true;
    }
    populate_field() {
        for (let y = 0; y < this.y_size; y++) {
            for (let x = 0; x < this.x_size; x++) {
                if (Math.random() < 0.75)
                    continue;
                const cell = this.game_field[y][x];
                cell.set_type(next_atom_name());
                this.update_game_field();
            }
        }
    }
    get_cell_to_process() {
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
    debug_draw() {
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
_a = Game;
Game.img_side_size = 128;
Game.img_side_size_half = _a.img_side_size / 2;
Game.bar_width = 64;
Game.bar_color = "rgb(0, 231, 131)";
Game.imgs = Game.load_images();
Game.debug = false;
