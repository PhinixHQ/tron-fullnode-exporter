const axios = require('axios');
const express = require('express');
const app = express();
require('dotenv').config();
const client = require('prom-client');
axios.defaults.timeout = parseInt(process.env.AXIOS_TIMEOUT);
// URLs

const tronScanApiUrl = process.env.TRONSCAN_BASE_URL
const tronFullNodeUrl = process.env.TRON_FULLNODE_BASE_URL

// metrics

const tronscanUpGauge = new client.Gauge({ name: 'tron_tronscan_up', help: 'if tronscan is accessible' });
const tronscanCurrentBlockGauge = new client.Gauge({ name: 'tron_tronscan_current_block', help: 'number of current block' });
const tronscanLastUpdateGauge = new client.Gauge({ name: 'tron_tronscan_last_update_seconds', help: 'number of latet block' });
const fullnodeUpGauge = new client.Gauge({ name: 'tron_fullnode_up', help: 'if fullNode is accessible' });
const fullnodeCurrentBlockGauge = new client.Gauge({ name: 'tron_fullnode_current_block', help: 'number of current block' });
const fullnodeLastUpdateGauge = new client.Gauge({ name: 'tron_fullnode_last_update_seconds', help: 'number of latest block' });

// get the latest tronScan block number
async function updateTronScanMetrics(){
    try{
        const tronScanLatestBlock = await axios.get(tronScanApiUrl);
        tronscanUpGauge.set(1);
        tronscanCurrentBlockGauge.set(tronScanLatestBlock.data.number);
        tronscanLastUpdateGauge.set(Math.floor(Date.now() / 1000));
    }
    catch(err) {
        console.log(err);
        tronscanUpGauge.set(0);
    }
}

// get the latest tronFullnode block number
async function updateTronFullNodeMetrics(){
    try{
        const tronFullNOdeLatestBlock = await axios.get(tronFullNodeUrl);
        fullnodeUpGauge.set(1);
        fullnodeCurrentBlockGauge.set(tronFullNOdeLatestBlock.data.block_header.raw_data.number);
        fullnodeLastUpdateGauge.set(Math.floor(Date.now() / 1000));
    }
    catch(err){
        console.log(err);
        fullnodeUpGauge.set(0);
    }
}

// metrics endpoint for prometheus
app.get('/metrics', async (req, res) => {
    metrics = await client.register.metrics();
    return res.status(200).send(metrics);
});

app.listen(process.env.LISTEN_PORT, () => console.log('Server is running and metrics are exposed on http://URL:3000/metrics'));

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main(){
   while(true){
       await Promise.all([updateTronScanMetrics(), updateTronFullNodeMetrics(), delay(process.env.REFRESH_INTERVAL_MILLISECONDS)]);
   }
}

main();

