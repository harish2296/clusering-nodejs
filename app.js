const http = require('http');
const express = require('express')
const cluster = require('cluster');
const app = express();
let workers = [];

const setupWorkerProcesses = () => {
    // cal number of workers by cores available
    let cores = require('os').cpus().length;
    console.log('Master cluster setting up ' + cores + ' workers');

    //start by making fork of clusters 
    for (let i = 0; i < cores; i++) {
        workers.push(cluster.fork());
        workers[i].on('message', function (message) {
            console.log(message);
        });
    }

    //active
    cluster.on('online', function (worker) {
        console.log('Activated Worker listening on process ' + worker.process.pid);
    });

    //if error
    cluster.on('exit', function (worker, code, signal) {
        console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
        console.log('Starting a new worker');
        cluster.fork();
        workers.push(cluster.fork());
        workers[workers.length - 1].on('message', function (message) {
            console.log(message);
        });
    });
};


const expressApp = () => {

    app.server = http.createServer(app);

    app.server.listen('8000', () => {
        console.log(`Started server => http://localhost:${app.server.address().port} , Process Id ${process.pid}`);
    });

    app.get('/', (req, res) => {
        console.log(`Recieved request on ${process.pid}`);
        res.send(
            { status: 200 }
        );
    });

    app.get('/status', (req, res) => {
        console.log(`Recieved status request on process ${process.pid}`);
        res.send(
            { status: 200 }
        );
    });

};


if (cluster.isMaster) {
    setupWorkerProcesses();
    expressApp();
}
