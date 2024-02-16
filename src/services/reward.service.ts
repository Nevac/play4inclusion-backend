import {PrismaClient} from "@prisma/client";
import Reward from "../domain/reward/Reward";
import {error} from "winston";

const prisma = new PrismaClient();

export async function findAllRewards() {
    const rewardObjects = await prisma.p4i_reward.findMany();
    return rewardObjects.map(objectToModel);
}

export async function findRewardById(id: number) {
    const rewardObject = await prisma.p4i_reward.findUnique({
        where: {
            id: id
        }
    });

    return objectToModel(rewardObject);
}

export async function findRewardsByIds(ids: number[]) {
    const rewardObjects = await prisma.p4i_reward.findMany({
        where: {
            OR: ids.map(id => {return {id: id}})
        }
    })

    return rewardObjects.map(objectToModel);
}

export async function createReward(reward: Reward) {
    const rewardObject = await prisma.p4i_reward.create({
        data: {
            name: reward.name,
            shop_id: reward.shop_id,
            icon_id: reward.icon_id
        }
    });

    return objectToModel(rewardObject);
}

export async function updateReward(id: number, reward: Reward) {
    const rewardObject = await prisma.p4i_reward.update({
        data: {
            name: reward.name,
            shop_id: reward.shop_id,
            icon_id: reward.icon_id
        },
        where: {
            id: id
        }
    });

    return objectToModel(rewardObject);
}

export async function removeReward(id: number) {

    if(await !isRewardUsedInRewardEvents(id)) {
        const rewardObject = await prisma.p4i_reward.delete({
            where: {
                id: id
            }
        });

        return objectToModel(rewardObject);
    } else {
        throw error("Can't delete reward that is used in reward event");
    }
}

async function isRewardUsedInRewardEvents(id: number) {
    const count = await prisma.p4i_reward_2_reward_event.count({
        where: {
            reward_id: id
        }
    })

    return count > 0;
}

function objectToModel(object: any): Reward {
    return new Reward(
        object.id,
        object.name,
        object.shop_id,
        object.icon_id
    );
}