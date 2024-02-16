export default class Reward {

    public static fromAnyWithIdNull(object: any) {
        if(!object.hasOwnProperty('name')) throw Error("Illegal argument name", object.name);
        if(!object.hasOwnProperty('shop_id')) throw Error("Illegal argument shop_id", object.shop_id);
        if(!object.hasOwnProperty('icon_id')) throw Error("Illegal argument icon_ic", object.icon_id);

        return new Reward(
            null,
            object.name,
            object.shop_id,
            object.icon_id
        )
    }

    public static fromAny(object: any) {
        if(!object.id) throw Error("Illegal argument id", object.id);
        const reward = Reward.fromAnyWithIdNull(object)
        return  new Reward(
            object.id,
            reward.name,
            reward.shop_id,
            reward.icon_id
        )
    }

    public constructor(
        public readonly id: number,
        public readonly name: string,
        public readonly shop_id: number,
        public readonly icon_id: string,
    ) {
    }
}