const restify = require('restify');
const config = require('./config');

const server = restify.createServer();

//Middleware
server.use(restify.plugins.bodyParser({mapParams: true}));

server.listen(config.PORT, () => {
    require('./routes/customers')(server);
    console.info(`api is running on port ${config.PORT}`);
})
