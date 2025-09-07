import { Game } from "./game";

const canvas = (document.getElementById("game-canvas") as HTMLCanvasElement)!;

function start_game(target_score: number, x_size: number, y_size: number) {
    game_content.style.display = "block";
    content.style.display = "none";
    const current_atom_view = (document.getElementById("current-atom") as HTMLImageElement)!;
    const game = new Game(canvas, target_score, x_size, y_size, current_atom_view);
    document.getElementById("reset-btn")!.onclick = () => game?.reset();
    canvas.onclick = function (ev: MouseEvent) {
        if (!game.try_update_cell(ev.offsetX, ev.offsetY))
            return;
        game.update_game_field();
        game.update_current_atom();
        game.check_is_finished();
    };
    setInterval(() => game.draw(), 100);
}

const game_content = document.getElementById("game-content")!;
const content = document.getElementById("content")!;
game_content.style.display = "none";
content.style.display = "block";

document.getElementById("small-start-btn")!.onclick = () => start_game(100, 4, 3);
document.getElementById("medium-start-btn")!.onclick = () => start_game(300, 5, 4);
document.getElementById("huge-start-btn")!.onclick = () => start_game(700, 6, 5);
document.getElementById("home-btn")!.onclick = () => {
    game_content.style.display = "none";
    content.style.display = "block";
};
