import {PrismaClient} from "@prisma/client";
import RewardEvent, {RewardEventProgress} from "../domain/reward/event/RewardEvent";
import RewardEventReward from "../domain/reward/event/RewardEventReward";
import {error} from "winston";
import rewardEvent from "../routes/rewardEvent";

const prisma = new PrismaClient();

export async function findAllRewardEvents() {
    const rewardEventObjects = await prisma.p4i_reward_event.findMany();

    return rewardEventObjects.map(objectToModelEmptyRewards);
}

export async function findRewardEventById(id: number) {
    const rewardEventObject = await prisma.p4i_reward_event.findUnique({
        where: {
            id: id
        }
    });

    let rewardEvent = objectToModelEmptyRewards(rewardEventObject);
    const rewardEvenRewards = await findRewardEventRewardsByRewardEventId(id);

    rewardEvent = setRewardsToRewardEvent(rewardEvent, rewardEvenRewards)
    console.log(rewardEvent);
    return rewardEvent;
}

export async function findRewardEventsReadyToStart() {
    const rewardEventObjects = await prisma.p4i_reward_event.findMany({
        where: {
            start: {
                lte: new Date()
            },
            progressStatus: RewardEventProgress.INITIALIZED
        }
    })

    let rewardEvents = rewardEventObjects.map(objectToModelEmptyRewards);
    const rewardEventsWithPopulatedRewards: RewardEvent[] = []

    for(const rewardEvent of rewardEvents) {
        const rewardEvenRewards = await findRewardEventRewardsByRewardEventId(rewardEvent.id);
        rewardEventsWithPopulatedRewards.push(setRewardsToRewardEvent(rewardEvent, rewardEvenRewards))
    }

    return rewardEventsWithPopulatedRewards;
}

//Call this function during startup
export async function cleanupFailedRewardEvents() {
    const rewardEvents = await prisma.p4i_reward_event.updateMany({
        where: {
            progressStatus: RewardEventProgress.RUNNING,
            start: {
                lte: new Date()
            }
        },
        data: {
            progressStatus: RewardEventProgress.DONE
        }
    })
}

export async function createRewardEvent(rewardEvent: RewardEvent) {
    const rewardEventObject = await prisma.p4i_reward_event.create({
        data: {
            start: rewardEvent.start,
            end: rewardEvent.end,
            progressStatus: RewardEventProgress.INITIALIZED
        }
    });

    await prisma.p4i_reward_2_reward_event.createMany({
        data: Array.from(rewardEvent.rewards.values()).map(rewardEvent => {
            return {reward_event_id: rewardEventObject.id, reward_id: rewardEvent.reward_id, amount: rewardEvent.amount}
        })
    })

    return objectToModelEmptyRewards(rewardEventObject);
}

export async function updateRewardEvent(id: number, rewardEvent: RewardEvent) {
    const existingRewardEvent = await findRewardEventById(id);
    if(existingRewardEvent.progressStatus == RewardEventProgress.INITIALIZED) {
        const updatedRewardEventObject = await prisma.p4i_reward_event.update({
            data: {
                start: rewardEvent.start,
                end: rewardEvent.end
            },
            where: {
                id: id
            }
        })
        const updatedRewardEvent = objectToModelEmptyRewards(rewardEvent);

        //Delete rewards
        await prisma.p4i_reward_2_reward_event.deleteMany({
            where: {
                reward_event_id: id
            }
        });

        //Create rewards
        await prisma.p4i_reward_2_reward_event.createMany({
            data: Array.from(rewardEvent.rewards.values()).map(rewardEvent => {
                return {reward_event_id: id, reward_id: rewardEvent.reward_id, amount: rewardEvent.amount}
            })
        });

        return updatedRewardEvent;
    } else {
        throw error('Cant update Reward Event when progressStatus is running')
    }
}

export async function startRewardEvents(ids: number[]) {
    await prisma.p4i_reward_event.updateMany({
        where: {
            OR: ids.map(id => {return {id: id}}),
            progressStatus: RewardEventProgress.INITIALIZED
        },
        data: {
            progressStatus: RewardEventProgress.RUNNING
        }
    })
}

export async function finishRewardEvent(id: number) {
    try {
        await prisma.p4i_reward_event.update({
            where: {
                id: id
            },
            data: {
                progressStatus: RewardEventProgress.DONE
            }
        })
    } catch (error) {
        console.error(error);
    }
}

export async function removeRewardEvent(id: number) {
    const existingRewardEvent = await findRewardEventById(id);
    if(existingRewardEvent.progressStatus != RewardEventProgress.RUNNING) {
        const rewardObject = await prisma.p4i_reward_event.delete({
            where: {
                id: id
            }
        });

        //Delete rewards
        await prisma.p4i_reward_2_reward_event.deleteMany({
            where: {
                reward_event_id: id
            }
        })

        return objectToModel(rewardObject);
    } else {
        throw error('Cant remove Reward Event when progressStatus is running')
    }
}

async function findRewardEventRewardsByRewardEventId(id: number) {
    return prisma.$queryRaw<RewardEventReward[]>`
            select r.id as reward_id, m.amount
            from p4i_reward_2_reward_event m
                     left join p4i_reward r
                               on m.reward_id = r.id
            where reward_event_id = ${id}`;
}

function objectToModel(object: any): RewardEvent {
    return new RewardEvent(
        object.id,
        object.start,
        object.end,
        object.rewards,
        object.progressStatus
    )
}

function objectToModelEmptyRewards(object: any): RewardEvent {
    return new RewardEvent(
        object.id,
        object.start,
        object.end,
        new Map(),
        object.progressStatus
    )
}

function objectToRewardEventReward(object: any): RewardEventReward {
    return new RewardEventReward(
        object.reward_id,
        object.amount
    )
}

function setRewardsToRewardEvent(rewardEvent: RewardEvent, rewardEventRewards: RewardEventReward[]) {
    rewardEventRewards.forEach(rewardEventRewards => {
        if (rewardEvent.rewards.has(rewardEventRewards.reward_id)) {
            rewardEvent.rewards.get(rewardEventRewards.reward_id).amount += rewardEventRewards.amount;
        } else {
            rewardEvent.rewards.set(rewardEventRewards.reward_id, rewardEventRewards);
        }
    })

    return rewardEvent;
}