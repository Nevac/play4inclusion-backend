import {ActivaGameData, sendActiveGameRequest, activeGames, endGame} from "../services/game.service";
import {io} from "../app";
import {Socket} from "socket.io";

export default class ActiveGameCheckWorker {

    public constructor(
        private intervalDuration: number,
        private timeoutDuration: number) {
    }

    public static startInterval(intervalDuration: number, timeoutDuration: number) {
        const worker = new ActiveGameCheckWorker(intervalDuration, timeoutDuration);
        setInterval(worker.checkActiveGames.bind(worker), intervalDuration);
    }

    public async checkActiveGames() {
        const socketsToRemove: Socket[] = [];
        for(const entry of activeGames.entries()) {
            const [userId, activeGameData] = entry;
            const socket = io.sockets.sockets.get(activeGameData.socketId);
            if (this.isTimeout(activeGameData.lastResponseTime)) {
                socketsToRemove.push(socket);
            }
        }
        this.removeSockets(socketsToRemove);
        sendActiveGameRequest();
    }

    private removeSockets(sockets: Socket[]) {
        for(const socket of sockets) {
            endGame(socket);
        }
    }

    private isTimeout(lastResponseTime: number) {
        const currentTime = new Date().getTime();
        return currentTime - lastResponseTime > this.timeoutDuration;
    }
}