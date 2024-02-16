import {ActivaGameData, sendActiveGameRequest, activeGames, endGame} from "../services/game.service";
import {io} from "../app";
import {Socket} from "socket.io";
import {findRewardEventsReadyToStart, startRewardEvents} from "../services/rewardEvent.service";
import RewardEventWorker from "./RewardEventWorker";

export default class RewardEventReadyCheckWorker {

    public constructor(
        private intervalDuration: number) {
    }

    public static startInterval(intervalDuration: number) {
        const worker = new RewardEventReadyCheckWorker(intervalDuration);
        setInterval(worker.checkRewardEvents.bind(worker), intervalDuration);
    }

    public async checkRewardEvents() {
        const rewardEvents = await findRewardEventsReadyToStart();
        await startRewardEvents(rewardEvents.map(rewardEvent => rewardEvent.id))
        rewardEvents.forEach(rewardEvent => RewardEventWorker.start(rewardEvent));
    }
}