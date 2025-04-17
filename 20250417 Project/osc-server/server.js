const osc = require('osc');
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8081 });

wss.on('connection', ws => {
    console.log('WebSocket connected');
});

const udpPort = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: 9001
});

udpPort.on('message', function (oscMsg) {
    console.log("OSC message:", oscMsg);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(oscMsg));
        }
    });
});

udpPort.open(); 