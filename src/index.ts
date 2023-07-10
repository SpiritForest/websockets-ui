import { runHttpServer } from './http_server';
import { runWebSocket } from './websocket';

runHttpServer(8181)
  .then((port) => {
    console.log(`Start static http server on the ${port} port!`);
  })
  .catch((err: Error) => {
    console.log(`The error occurred on the HTTP server: ${err}`);
  });

runWebSocket(3000)
  .then((port) => {
    console.log(`Start WebSocket server on the ${port} port!`);
  })
  .catch((err: Error) => {
    console.log(`The error occurred on the WebSocket server: ${err}`);
  });
