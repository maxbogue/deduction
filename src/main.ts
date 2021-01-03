import express, { Request, Response } from 'express';
import expressWs from 'express-ws';
import WebSocket from 'ws';
import { createServer } from 'http';

import { Game } from './game';
import { Dict } from './types';
import { WebSocketConnection } from './websocket';

const { app } = expressWs(express());

app.get('/', (req: Request, res: Response) => {
  res.send('<h1>Hello jhsjdkfhasklfhas</h1>');
});

app.get('/game/:id/', (req: any, res: any) => {
  res.status(200).send(`
    <h1>Some cool page</h1>
    <h2>URL</h2>
    ${req.url}
    <h2>Params</h2>
    ${JSON.stringify(req.params, null, 2)}
  `);
});

const gamesById: Dict<Game> = {};

app.ws('/:gameId/', (ws: WebSocket, req: Request) => {
  const { gameId } = req.params;
  if (!gamesById[gameId]) {
    gamesById[gameId] = new Game();
  }
  const game = gamesById[gameId];
  game.addConnection(new WebSocketConnection(game, ws));
});
  
console.log('Starting server...');
app.listen(3000);
