export default class RewardEventReward {

    public static fromAny(object: any): RewardEventReward {
        if(!object.hasOwnProperty('reward_id')) throw Error("Illegal argument reward_id", object.reward_id);
        if(!object.hasOwnProperty('amount')) throw Error("Illegal argument amount", object.amount);

        return new RewardEventReward(
            object.amount,
            object.reward_id
        )
    }

    public constructor(
        public amount: number,
        public reward_id: number
    ) {
    }
}