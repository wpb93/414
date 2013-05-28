var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var uid;
var game;
var live;
var life;
var init;
var ParticleDemoMasterAddress = this["AppInfo"] && this["AppInfo"]["MasterAddress"] ? this["AppInfo"]["MasterAddress"] : "localhost:9090";
var ParticleDemoAppId = this["AppInfo"] && this["AppInfo"]["AppId"] ? this["AppInfo"]["AppId"] : "<no-app-id>";
var ParticleDemoAppVersion = this["AppInfo"] && this["AppInfo"]["AppVersion"] ? this["AppInfo"]["AppVersion"] : "1.0";
var DemoLoadBalancing = (function (_super) {
    __extends(DemoLoadBalancing, _super);
    function DemoLoadBalancing() {
        _super.call(this, ParticleDemoMasterAddress, ParticleDemoAppId, ParticleDemoAppVersion);
        this.logger = new Exitgames.Common.Logger("Demo: ");
        this.USERCOLORS = [
            "#FF0000", 
            "#00AA00", 
            "#0000FF", 
            "#FFFF00", 
            "#00FFFF", 
            "#FF00FF"
        ];
        this.output(this.logger.format("Init", ParticleDemoMasterAddress, ParticleDemoAppId, ParticleDemoAppVersion));
        this.logger.info("Init", ParticleDemoMasterAddress, ParticleDemoAppId, ParticleDemoAppVersion);
        this.setLogLevel(Exitgames.Common.Logger.Level.DEBUG);
        this.myActor().setName(uid);
        this.myActor().setCustomProperty("color", this.USERCOLORS[0]);
        this.setOpReady(false);
        this.startGameHandle = null;
        this.firstTime = true;
    }
    DemoLoadBalancing.prototype.start = function () {
        this.setupUI();
        this.connect(true);
    };
    DemoLoadBalancing.prototype.onError = function (errorCode, errorMsg) {
        this.output("Error " + errorCode + ": " + errorMsg);
    };
    DemoLoadBalancing.prototype.onEvent = function (code, content, actorNr) {
        switch(code) {
            case 1:
                var mess = content.message;
                var sender = content.senderName;
                this.speak(sender + ": " + mess, this.myRoomActors()[actorNr].getCustomProperty("color"));
                break;
            case 2:
                init();
                var gameDiv = document.getElementById("gameDiv");
                var liveGameDiv = document.getElementById("liveGame");
                gameDiv.style.display = "block";
                liveGameDiv.style.display = "block";
                var readyStat = document.getElementById("readyStatus");
                readyStat.style.display = "none";
                game.client = this;
                game.begin();
                live.begin();
                this.sendGameState(this);
                break;
            case 3:
                if(live) {
                    live.updateState(JSON.parse(content.gameState));
                }
                break;
            case 4:
                if(game) {
                    switch(parseInt(content.index)) {
                        case 0:
                            game.hole();
                            break;
                        case 1:
                            game.curve();
                            break;
                        case 2:
                            game.shake();
                            break;
                        case 3:
                            game.bigger(2);
                            break;
                        case 4:
                            game.split();
                            break;
                        case 5:
                            game.accelerate(2);
                            break;
                    }
                }
                break;
            case 5:
                if(game) {
                    game.opDied();
                }
                break;
            case 6:
                if(game) {
                    this.speak("You Win! Your score: " + game.score + ", your opponent's score: " + live.score);
                    this.quitGame();
                }
                break;
            default:
                console.log("Unknown Message: " + JSON.stringify(content));
        }
        this.logger.debug("onEvent", code, "content:", content, "actor:", actorNr);
    };
    DemoLoadBalancing.prototype.onStateChange = function (state) {
        var LBC = Photon.LoadBalancing.LoadBalancingClient;
        var stateText = document.getElementById("statetxt");
        stateText.textContent = LBC.StateToName(state);
        this.updateRoomButtons();
        if(this.firstTime && state == Photon.LoadBalancing.LoadBalancingClient.State.JoinedLobby) {
            this.createRoom(null, true, false, 1);
        }
    };
    DemoLoadBalancing.prototype.onActorPropertiesChange = function (actor) {
        this.setOpReady(actor.getCustomProperty("ready"));
        this.startGame();
    };
    DemoLoadBalancing.prototype.onRoomListUpdate = function (rooms, roomsUpdated, roomsAdded, roomsRemoved) {
        this.logger.info("Demo: onRoomListUpdate", rooms, roomsUpdated, roomsAdded, roomsRemoved);
        this.output("Demo: Rooms update: " + roomsUpdated.length + " updated, " + roomsAdded.length + " added, " + roomsRemoved.length + " removed");
        this.onRoomList(rooms);
        this.updateRoomButtons();
    };
    DemoLoadBalancing.prototype.onRoomList = function (rooms) {
        if(this.firstTime && this.isJoinedToRoom()) {
            console.log("Multiple login check: " + this.myRoom().getCustomPropertyOrElse("uid", null));
            this.firstTime = false;
            this.leaveRoom();
            return;
        }
        var menu = document.getElementById("gamelist");
        menu.innerHTML = "";
        var roomsPerRow = 4;
        var k = roomsPerRow;
        var row;
        var roomcnt = rooms.length;
        for(var i = 0; i < rooms.length; ++i) {
            var r = rooms[i];
            if(!r.isOpen) {
                if(r.getCustomPropertyOrElse("uid", null) == uid) {
                    console.log("Multiple login detected: " + this.myRoom().getCustomPropertyOrElse("uid", null));
                    this.quit();
                    return;
                }
                roomcnt--;
                continue;
            }
            if(k >= roomsPerRow) {
                row = document.createElement("tr");
                k = 0;
            }
            var item = document.createElement("td");
            var isFull = r.playerCount >= r.maxPlayers;
            item.className = isFull ? "room full" : "room";
            item.innerText = r.name + " ";
            var capacity = document.createElement("span");
            capacity.innerText = r.playerCount + " / " + r.maxPlayers;
            item.appendChild(capacity);
            var self = this;
            item.onclick = (function () {
                var myself = self;
                var room = r;
                return function () {
                    if(myself.isJoinedToRoom() && myself.myRoom().name != room.name) {
                        myself.leaveRoom();
                    }
                    myself.joinRoom(room.name);
                    return false;
                };
            })();
            row.appendChild(item);
            if(++k >= roomsPerRow) {
                menu.appendChild(row);
            }
        }
        if(k < roomsPerRow) {
            menu.appendChild(row);
        }
        var cnt = document.getElementById("roomcnt");
        cnt.innerText = roomcnt.toString();
        this.output("Demo: Rooms total: " + rooms.length);
        this.updateRoomButtons();
    };
    DemoLoadBalancing.prototype.onJoinRoom = function () {
        if(!this.myRoom().isOpen) {
            this.myRoom().setCustomProperty("uid", uid);
            return;
        }
        this.setMeReady(false);
        var dialog = document.getElementById("theDialogue");
        dialog.innerHTML = "";
        var input = document.getElementById("input");
        input.value = "";
        var chat = document.getElementById("chat");
        chat.style.display = "block";
        var lobby = document.getElementById("lobby");
        lobby.style.display = "none";
        this.speak("Game " + this.myRoom().name + " joined");
        var actors = this.myRoomActors();
        var opponent;
        for(var i in actors) {
            if(parseInt(i) != this.myActor().actorNr) {
                opponent = actors[i];
                break;
            }
        }
        var title = document.getElementsByTagName("h1")[0];
        if(!opponent) {
            this.setOpReady(false);
            title.innerText = "Waiting for another player...";
        } else {
            this.setOpReady(opponent.getCustomProperty("ready"));
            title.innerText = "Your opponent is " + opponent.name;
            var opStat = document.getElementById("opStatus");
            opStat.style.display = "block";
        }
    };
    DemoLoadBalancing.prototype.onActorJoin = function (actor) {
        if(this.isJoinedToRoom()) {
            var title = document.getElementsByTagName("h1")[0];
            title.innerText = "Your opponent is " + actor.name;
            var opStat = document.getElementById("opStatus");
            opStat.style.display = "block";
        }
        this.speak(actor.name + " joined");
    };
    DemoLoadBalancing.prototype.onActorLeave = function (actor) {
        if(this.isJoinedToRoom()) {
            game.stop();
            live.stop();
            var gameDiv = document.getElementById("gameDiv");
            var liveGameDiv = document.getElementById("liveGame");
            gameDiv.style.display = "none";
            liveGameDiv.style.display = "none";
            var readyStat = document.getElementById("readyStatus");
            readyStat.style.display = "block";
            var title = document.getElementsByTagName("h1")[0];
            title.innerText = "Waiting for another player...";
            var opStat = document.getElementById("opStatus");
            opStat.style.display = "none";
            this.setMeReady(false);
            this.setOpReady(false);
        }
        this.speak(actor.name + " left");
    };
    DemoLoadBalancing.prototype.sendMessage = function (message) {
        try  {
            this.raiseEvent(1, {
                message: message,
                senderName: uid
            });
            this.speak('me[' + uid + ']: ' + message, this.myActor().getCustomProperty("color"));
        } catch (err) {
            this.output("error: " + err.message);
        }
    };
    DemoLoadBalancing.prototype.openRooms = function () {
        var rooms = this.availableRooms();
        var roomcnt = rooms.length;
        for(var i = 0; i < rooms.length; i++) {
            if(!rooms[i].isOpen) {
                roomcnt--;
            }
        }
        return roomcnt;
    };
    DemoLoadBalancing.prototype.quit = function () {
        this.disconnect();
        var lobby = document.getElementById("lobby");
        lobby.style.display = "none";
        var chat = document.getElementById("chat");
        chat.style.display = "none";
        var title = document.getElementsByTagName("h1")[0];
        title.innerText = "Multiple login detected. You are disconnected.";
    };
    DemoLoadBalancing.prototype.quitGame = function () {
        var gameDiv = document.getElementById("gameDiv");
        var liveGameDiv = document.getElementById("liveGame");
        gameDiv.style.display = "none";
        liveGameDiv.style.display = "none";
        var readyStat = document.getElementById("readyStatus");
        readyStat.style.display = "block";
        this.setMeReady(false);
        this.setOpReady(false);
    };
    DemoLoadBalancing.prototype.getUpdateFunction = function (client) {
        return function () {
            client.raiseEvent(3, {
                gameState: JSON.stringify(game.getCurrState())
            });
        };
    };
    DemoLoadBalancing.prototype.sendGameState = function (client) {
        this.getUpdateFunction(client)();
    };
    DemoLoadBalancing.prototype.sendDiedMessage = function (client) {
        client.raiseEvent(6, null);
    };
    DemoLoadBalancing.prototype.setupUI = function () {
        var _this = this;
        this.logger.info("Setting up UI.");
        var input = document.getElementById("input");
        input.value = '';
        input.focus();
        var btnJoin = document.getElementById("joinrandomgamebtn");
        btnJoin.onclick = function (ev) {
            if(_this.isInLobby()) {
                _this.output("Random Game...");
                _this.joinRandomRoom();
            } else {
                _this.output("Reload page to connect to Master");
            }
            return false;
        };
        var btnNew = document.getElementById("newgamebtn");
        btnNew.onclick = function (ev) {
            if(_this.isInLobby()) {
                var name = document.getElementById("newgamename");
                _this.output("New Game");
                _this.createRoom(name.value ? name.value : (uid + "'s room"), true, true, 2);
            } else {
                _this.output("Reload page to connect to Master");
            }
            return false;
        };
        var form = document.getElementById("mainfrm");
        form.onsubmit = function () {
            if(_this.isJoinedToRoom()) {
                var input = document.getElementById("input");
                if(input.value) {
                    _this.sendMessage(input.value);
                    input.value = '';
                }
                input.focus();
            } else {
                if(_this.isInLobby()) {
                    _this.output("Press Join or New Game to connect to Game");
                } else {
                    _this.output("Reload page to connect to Master");
                }
            }
            return false;
        };
        var btn = document.getElementById("leavebtn");
        btn.onclick = function (ev) {
            _this.leaveRoom();
            var chat = document.getElementById("chat");
            chat.style.display = "none";
            var lobby = document.getElementById("lobby");
            lobby.style.display = "block";
            var title = document.getElementsByTagName("h1")[0];
            title.innerText = "Lobby";
            return false;
        };
        btn = document.getElementById("colorbtn");
        btn.onclick = function (ev) {
            var ind = Math.floor(Math.random() * _this.USERCOLORS.length);
            var color = _this.USERCOLORS[ind];
            _this.myActor().setCustomProperty("color", color);
            _this.sendMessage("... changed his / her color!");
        };
        btn = document.getElementById("ready");
        btn.onclick = function (ev) {
            var me = _this.myActor();
            var meReady = !me.getCustomProperty("ready");
            _this.setMeReady(meReady);
            _this.startGame();
        };
        this.updateRoomButtons();
        var chat = document.getElementById("chat");
        chat.style.display = "none";
        var lobby = document.getElementById("lobby");
        lobby.style.display = "block";
        var title = document.getElementsByTagName("h1")[0];
        title.innerText = "Lobby";
    };
    DemoLoadBalancing.prototype.speak = function (str, color) {
        var log = document.getElementById("theDialogue");
        var escaped = str.replace(/&/, "&amp;").replace(/</, "&lt;").replace(/>/, "&gt;").replace(/"/, "&quot;");
        if(color) {
            escaped = "<FONT COLOR='" + color + "'>" + escaped + "</FONT>";
        }
        log.innerHTML = log.innerHTML + escaped + "<br>";
        log.scrollTop = log.scrollHeight;
    };
    DemoLoadBalancing.prototype.say = function (client, str, color) {
        client.speak(str, color);
    };
    DemoLoadBalancing.prototype.output = function (str, color) {
        console.log(str);
    };
    DemoLoadBalancing.prototype.updateRoomButtons = function () {
        var btn;
        btn = document.getElementById("newgamebtn");
        btn.disabled = !(this.isInLobby() && !this.isJoinedToRoom());
        var canJoin = this.isInLobby() && !this.isJoinedToRoom() && this.openRooms() > 0;
        btn = document.getElementById("joinrandomgamebtn");
        btn.disabled = !canJoin;
        btn = document.getElementById("leavebtn");
        btn.disabled = !(this.isJoinedToRoom());
    };
    DemoLoadBalancing.prototype.startGame = function () {
        var countDown = 5;
        var client = this;
        var start = function () {
            var meReady = client.myActor().getCustomProperty("ready");
            if(meReady && client.opReady) {
                if(countDown > 0) {
                    client.speak("Game start count down: " + countDown);
                    countDown--;
                    client.startGameHandle = setTimeout(start, 1000);
                } else {
                    client.startGameHandle = null;
                    client.speak("Game start!");
                    client.raiseEvent(2, null);
                }
            }
        };
        start();
    };
    DemoLoadBalancing.prototype.setMeReady = function (ready) {
        this.myActor().setCustomProperty("ready", ready);
        var btn = document.getElementById("ready");
        btn.lastChild.textContent = ready ? "Ready" : "Not ready";
        var img = document.getElementById("meReady");
        img.src = "/Images/circle_" + (ready ? "green" : "yellow") + ".png";
        if(!ready && this.startGameHandle != null) {
            clearTimeout(this.startGameHandle);
        }
    };
    DemoLoadBalancing.prototype.setOpReady = function (ready) {
        this.opReady = ready;
        var img = document.getElementById("opReady");
        img.src = "/Images/circle_" + (ready ? "green" : "yellow") + ".png";
        if(!ready && this.startGameHandle != null) {
            clearTimeout(this.startGameHandle);
        }
        var opStat = document.getElementById("opStatus");
        (opStat.getElementsByTagName("span")[0]).innerText = ready ? "Your opponent is ready!" : "Your opponent is not ready";
    };
    return DemoLoadBalancing;
})(Photon.LoadBalancing.LoadBalancingClient);
var demo;
window.onload = function () {
    demo = new DemoLoadBalancing();
    demo.start();
};
