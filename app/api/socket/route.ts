import { Server as NetServer } from 'http';
import { Socket } from 'net';
import { Server as SocketIOServer } from 'socket.io';
import type { NextApiRequest, NextApiResponse } from 'next';

type NextApiResponseWithSocket = NextApiResponse & {
  socket: Socket & {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
};

export default function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
    if (!res.socket?.server.io) {
        const io = new SocketIOServer(res.socket.server as any);

        res.socket.server.io = io;

        io.on("connect", socket => {
            socket.on("offer", data => socket.broadcast.emit("offer", data))
            socket.on("answer", data => socket.broadcast.emit("answer", data))
            socket.on("candidate", data => socket.broadcast.emit("candidate", data))
        })
    }
    res.end()
}