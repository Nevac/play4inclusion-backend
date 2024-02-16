import GameEvent from "./GameEvent";
import {Socket} from "socket.io";
import {endGame, onReceiveActiveGameResponse, startGame} from "../services/game.service";

export default function gameEvents(socket: Socket) {
    socket.on(GameEvent.START, (msg) => {
        console.log('game_start: ' + msg);
        try {
            startGame(socket);
        } catch (error) {
            console.log(error);
        }
    });

    socket.on(GameEvent.END, (msg) => {
        console.log('game_end: ' + msg);
        try {
            endGame(socket);
        } catch (error) {
            console.log(error);
        }
    });

    socket.on(GameEvent.ALIVE_RESPONSE, (msg) => {
        console.log('game_alive_response: ' + msg);
        try {
            onReceiveActiveGameResponse(socket);
        } catch (error) {
            console.error(error);
        }
    });

    socket.conn.on("close", (msg) => {
        console.log('close: ' + msg);
        try {
            endGame(socket);
        } catch (error) {
            console.error(error);
        }

    });
}

