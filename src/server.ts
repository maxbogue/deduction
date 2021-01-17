import express, { Request, Response } from 'express';
import expressWs from 'express-ws';
import path from 'path';
import WebSocket from 'ws';

import { Game } from './game';
import { Dict } from './types';
import { WebSocketConnection } from './websocket';

const JS_PATH = path.resolve(__dirname, '..', 'build', 'js');

const { app } = expressWs(express());

app.get('/js/:filename', (req: Request, res: Response) => {
  res.sendFile(path.resolve(JS_PATH, req.params.filename));
});

//app.use('/robots.txt', express.static('static/robots.txt'));
app.use('/static', express.static('static'));

const gamesById: Dict<Game> = {};

app.ws('/api/:gameId/', (ws: WebSocket, req: Request) => {
  const { gameId } = req.params;
  if (!gamesById[gameId]) {
    gamesById[gameId] = new Game();
  }
  const game = gamesById[gameId];
  game.addConnection(new WebSocketConnection(game, ws));
});

app.get('*', (_, res) => {
  res.sendFile(path.resolve(__dirname, 'index.html'));
});

console.log('Starting server...');
app.listen(3000);
