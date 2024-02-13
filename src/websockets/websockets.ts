import setupWebsocket from "./setupWebsocket";
import gameEvents from "./gameEvents";
import {io} from "../app";
import {Socket} from "socket.io";
import {DefaultEventsMap} from "socket.io/dist/typed-events";

export default function buildWebsocketEndpoint(sessionMiddleware, passport) {
    io.on('connection', (socket) => {
        console.log('Websocket connected');
        console.log(socket.request['user']['id'])

        gameEvents(socket);
        socket.on("connect_error", (err) => {
            console.log(`connect_error due to ${err.message}`);
        });
    });
    setupWebsocket(sessionMiddleware, passport)
}