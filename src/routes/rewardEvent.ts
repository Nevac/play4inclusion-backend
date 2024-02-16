import express from "express";
import Reward from "../domain/reward/Reward";
import ensureAdminAuthenticated from "../middleware/ensureAdminAuthenticated";
import {createReward, findAllRewards, findRewardById, removeReward, updateReward} from "../services/reward.service";
import {
    createRewardEvent,
    findAllRewardEvents,
    findRewardEventById, removeRewardEvent,
    updateRewardEvent
} from "../services/rewardEvent.service";
import RewardEvent from "../domain/reward/event/RewardEvent";

const router = express.Router();

router.get('/', ensureAdminAuthenticated, getAll);
router.get('/:id', ensureAdminAuthenticated, getById);
router.post('/', ensureAdminAuthenticated, postRewardEvent);
router.put('/:id', ensureAdminAuthenticated, putRewardEvent);
router.delete('/:id', ensureAdminAuthenticated, deleteRewardEvent);

export async function getAll(req, res) {
    const rewards = await findAllRewardEvents();
    res.status(200)
    res.send(rewards);
}

export async function getById(req, res) {
    try {
        const rewardEvent = await findRewardEventById(parseInt(req.params.id));
        res.status(200);
        res.send(rewardEvent.toJson());
    } catch (error) {
        console.error(error);
        res.status(404);
        res.send("Not found");
    }
}

export async function postRewardEvent(req, res) {
    try {
        console.log(req.body);
        const data = RewardEvent.fromAnyWithIdNull(req.body);
        const rewardEvent = await createRewardEvent(data);
        res.status(201)
        res.send(rewardEvent.toJson());
    } catch (error) {
        console.error(error);
        res.status(500);
        res.send("Server error");
    }
}

export async function putRewardEvent(req, res) {
    const data = RewardEvent.fromAnyWithIdNull(req.body);
    try {
        const rewardEvent = await updateRewardEvent(parseInt(req.params.id), data);
        res.status(200)
        res.send(rewardEvent.toJson());
    } catch (error) {
        console.error(error);
        res.status(404);
        res.send("Not found");
    }
}

export async function deleteRewardEvent(req, res) {
    try {
        const rewardEvent = await removeRewardEvent(parseInt(req.params.id));
        res.status(200)
        res.send(rewardEvent);
    } catch (error) {
        console.error(error);
        res.status(404);
        res.send("Not found")
    }
}

export default router;