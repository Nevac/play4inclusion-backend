import {isAuthorizedAdmin} from "../services/role.service";

export default async function ensureAdminAuthenticated(req, res, next) {
    console.log(req.user);
    if (req.isAuthenticated() && await isAuthorizedAdmin(req.user.id)) return next();
    else res.status(401).send('Access denied')
}