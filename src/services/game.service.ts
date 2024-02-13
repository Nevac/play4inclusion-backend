import exp from "node:constants";
import {RemoteSocket, Socket} from "socket.io";
import {io} from "../app";
import {DefaultEventsMap} from "socket.io/dist/typed-events";
import GameEvent from "../websockets/GameEvent";

export interface ActivaGameData {
    lastResponseTime: number,
    socketId: string
}
export const activeGames = new Map<string, ActivaGameData>();
export const eligibleGames = new Set<string>();
const activeGamesRoom: string = 'active_games';

export function startGame(socket: Socket) {
    socket.join(activeGamesRoom);
    activeGames.set(extractUserId(socket), {lastResponseTime: new Date().getTime(), socketId: socket.id});
    console.log('Start Game: \n', activeGames)
}

export function endGame(socket: Socket) {
    socket.leave(activeGamesRoom)
    activeGames.delete(extractUserId(socket))
}

export function sendActiveGameRequest() {
    io.to(activeGamesRoom).emit(GameEvent.ALIVE_REQUEST);
}

export function onReceiveActiveGameResponse(socket: Socket) {
    activeGames.get(extractUserId(socket)).lastResponseTime = new Date().getTime();
}

export function pickEligibleGame() {

}

function extractUserId(socket: Socket): string {
    const request = socket.request;
    if(request['user'] && request['user']['id']) {
        return request['user']['id'];
    } else {
        throw Error('User is null');
    }
}