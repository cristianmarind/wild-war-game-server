var express = require('express')
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var cors = require('cors')
const bodyParser = require('body-parser');

let servers = [{
        name: 'Alpha',
        maxPlayers: 10,
        currentPlayers: 0,
        players: {}
    }, 
    {
        name: 'Beta',
        maxPlayers: 10,
        currentPlayers: 0,
        players: {}
    },
    {
        name: 'Gamma',
        maxPlayers: 10,
        currentPlayers: 0,
        players: {}
    },
    {
        name: 'Omega',
        maxPlayers: 10,
        currentPlayers: 0,
        players: {}
    },
    {
        name: 'Delta',
        maxPlayers: 10,
        currentPlayers: 0,
        players: {}
    }
]

app.use(cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

io.on('connection', function (socket) {

    if (!isValidUsername(socket.handshake.query.playerId)) {
        socket.emit('reseat')
    }
    socket.on('conectToServer', function (serverId) {
        let player = gameMethods.createPlayer(socket.handshake.query.playerId, serverId)
        socket.broadcast.emit(`newPlayer-server-${serverId}`, {
            player: player,
        })
        socket.emit(`initialEvent`, {
            players: servers[serverId].players,
            id: player.id,
            serverId
        })
        socket.on(`emitMovePlayerToTheLeft-server-${serverId}`, function (playerId) {
            if (servers[serverId].players[playerId].up) {
                servers[serverId].players[playerId].left = false
            }else{
                servers[serverId].players[playerId].left = true
            }
            
            io.emit(`refreshPlayer-server-${serverId}`, servers[serverId].players[playerId])
        });
        socket.on(`emitStopPlayerToTheLeft-server-${serverId}`, function (playerId) {
            servers[serverId].players[playerId].left = false
            io.emit(`refreshPlayer-server-${serverId}`, servers[serverId].players[playerId])
        });
        socket.on(`emitMovePlayerToTheRight-server-${serverId}`, function (playerId) {
            if (servers[serverId].players[playerId].up) {
                servers[serverId].players[playerId].right = false
            }else{
                servers[serverId].players[playerId].right = true
            }
            io.emit(`refreshPlayer-server-${serverId}`, servers[serverId].players[playerId])
        });
        socket.on(`emitStopPlayerToTheRight-server-${serverId}`, function (playerId) {
            servers[serverId].players[playerId].right = false
            io.emit(`refreshPlayer-server-${serverId}`, servers[serverId].players[playerId])
        });
        socket.on(`emitMovePlayerToUp-server-${serverId}`, function (playerId) {
            servers[serverId].players[playerId].up = true
            servers[serverId].players[playerId].left = false
            servers[serverId].players[playerId].right = false
            io.emit(`refreshPlayer-server-${serverId}`, servers[serverId].players[playerId])
        });
        socket.on(`emitStopPlayerToUp-server-${serverId}`, function (playerId) {
            servers[serverId].players[playerId].up = false
            io.emit(`refreshPlayer-server-${serverId}`, servers[serverId].players[playerId])
        });
        socket.on(`emitLoserPlayer-server-${serverId}`, function (playerId) {
            io.emit(`loserPlayer-server-${serverId}`, { playerId })
        });
        socket.on(`emitCollectStar-server-${serverId}`, function (data) {
            let positionXStar = data.positionXStar
            io.emit(`refreshStars-server-${serverId}`, { positionXStar })
        });
        socket.on(`emitCollectAllStars-server-${serverId}`, function (data) {
            let x = Math.random() * (800 - 400) + 400;
            let velocity = Math.random() * (100 + 100) -100;
            io.emit(`collectAllStars-server-${serverId}`, { x, velocity })
        });
        socket.on(`emitMyPosition-server-${serverId}`, function (data) {
            let playerId = data.playerId
            servers[serverId].players[playerId].posX = data.posX
            servers[serverId].players[playerId].posY = data.posY
            io.emit(`refreshPositionPlayer-server-${serverId}`, servers[serverId].players[playerId])
        });
        socket.on('disconnect', () => {
            delete servers[serverId].players[player.id]
            socket.broadcast.emit(`playerDisconnect-server-${serverId}`, {
                id: player.id,
            })
        });
    });
});

app.post('/isValidPlayerId', function(require, response){
    return response.send(isValidUsername(require.body.playerId))
})

http.listen(3000, function () {
    console.log('listening on *:3000');
});


function isValidUsername(username) {
    for (const iterator of servers) {
        for (const key in iterator.players) {
            if (key == username) {
                return false
            }
        }
    }
    return true
}

let gameMethods = {
    createPlayer(playerId, serverId) {
        let player = {
            id: playerId,
            posX: 100,
            posY: 450,
            left: false,
            right: false,
            up: false
        }
        servers[serverId].players[playerId] = player
        return player
    }
}


