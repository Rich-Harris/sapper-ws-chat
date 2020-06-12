import http from 'http';
import sirv from 'sirv';
import express from 'express';
import sapper from 'sapper';
import compression from 'compression';
import WebSocket from 'ws';
import { manifest } from './manifest/server.js';

const app = express().use(
	compression({ threshold: 0 }),
	sirv('assets'),
	sapper({ manifest })
);

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

/*
const message_history = [{
	id: uuidv4(),
	timestamp: Date.now(),
	action: 'join',
	name: 'sapperchatbot'
}, {
	id: uuidv4(),
	timestamp: Date.now(),
	action: 'message',
	name: 'sapperchatbot',
	content: 'hello world!'
}];
*/

// https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
function uuidv4() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
		const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}

function broadcast(data) {
	data.id = uuidv4();
	data.timestamp = Date.now();

	// message_history.push(data);

	const json = JSON.stringify(data);

	wss.clients.forEach(client => {
		if (client.readyState === WebSocket.OPEN) {
			client.send(json);
		}
	});
}

function pickRandom(arr) {
	const i = ~~(Math.random() * arr.length);
	return arr[i];
}

wss.on('connection', ws => {
	// ws.send(JSON.stringify(message_history));

	let name;

	ws.on('close', () => {
		broadcast({
			action: 'message',
			name: 'sapperchatbot',
			content: `@${name} just left the server :(`
		});
	});

	ws.on('message', json => {
		const data = JSON.parse(json);

		if (data.action === 'join') {
			name = data.name;

			setTimeout(() => {
				const greeting = pickRandom([
					`oh hai @${name}!`,
					`@${name} is here! everybody look busy!`,
					`hey there @${name}`,
					`we were wondering when you'd show up @${name}`,
					` 👋 @${name}`
				]);

				broadcast({
					action: 'message',
					name: 'sapperchatbot',
					content: greeting
				});
			}, 1500 + Math.random() * 2000);
		}

		broadcast(data);
	});
});

server.listen(process.env.PORT);