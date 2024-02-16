import express from "express";
import Reward from "../domain/reward/Reward";
import ensureAdminAuthenticated from "../middleware/ensureAdminAuthenticated";
import {createReward, findAllRewards, findRewardById, removeReward, updateReward} from "../services/reward.service";

const router = express.Router();

router.get('/', ensureAdminAuthenticated, getAll);
router.get('/:id', ensureAdminAuthenticated, getById);
router.post('/', ensureAdminAuthenticated, postReward);
router.put('/:id', ensureAdminAuthenticated, putReward);
router.delete('/:id', ensureAdminAuthenticated, deleteReward);

export async function getAll(req, res) {
    const rewards = await findAllRewards();
    res.status(200)
    res.send(rewards);
}

export async function getById(req, res) {
    try {
        const reward = await findRewardById(parseInt(req.params.id));
        res.status(200);
        res.send(reward);
    } catch (error) {
        console.error(error);
        res.status(404);
        res.send("Not found");
    }
}

export async function postReward(req, res) {
    try {
        console.log(req.body);
        const data = Reward.fromAnyWithIdNull(req.body);
        const reward = await createReward(data);
        res.status(201)
        res.send(reward);
    } catch (error) {
        console.error(error);
        res.status(500);
        res.send("Server error");
    }
}

export async function putReward(req, res) {
    const data = Reward.fromAnyWithIdNull(req.body);
    try {
        const reward = await updateReward(parseInt(req.params.id), data);
        res.status(200)
        res.send(reward);
    } catch (error) {
        console.error(error);
        res.status(404);
        res.send("Not found");
    }
}

export async function deleteReward(req, res) {
    try {
        const reward = await removeReward(parseInt(req.params.id));
        res.status(200)
        res.send(reward);
    } catch (error) {
        console.error(error);
        res.status(404);
        res.send("Not found")
    }
}

export default router;