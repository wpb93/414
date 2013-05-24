var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var uid;
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
            default:
        }
        this.logger.debug("onEvent", code, "content:", content, "actor:", actorNr);
    };
    DemoLoadBalancing.prototype.onStateChange = function (state) {
        var LBC = Photon.LoadBalancing.LoadBalancingClient;
        var stateText = document.getElementById("statetxt");
        stateText.textContent = LBC.StateToName(state);
        this.updateRoomButtons();
    };
    DemoLoadBalancing.prototype.onRoomListUpdate = function (rooms, roomsUpdated, roomsAdded, roomsRemoved) {
        this.logger.info("Demo: onRoomListUpdate", rooms, roomsUpdated, roomsAdded, roomsRemoved);
        this.output("Demo: Rooms update: " + roomsUpdated.length + " updated, " + roomsAdded.length + " added, " + roomsRemoved.length + " removed");
        this.onRoomList(rooms);
        this.updateRoomButtons();
    };
    DemoLoadBalancing.prototype.onRoomList = function (rooms) {
        var menu = document.getElementById("gamelist");
        while(menu.firstChild) {
            menu.removeChild(menu.firstChild);
        }
        var roomsPerRow = 4;
        var k = roomsPerRow;
        var row;
        for(var i = 0; i < rooms.length; ++i) {
            var r = rooms[i];
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
        cnt.innerText = rooms.length.toString();
        this.output("Demo: Rooms total: " + rooms.length);
        this.updateRoomButtons();
    };
    DemoLoadBalancing.prototype.onJoinRoom = function () {
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
        title.innerText = opponent ? ("Your opponent is " + opponent.name) : "Waiting for another player...";
    };
    DemoLoadBalancing.prototype.onActorJoin = function (actor) {
        if(this.isJoinedToRoom()) {
            var title = document.getElementsByTagName("h1")[0];
            title.innerText = "Your opponent is " + actor.name;
        }
        this.speak(actor.name + " joined");
    };
    DemoLoadBalancing.prototype.onActorLeave = function (actor) {
        if(this.isJoinedToRoom()) {
            var title = document.getElementsByTagName("h1")[0];
            title.innerText = "Waiting for another player...";
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
    DemoLoadBalancing.prototype.setupUI = function () {
        var _this = this;
        this.logger.info("Setting up UI.");
        var userlist = document.getElementById("userlist");
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
    DemoLoadBalancing.prototype.output = function (str, color) {
        console.log(str);
    };
    DemoLoadBalancing.prototype.updateRoomButtons = function () {
        var btn;
        btn = document.getElementById("newgamebtn");
        btn.disabled = !(this.isInLobby() && !this.isJoinedToRoom());
        var canJoin = this.isInLobby() && !this.isJoinedToRoom() && this.availableRooms().length > 0;
        btn = document.getElementById("joinrandomgamebtn");
        btn.disabled = !canJoin;
        btn = document.getElementById("leavebtn");
        btn.disabled = !(this.isJoinedToRoom());
    };
    return DemoLoadBalancing;
})(Photon.LoadBalancing.LoadBalancingClient);
var demo;
window.onload = function () {
    demo = new DemoLoadBalancing();
    demo.start();
};
