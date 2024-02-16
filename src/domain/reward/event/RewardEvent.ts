import RewardEventReward from "./RewardEventReward";

export default class RewardEvent {

    public static fromAnyWithIdNull(object: any) {
        if (!object.hasOwnProperty('start')) throw Error("Illegal argument name", object.start);
        if (!object.hasOwnProperty('end')) throw Error("Illegal argument shop_id", object.end);
        if (!object.hasOwnProperty('rewards')) throw Error("Illegal argument icon_ic", object.rewards);

        return new RewardEvent(
            null,
            object.start,
            object.end,
            this.buildRewardsMapFromAny(object.rewards),
            object.progressStatus
        )
    }

    private static buildRewardsMapFromAny(object: any): Map<number, RewardEventReward> {
        const reward = object as {[id: string]: {reward_id: number, amount: number}}
        const map = new Map<number, RewardEventReward>();
        for (const [key, value] of Object.entries(reward)) {
            const rewardEventReward = RewardEventReward.fromAny(value);
            map.set(rewardEventReward.reward_id, rewardEventReward);
        }

        return map;
    }

    public constructor(
        public readonly id: number,
        public readonly start: Date,
        public readonly end: Date,
        public readonly rewards: Map<number, RewardEventReward>,
        public readonly progressStatus: RewardEventProgress
    ) {
    }

    public toJson() {
        return {
            id: this.id,
            start: this.start,
            end: this.end,
            rewards: Object.fromEntries(this.rewards),
            progressStatus: this.progressStatus
        }
    }
}

export enum RewardEventProgress {
    INITIALIZED = 'initialized',
    RUNNING = 'running',
    DONE = 'done'
}