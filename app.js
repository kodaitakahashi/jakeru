const app = require('express')();
const express = require('express');

const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});


const GOO = '1';
const PAR = '3';
const CHOKI = '2';

// count, status [revese: 準備 start: 開始, end: 終了, draw: ドロー]
let rooms ={};


io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    // ルーム選択
    socket.on('join room', (req) =>{
        console.log('join');
        // ルームが存在しなかったら
        if (!rooms.hasOwnProperty(req.roomName)){
            rooms[req.roomName] ={"count": 1, "userDetails":{}, "status":"revese"};
            rooms[req.roomName].userDetails[req.userName] = "";
            socket.join(req.roomName);
        } else if(rooms[req.roomName].status === "revese"){
            rooms[req.roomName].count++;
            rooms[req.roomName].userDetails[req.userName] = "";
            socket.join(req.roomName);
        } else{
            socket.join(req.roomName);
            io.to(req.roomName).emit("error",{});
            socket.leave(req.roomName);
            return false;
        }
        console.log(rooms);
        io.to(req.roomName).emit("joined",{"users":rooms[req.roomName].userDetails});
    });

    socket.on('start',(req) =>{
        rooms[req.roomName].status = 'start';
        io.to(req.roomName).emit("start",{});
    });
    
    socket.on('selected', (req) =>{
        rooms[req.roomName].userDetails[req.userName] = req.selected;
        console.log('input:' + req.selected);
        console.log(req.userName + ":" +  rooms[req.roomName].userDetails[req.userName])
        

        var count = 0;
        var par = 0;
        var choki = 0;
        var goo = 0;
        
        for(user in rooms[req.roomName].userDetails){
            if (PAR ===  rooms[req.roomName].userDetails[user]
                || CHOKI ===  rooms[req.roomName].userDetails[user]
                || GOO ===  rooms[req.roomName].userDetails[user]
               ){
                count++;
            }
        }
        // 判定開始
        if (count === rooms[req.roomName].count){
            console.log('ju');
            
            // 分類分け
            for(user in rooms[req.roomName].userDetails){
                console.log(rooms[req.roomName].userDetails[user] + 'j');
                
                if (PAR == rooms[req.roomName].userDetails[user]){
                    par++;
                    console.log('par');
                } else if (CHOKI == rooms[req.roomName].userDetails[user]){
                    choki++;
                    console.log('choki');
                } else if (GOO == rooms[req.roomName].userDetails[user]){
                    goo++;
                    console.log('goo');
                }
            }

            
            // あいこ
            if (rooms[req.roomName].count == 2){
                if (par >= 2 || goo >= 2 || choki >= 2){
                    console.log('draw');
                    io.emit("draw",{});
                    return;
                }
            } else  if (par >= 1 && choki >= 1 && goo >= 1){
                console.log('draw');
                
                io.emit("draw",{});
                return;
            }
            
            console.log('win');


            var wins = [];
            if (par > 0 && choki > 0 && goo == 0){
                
                for(user in rooms[req.roomName].userDetails){
                    if (CHOKI ==  rooms[req.roomName].userDetails[user]){
                        wins.push(user);
                    }
                }
            }

            if (par > 0 && choki == 0 && goo > 0){
                console.log('par');
                
                for(user in  rooms[req.roomName].userDetails){
                    if (PAR ==  rooms[req.roomName].userDetails[user]){
                        wins.push(user);
                    }
                }
            }

            if (par == 0 && choki > 0 && goo > 0){
                for(user in rooms[req.roomName].userDetails){
                    if (GOO ==  rooms[req.roomName].userDetails[user]){
                        wins.push(user);
                    }
                }
            }
            console.log(wins);
            
            io.to(req.roomName).emit('end',{'winners': wins});

            
        }
    });
    
    
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});
