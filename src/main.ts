import express, { Request, Response } from 'express';
import expressWs from 'express-ws';
import WebSocket from 'ws';
import { createServer } from 'http';

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

type Dict<T> = { [key: string]: T };

const websocketsById: Dict<Set<WebSocket>> = {};

function sendPlayerCount(gameId: string): void {
  const websockets = websocketsById[gameId];
  websockets.forEach(w => {
    w.send(`there are now ${websockets.size} players connected`);
  });
}

app.ws('/:gameId/', (ws: WebSocket, req: Request) => {
  console.log('websocket connected');

  const { gameId } = req.params;
  if (!websocketsById[gameId]) {
    websocketsById[gameId] = new Set();
  }
  websocketsById[gameId].add(ws);

  ws.on('message', (message: string) => {
    console.log('received: %s', message);
    ws.send(`Hello, you sent -> ${message}`);
  });

  ws.on('close', () => {
    console.log('closing websocket');
    websocketsById[gameId].delete(ws);
    sendPlayerCount(gameId);
  });

  sendPlayerCount(gameId);
});
  
console.log('Starting server...');
app.listen(3000);
