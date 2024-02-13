import GameEvent from "./GameEvent";
import {Socket} from "socket.io";
import {endGame, onReceiveActiveGameResponse, startGame} from "../services/game.service";

export default function gameEvents(socket: Socket) {
    socket.on(GameEvent.START, (msg) => {
        console.log('game_start: ' + msg);
        startGame(socket);
    });

    socket.on(GameEvent.END, (msg) => {
        console.log('game_end: ' + msg);
        endGame(socket);
    });

    socket.on(GameEvent.ALIVE_RESPONSE, (msg) => {
        console.log('game_alive_response: ' + msg);
        onReceiveActiveGameResponse(socket);
    });

    socket.on(GameEvent.REWARD_WON, (msg) => {
        console.log('game_end: ' + msg);
    });

    socket.on(GameEvent.REWARD_LOST, (msg) => {
        console.log('game_reward_win: ' + msg);
    });

    socket.conn.on("close", (msg) => {
        console.log('close: ' + msg);
        endGame(socket);
    });
}

