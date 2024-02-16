import {ActivaGameData, activeGames, getUserIdBySocketId} from "../services/game.service";
import {io} from "../app";
import {Socket} from "socket.io";
import {finishRewardEvent} from "../services/rewardEvent.service";
import RewardEvent, {RewardEventProgress} from "../domain/reward/event/RewardEvent";
import Reward from "../domain/reward/Reward";
import {findRewardsByIds} from "../services/reward.service";
import GameEvent from "../websockets/GameEvent";
import {createCateringOrder} from "../services/catering.service";

export default class RewardEventWorker {

    //User Id
    private winners = new Set<string>()
    //Socket Id
    private challengers = new Set<string>();
    private intervalTime: number;
    private intervalId: NodeJS.Timeout;
    private timeoutId: NodeJS.Timeout;
    private progressStatus: RewardEventProgress = RewardEventProgress.INITIALIZED;

    private constructor(
        private rewardEvent: RewardEvent,
        private rewardCountMap: Map<number, number> = new Map(),
        private rewardIdRewardMap: Map<number, Reward> = new Map()
    ) {
        this.progressStatus = RewardEventProgress.RUNNING;
        this.intervalTime = this.calculateInterval();
        this.intervalId = setInterval(this.challengeRandomSession.bind(this), this.intervalTime);
        console.log(rewardEvent.end.getTime() - rewardEvent.start.getTime());
        this.timeoutId = setTimeout(this.endEvent.bind(this), rewardEvent.end.getTime() - rewardEvent.start.getTime());
    }

    public static async start(rewardEvent: RewardEvent) {
        const worker = new RewardEventWorker(
            rewardEvent,
            this.buildRewardCountMap(rewardEvent),
            await this.buildRewardIdRewardMap(rewardEvent)
        );
    }

    private endEvent() {
        this.progressStatus = RewardEventProgress.DONE;
        clearInterval(this.intervalId);
        finishRewardEvent(this.rewardEvent.id);
    }

    private async challengeRandomSession() {
        try {
            clearInterval(this.intervalId);
            let eligibleGames = new Map(activeGames);
            eligibleGames = this.removeWinnersFromEligibleGames(eligibleGames);
            eligibleGames = this.removeChallengersFromEligibleGames(eligibleGames);
            if(eligibleGames.size > 0 && this.calculateTotalPriceAmount() > 0) {
                console.log('Eligible: ', eligibleGames);
                const socketId = this.pickRandomSession(eligibleGames);
                this.startChallenge(socketId);
            }
            if(this.progressStatus != RewardEventProgress.DONE) {
                this.intervalTime = this.calculateInterval();
                this.intervalId = setInterval(this.challengeRandomSession.bind(this), this.intervalTime)
            }
        } catch (error) {
            console.error(error);
        }
    }

    private diagnose() {
        console.log('active games: \n', activeGames);
        console.log('winners: \n', this.winners);
        console.log('challengers: \n', this.challengers);
        console.log('rewards: \n', this.rewardCountMap)
    }

    private startChallenge(socketId: string) {
        console.log('Start challenge socketId: ', socketId);
        const socket = io.sockets.sockets.get(socketId);
        if(socket) {
            const reward = this.pickRandomReward();
            const timeoutId = setTimeout(() => this.timeoutCheck(socket, reward), parseInt(process.env.REWARD_TIMEOUT_SECONDS))
            socket.on(GameEvent.REWARD_WON, () => this.onSessionWin(socket, timeoutId, reward));
            socket.on(GameEvent.REWARD_LOST, () => this.onSessionLost(socket, timeoutId, reward));
            socket.emit(GameEvent.REWARD_ELIGIBLE, {id: reward.id, name: reward.name, iconId: reward.icon_id, duration: parseInt(process.env.REWARD_DURATION_INGAME)});
        }
    }

    private timeoutCheck(socket: Socket, reward: Reward) {
        const socketId = socket.id;
        this.resetChallengeAndPrice(socket, this.timeoutId, reward);
    }

    private async onSessionWin(
        socket: Socket,
        timeoutId: NodeJS.Timeout,
        reward: Reward
    ) {
        try {
            clearTimeout(timeoutId);
            console.log(`SocketId ${socket.id} has won a reward`);
            const userId = getUserIdBySocketId(socket.id);
            this.resetChallenge(socket, timeoutId, reward);
            this.winners.add(userId);
            await createCateringOrder(parseInt(userId), reward);
            if(this.calculateTotalPriceAmount() <= 0) {
                clearTimeout(timeoutId);
                console.log('no price');
                this.endEvent();
            }
        } catch (error) {
            console.log(error)
        }
    }

    private onSessionLost(
        socket: Socket,
        timeoutId: NodeJS.Timeout,
        reward: Reward
    ) {
        try {
            clearTimeout(timeoutId);
            console.log(`SocketId ${socket.id} has lost a reward`);
            this.resetChallengeAndPrice(socket, timeoutId, reward);
        } catch (error) {
            console.log(error);
        }
    }

    private pickRandomReward() {
        const rewardIds = Array.from(this.rewardIdRewardMap.keys());
        const rewardId = rewardIds[Math.floor(Math.random() * rewardIds.length)];
        const reward = this.rewardIdRewardMap.get(rewardId);
        this.rewardCountMap.set(rewardId, this.rewardCountMap.get(rewardId) - 1);
        return reward;
    }

    private resetChallengeAndPrice(
        socket: Socket,
        timeoutId: NodeJS.Timeout,
        reward: Reward
    ) {
        this.rewardCountMap.set(reward.id, this.rewardCountMap.get(reward.id) + 1);
        this.resetChallenge(socket, timeoutId, reward);
    }

    private resetChallenge(
        socket: Socket,
        timeoutId: NodeJS.Timeout,
        reward
    ) {
        console.log(`SocketId ${socket.id} has timed out`);
        this.challengers.delete(socket.id);
        socket.off(GameEvent.REWARD_WON, () => this.onSessionWin(socket, timeoutId, reward));
        socket.off(GameEvent.REWARD_LOST, () => this.onSessionLost(socket, timeoutId, reward));
    }

    private pickRandomSession(eligibleGames: Map<string, ActivaGameData>) {
        const activaGameDatas = Array.from(eligibleGames.values());
        const randomActiveGameData = activaGameDatas[Math.floor(Math.random() * activaGameDatas.length)];
        return randomActiveGameData.socketId;
    }

    private removeWinnersFromEligibleGames(eligibleGames: Map<string, ActivaGameData>) {
        for(const winner of this.winners) {
            if(eligibleGames.has(winner)) {
                eligibleGames.delete(winner)
            }
        }
        return eligibleGames;
    }

    private removeChallengersFromEligibleGames(eligibleGames: Map<string, ActivaGameData>) {
        for(const challenger of this.challengers) {
            const userId = getUserIdBySocketId(challenger);
            if(eligibleGames.has(userId)) {
                eligibleGames.delete(userId);
            }
        }
        return eligibleGames;
    }

    private calculateInterval() {
        const totalTimeLeft = this.rewardEvent.end.getTime() - new Date().getTime();
        let interval = totalTimeLeft / this.calculateTotalPriceAmount();
        if(interval < 20 * 1000) {
            interval = 20 * 1000;
        }
        return interval;
    }

    private calculateTotalPriceAmount() {
        let sum = 0;
        Array.from(this.rewardCountMap.values()).map(amount => sum += amount);
        return sum;
    }

    private static buildRewardCountMap(rewardEvent: RewardEvent) {
        const rewardsMap = rewardEvent.rewards;
        const map = new Map<number, number>();

        for(const rewardEventReward of rewardsMap.values()) {
            map.set(rewardEventReward.reward_id, rewardEventReward.amount);
        }
        return map;
    }

    private static async buildRewardIdRewardMap(rewardEvent: RewardEvent) {
        const rewardsMap = rewardEvent.rewards;
        const map = new Map<number, Reward>();
        const rewards = await findRewardsByIds(Array.from(rewardsMap.keys()))
        for(const reward of rewards) {
            map.set(reward.id, reward);
        }
        return map;
    }
}