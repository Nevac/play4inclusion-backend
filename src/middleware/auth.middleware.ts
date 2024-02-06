export default function authenticationMiddleware () {
    return function (req, res, next) {
        console.log(req.isAuthenticated());
        if (req.isAuthenticated()) {
            return next()
        }
        res.status(401);
        return res.send("Not Authenticated");
    }
}