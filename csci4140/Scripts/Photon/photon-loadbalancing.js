var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Photon;
(function (Photon) {
    (function (LoadBalancing) {
        var Actor = (function () {
            function Actor(name, actorNr, isLocal) {
                this.name = name;
                this.actorNr = actorNr;
                this.isLocal = isLocal;
                this.customProperties = {
                };
            }
            Actor.prototype.getRoom = function () {
                return this.loadBalancingClient.myRoom();
            };
            Actor.prototype.raiseEvent = function (eventCode, data, options) {
                if(this.loadBalancingClient) {
                    this.loadBalancingClient.raiseEvent(eventCode, data, options);
                }
            };
            Actor.prototype.setName = function (name) {
                this.name = name;
            };
            Actor.prototype.onPropertiesChange = function (changedCustomProps) {
            };
            Actor.prototype.getCustomProperty = function (name) {
                return this.customProperties[name];
            };
            Actor.prototype.getCustomPropertyOrElse = function (name, defaultValue) {
                return Exitgames.Common.Util.getPropertyOrElse(this.customProperties, name, defaultValue);
            };
            Actor.prototype.setCustomProperty = function (name, value) {
                this.customProperties[name] = value;
                if(this.loadBalancingClient && this.loadBalancingClient.isJoinedToRoom()) {
                    var props = {
                    };
                    props[name] = value;
                    this.loadBalancingClient._setPropertiesOfActor(props);
                    this.onPropertiesChange(props);
                }
            };
            Actor.prototype._getAllProperties = function () {
                var p = {
                };
                p[LoadBalancing.Constants.ActorProperties.PlayerName] = this.name;
                for(var k in this.customProperties) {
                    p[k] = this.customProperties[k];
                }
                return p;
            };
            Actor.prototype._setLBC = function (lbc) {
                this.loadBalancingClient = lbc;
            };
            Actor.prototype._updateFromResponse = function (vals) {
                this.actorNr = vals[LoadBalancing.Constants.ParameterCode.ActorNr];
                var props = vals[LoadBalancing.Constants.ParameterCode.PlayerProperties];
                if(props !== undefined) {
                    var name = props[LoadBalancing.Constants.ActorProperties.PlayerName];
                    if(name !== undefined) {
                        this.name = name;
                    }
                    this._updateCustomProperties(props);
                }
            };
            Actor.prototype._updateMyActorFromResponse = function (vals) {
                this.actorNr = vals[LoadBalancing.Constants.ParameterCode.ActorNr];
            };
            Actor.prototype._updateCustomProperties = function (vals) {
                for(var p in vals) {
                    this.customProperties[p] = vals[p];
                }
                this.onPropertiesChange(vals);
            };
            Actor._getActorNrFromResponse = function _getActorNrFromResponse(vals) {
                return vals[LoadBalancing.Constants.ParameterCode.ActorNr];
            };
            return Actor;
        })();
        LoadBalancing.Actor = Actor;        
        var RoomInfo = (function () {
            function RoomInfo(name) {
                this.name = "";
                this.address = "";
                this.maxPlayers = 0;
                this.isVisible = true;
                this.isOpen = true;
                this.playerCount = 0;
                this.removed = false;
                this.cleanupCacheOnLeave = false;
                this._customProperties = {
                };
                this._propsListedInLobby = [];
                this.name = name;
            }
            RoomInfo.prototype.onPropertiesChange = function (changedCustomProps) {
            };
            RoomInfo.prototype.getCustomProperty = function (prop) {
                return this._customProperties[prop];
            };
            RoomInfo.prototype.getCustomPropertyOrElse = function (prop, defaultValue) {
                return Exitgames.Common.Util.getPropertyOrElse(this._customProperties, prop, defaultValue);
            };
            RoomInfo.prototype._updateFromMasterResponse = function (vals) {
                this.address = vals[LoadBalancing.Constants.ParameterCode.Address];
                var name = vals[LoadBalancing.Constants.ParameterCode.RoomName];
                if(name) {
                    this.name = name;
                }
            };
            RoomInfo.prototype._updateFromProps = function (props, customProps) {
                if (typeof customProps === "undefined") { customProps = null; }
                if(props) {
                    this.maxPlayers = this.updateIfExists(this.maxPlayers, LoadBalancing.Constants.GameProperties.MaxPlayers, props);
                    this.isVisible = this.updateIfExists(this.isVisible, LoadBalancing.Constants.GameProperties.IsVisible, props);
                    this.isOpen = this.updateIfExists(this.isOpen, LoadBalancing.Constants.GameProperties.IsOpen, props);
                    this.playerCount = this.updateIfExists(this.playerCount, LoadBalancing.Constants.GameProperties.PlayerCount, props);
                    this.removed = this.updateIfExists(this.removed, LoadBalancing.Constants.GameProperties.Removed, props);
                    this._propsListedInLobby = this.updateIfExists(this._propsListedInLobby, LoadBalancing.Constants.GameProperties.PropsListedInLobby, props);
                    this.cleanupCacheOnLeave = this.updateIfExists(this.cleanupCacheOnLeave, LoadBalancing.Constants.GameProperties.CleanupCacheOnLeave, props);
                    var changedProps = {
                    };
                    if(customProps === null) {
                        customProps = props;
                    }
                    for(var k in customProps) {
                        if(parseInt(k).toString() != k) {
                            if(this._customProperties[k] !== customProps[k]) {
                                this._customProperties[k] = customProps[k];
                                changedProps[k] = customProps[k];
                            }
                        }
                    }
                    this.onPropertiesChange(changedProps);
                }
            };
            RoomInfo.prototype.updateIfExists = function (prevValue, code, props) {
                if(props.hasOwnProperty(code)) {
                    return props[code];
                } else {
                    return prevValue;
                }
            };
            return RoomInfo;
        })();
        LoadBalancing.RoomInfo = RoomInfo;        
        var Room = (function (_super) {
            __extends(Room, _super);
            function Room(name) {
                        _super.call(this, name);
            }
            Room.prototype.setCustomProperty = function (name, value) {
                this._customProperties[name] = value;
                if(this.loadBalancingClient && this.loadBalancingClient.isJoinedToRoom()) {
                    var props = {
                    };
                    props[name] = value;
                    this.loadBalancingClient._setPropertiesOfRoom(props);
                }
                var cp = {
                };
                cp[name] = value;
                this.onPropertiesChange(cp);
            };
            Room.prototype.setProp = function (name, value) {
                if(this.loadBalancingClient && this.loadBalancingClient.isJoinedToRoom()) {
                    var props = {
                    };
                    props[name] = value;
                    this.loadBalancingClient._setPropertiesOfRoom(props);
                }
            };
            Room.prototype.setIsVisible = function (isVisible) {
                if(this.isVisible != isVisible) {
                    this.isVisible = isVisible;
                    this.setProp(LoadBalancing.Constants.GameProperties.IsVisible, isVisible);
                }
            };
            Room.prototype.setIsOpen = function (isOpen) {
                if(this.isOpen == !isOpen) {
                    this.isOpen = isOpen;
                    this.setProp(LoadBalancing.Constants.GameProperties.IsOpen, isOpen);
                }
            };
            Room.prototype.setMaxPlayers = function (maxPlayers) {
                if(this.maxPlayers != maxPlayers) {
                    this.maxPlayers = maxPlayers;
                    this.setProp(LoadBalancing.Constants.GameProperties.MaxPlayers, maxPlayers);
                }
            };
            Room.prototype.setPropsListedInLobby = function (props) {
                this._propsListedInLobby = props;
            };
            Room.prototype._setLBC = function (lbc) {
                this.loadBalancingClient = lbc;
            };
            return Room;
        })(RoomInfo);
        LoadBalancing.Room = Room;        
        var LoadBalancingClient = (function () {
            function LoadBalancingClient(masterServerAddress, appId, appVersion) {
                this.masterServerAddress = masterServerAddress;
                this.appId = appId;
                this.appVersion = appVersion;
                this.keepMasterConnection = false;
                this.reconnectPending = false;
                this.roomInfos = new Array();
                this.actors = {
                };
                this.state = LoadBalancingClient.State.Uninitialized;
                this.logger = new Exitgames.Common.Logger("LoadBalancingClient");
                this.validNextState = {
                };
                this.initValidNextState();
                this.currentRoom = this.roomFactoryInternal("");
                this._myActor = this.actorFactoryInternal("", -1, true);
                this.addActor(this._myActor);
            }
            LoadBalancingClient.prototype.onStateChange = function (state) {
            };
            LoadBalancingClient.prototype.onError = function (errorCode, errorMsg) {
                this.logger.error("Load Balancing Client Error", errorCode, errorMsg);
            };
            LoadBalancingClient.prototype.onOperationResponse = function (errorCode, errorMsg, code, content) {
            };
            LoadBalancingClient.prototype.onEvent = function (code, content, actorNr) {
            };
            LoadBalancingClient.prototype.onRoomList = function (rooms) {
            };
            LoadBalancingClient.prototype.onRoomListUpdate = function (rooms, roomsUpdated, roomsAdded, roomsRemoved) {
            };
            LoadBalancingClient.prototype.onMyRoomPropertiesChange = function () {
            };
            LoadBalancingClient.prototype.onActorPropertiesChange = function (actor) {
            };
            LoadBalancingClient.prototype.onJoinRoom = function () {
            };
            LoadBalancingClient.prototype.onActorJoin = function (actor) {
            };
            LoadBalancingClient.prototype.onActorLeave = function (actor) {
            };
            LoadBalancingClient.prototype.roomFactory = function (name) {
                return new Room(name);
            };
            LoadBalancingClient.prototype.actorFactory = function (name, actorNr, isLocal) {
                return new Actor(name, actorNr, isLocal);
            };
            LoadBalancingClient.prototype.myActor = function () {
                return this._myActor;
            };
            LoadBalancingClient.prototype.myRoom = function () {
                return this.currentRoom;
            };
            LoadBalancingClient.prototype.myRoomActors = function () {
                return this.actors;
            };
            LoadBalancingClient.prototype.roomFactoryInternal = function (name) {
                if (typeof name === "undefined") { name = ""; }
                var r = this.roomFactory(name);
                r._setLBC(this);
                return r;
            };
            LoadBalancingClient.prototype.actorFactoryInternal = function (name, actorId, isLocal) {
                if (typeof name === "undefined") { name = ""; }
                if (typeof actorId === "undefined") { actorId = -1; }
                if (typeof isLocal === "undefined") { isLocal = false; }
                var a = this.actorFactory(name, actorId, isLocal);
                a._setLBC(this);
                return a;
            };
            LoadBalancingClient.prototype.connect = function (keepMasterConnection) {
                if (typeof keepMasterConnection === "undefined") { keepMasterConnection = false; }
                this.reconnectPending = false;
                if(this.checkNextState(LoadBalancingClient.State.ConnectingToMasterserver)) {
                    this.changeState(LoadBalancingClient.State.ConnectingToMasterserver);
                    this.logger.info("Connecting to Master", this.masterServerAddress);
                    this.keepMasterConnection = keepMasterConnection;
                    this.masterPeer = new MasterPeer(this, "ws://" + this.masterServerAddress, "");
                    this.initMasterPeer(this.masterPeer);
                    this.masterPeer.connect();
                    return true;
                } else {
                    return false;
                }
            };
            LoadBalancingClient.prototype.createRoomFromMy = function (roomName) {
                this.currentRoom.name = roomName ? roomName : "";
                return this.createRoomInternal(this.masterPeer);
            };
            LoadBalancingClient.prototype.createRoom = function (roomName, isVisible, isOpen, maxPlayers, customGameProperties, propsListedInLobby) {
                if (typeof isVisible === "undefined") { isVisible = true; }
                if (typeof isOpen === "undefined") { isOpen = true; }
                if (typeof maxPlayers === "undefined") { maxPlayers = 0; }
                if (typeof customGameProperties === "undefined") { customGameProperties = {
                }; }
                this.currentRoom = this.roomFactoryInternal(roomName ? roomName : "");
                this.currentRoom.isVisible = isVisible;
                this.currentRoom.isOpen = isOpen;
                this.currentRoom.maxPlayers = maxPlayers;
                this.currentRoom._customProperties = customGameProperties ? customGameProperties : {
                };
                this.currentRoom._propsListedInLobby = propsListedInLobby ? propsListedInLobby : [];
                this.currentRoom.onPropertiesChange(customGameProperties);
                return this.createRoomInternal(this.masterPeer);
            };
            LoadBalancingClient.prototype.joinRoom = function (roomName) {
                var op = [];
                this.currentRoom = this.roomFactoryInternal(roomName);
                op.push(LoadBalancing.Constants.ParameterCode.RoomName);
                op.push(roomName);
                this.masterPeer.sendOperation(LoadBalancing.Constants.OperationCode.JoinGame, op);
                return true;
            };
            LoadBalancingClient.prototype.joinRandomRoom = function (expectedCustomRoomProperties, expectedMaxPlayers, matchingType) {
                if (typeof expectedMaxPlayers === "undefined") { expectedMaxPlayers = 0; }
                if (typeof matchingType === "undefined") { matchingType = LoadBalancing.Constants.MatchmakingMode.FillRoom; }
                var op = [];
                if(matchingType != LoadBalancing.Constants.MatchmakingMode.FillRoom) {
                    op.push(LoadBalancing.Constants.ParameterCode.MatchMakingType);
                    op.push(matchingType);
                }
                var expectedRoomProperties = {
                };
                var propNonEmpty = false;
                if(expectedCustomRoomProperties) {
                    for(var k in expectedCustomRoomProperties) {
                        expectedRoomProperties[k] = expectedCustomRoomProperties[k];
                        propNonEmpty = true;
                    }
                }
                if(expectedMaxPlayers > 0) {
                    expectedRoomProperties[LoadBalancing.Constants.GameProperties.MaxPlayers] = expectedMaxPlayers;
                    propNonEmpty = true;
                }
                if(propNonEmpty) {
                    op.push(LoadBalancing.Constants.ParameterCode.GameProperties);
                    op.push(expectedRoomProperties);
                }
                this.masterPeer.sendOperation(LoadBalancing.Constants.OperationCode.JoinRandomGame, op);
                return true;
            };
            LoadBalancingClient.prototype._setPropertiesOfRoom = function (properties) {
                var op = [];
                op.push(LoadBalancing.Constants.ParameterCode.Properties);
                op.push(properties);
                op.push(LoadBalancing.Constants.ParameterCode.Broadcast);
                op.push(true);
                this.gamePeer.sendOperation(LoadBalancing.Constants.OperationCode.SetProperties, op);
            };
            LoadBalancingClient.prototype._setPropertiesOfActor = function (properties) {
                var op = [];
                op.push(LoadBalancing.Constants.ParameterCode.ActorNr);
                op.push(this.myActor().actorNr);
                op.push(LoadBalancing.Constants.ParameterCode.Properties);
                op.push(properties);
                op.push(LoadBalancing.Constants.ParameterCode.Broadcast);
                op.push(true);
                this.gamePeer.sendOperation(LoadBalancing.Constants.OperationCode.SetProperties, op);
            };
            LoadBalancingClient.prototype.disconnect = function () {
                if(this.state != LoadBalancingClient.State.Uninitialized) {
                    if(this.masterPeer) {
                        this.masterPeer.disconnect();
                    }
                    if(this.gamePeer) {
                        this.gamePeer.disconnect();
                    }
                    this.changeState(LoadBalancingClient.State.Disconnecting);
                }
            };
            LoadBalancingClient.prototype.leaveRoom = function () {
                if(this.isJoinedToRoom()) {
                    if(this.gamePeer) {
                        this.reconnectPending = true;
                        this.gamePeer.disconnect();
                    }
                    this.changeState(LoadBalancingClient.State.Disconnecting);
                }
            };
            LoadBalancingClient.prototype.raiseEvent = function (eventCode, data, options) {
                if(this.isJoinedToRoom()) {
                    this.gamePeer.raiseEvent(eventCode, data, options);
                }
            };
            LoadBalancingClient.prototype.changeGroups = function (groupsToRemove, groupsToAdd) {
                if(this.isJoinedToRoom()) {
                    this.logger.debug("Group change:", groupsToRemove, groupsToAdd);
                    this.gamePeer.changeGroups(groupsToRemove, groupsToAdd);
                }
            };
            LoadBalancingClient.prototype.isConnectedToMaster = function () {
                return this.masterPeer && this.masterPeer.isConnected();
            };
            LoadBalancingClient.prototype.isInLobby = function () {
                return this.state == LoadBalancingClient.State.JoinedLobby;
            };
            LoadBalancingClient.prototype.isJoinedToRoom = function () {
                return this.state == LoadBalancingClient.State.Joined;
            };
            LoadBalancingClient.prototype.isConnectedToGame = function () {
                return this.isJoinedToRoom();
            };
            LoadBalancingClient.prototype.availableRooms = function () {
                return this.roomInfos;
            };
            LoadBalancingClient.prototype.setLogLevel = function (level) {
                this.logger.setLevel(level);
                if(this.masterPeer) {
                    this.masterPeer.setLogLevel(level);
                }
                if(this.gamePeer) {
                    this.gamePeer.setLogLevel(level);
                }
            };
            LoadBalancingClient.prototype.addActor = function (a) {
                this.actors[a.actorNr] = a;
            };
            LoadBalancingClient.prototype.changeState = function (nextState) {
                this.logger.info("State:", LoadBalancingClient.StateToName(this.state), "->", LoadBalancingClient.StateToName(nextState));
                this.state = nextState;
                this.onStateChange(nextState);
            };
            LoadBalancingClient.prototype.createRoomInternal = function (peer) {
                var gp = {
                };
                gp[LoadBalancing.Constants.GameProperties.IsOpen] = this.currentRoom.isOpen;
                gp[LoadBalancing.Constants.GameProperties.IsVisible] = this.currentRoom.isVisible;
                if(this.currentRoom.maxPlayers > 0) {
                    gp[LoadBalancing.Constants.GameProperties.MaxPlayers] = this.currentRoom.maxPlayers;
                }
                if(this.currentRoom._propsListedInLobby && this.currentRoom._propsListedInLobby.length > 0) {
                    gp[LoadBalancing.Constants.GameProperties.PropsListedInLobby] = this.currentRoom._propsListedInLobby;
                }
                for(var p in this.currentRoom._customProperties) {
                    gp[p] = this.currentRoom._customProperties[p];
                }
                var op = [];
                if(this.currentRoom.name) {
                    op.push(LoadBalancing.Constants.ParameterCode.RoomName);
                    op.push(this.currentRoom.name);
                }
                op.push(LoadBalancing.Constants.ParameterCode.GameProperties);
                op.push(gp);
                op.push(LoadBalancing.Constants.ParameterCode.CleanupCacheOnLeave);
                op.push(true);
                op.push(LoadBalancing.Constants.ParameterCode.Broadcast);
                op.push(true);
                if(peer === this.gamePeer) {
                    op.push(LoadBalancing.Constants.ParameterCode.PlayerProperties);
                    op.push(this._myActor._getAllProperties());
                }
                peer.sendOperation(LoadBalancing.Constants.OperationCode.CreateGame, op);
            };
            LoadBalancingClient.prototype.initMasterPeer = function (mp) {
                var _this = this;
                mp.setLogLevel(this.logger.getLevel());
                mp.addPeerStatusListener(Photon.PhotonPeer.StatusCodes.error, function () {
                    _this.changeState(LoadBalancingClient.State.Error);
                    _this.onError(LoadBalancingClient.PeerErrorCode.MasterError, "Master peer error");
                });
                mp.addPeerStatusListener(Photon.PhotonPeer.StatusCodes.connectFailed, function () {
                    _this.changeState(LoadBalancingClient.State.Error);
                    _this.onError(LoadBalancingClient.PeerErrorCode.MasterConnectFailed, "Master peer connect failed: " + _this.masterServerAddress);
                });
                mp.addPeerStatusListener(Photon.PhotonPeer.StatusCodes.timeout, function () {
                    _this.changeState(LoadBalancingClient.State.Error);
                    _this.onError(LoadBalancingClient.PeerErrorCode.MasterTimeout, "Master peer error timeout");
                });
                mp.addPeerStatusListener(Photon.PhotonPeer.StatusCodes.connecting, function () {
                });
                mp.addPeerStatusListener(Photon.PhotonPeer.StatusCodes.connect, function () {
                    mp._logger.info("Connected");
                    var op = [];
                    op.push(LoadBalancing.Constants.ParameterCode.ApplicationId);
                    op.push(_this.appId);
                    op.push(LoadBalancing.Constants.ParameterCode.AppVersion);
                    op.push(_this.appVersion);
                    mp.sendOperation(LoadBalancing.Constants.OperationCode.Authenticate, op);
                    mp._logger.info("Authenticate...");
                });
                mp.addPeerStatusListener(Photon.PhotonPeer.StatusCodes.disconnect, function () {
                    mp._logger.info("Disconnected");
                });
                mp.addPeerStatusListener(Photon.PhotonPeer.StatusCodes.connectClosed, function () {
                    mp._logger.info("Server closed connection");
                    _this.changeState(LoadBalancingClient.State.Error);
                    _this.onError(LoadBalancingClient.PeerErrorCode.MasterConnectClosed, "Master server closed connection");
                });
                mp.addEventListener(LoadBalancing.Constants.EventCode.GameList, function (data) {
                    var gameList = data.vals[LoadBalancing.Constants.ParameterCode.GameList];
                    _this.roomInfos = new Array();
                    for(var g in gameList) {
                        var r = new RoomInfo(g);
                        r._updateFromProps(gameList[g]);
                        _this.roomInfos.push(r);
                    }
                    _this.onRoomList(_this.roomInfos);
                    mp._logger.debug("ev GameList", _this.roomInfos, gameList);
                });
                mp.addEventListener(LoadBalancing.Constants.EventCode.GameListUpdate, function (data) {
                    var gameList = data.vals[LoadBalancing.Constants.ParameterCode.GameList];
                    var roomsUpdated = new Array();
                    var roomsAdded = new Array();
                    var roomsRemoved = new Array();
                    for(var g in gameList) {
                        var exist = _this.roomInfos.filter(function (x) {
                            return x.name == g;
                        });
                        if(exist.length > 0) {
                            var r = exist[0];
                            r._updateFromProps(gameList[g]);
                            if(r.removed) {
                                roomsRemoved.push(r);
                            } else {
                                roomsUpdated.push(r);
                            }
                        } else {
                            var r = new RoomInfo(g);
                            r._updateFromProps(gameList[g]);
                            _this.roomInfos.push(r);
                            roomsAdded.push(r);
                        }
                    }
                    _this.roomInfos = _this.roomInfos.filter(function (x) {
                        return !x.removed;
                    });
                    _this.onRoomListUpdate(_this.roomInfos, roomsUpdated, roomsAdded, roomsRemoved);
                    mp._logger.debug("ev GameListUpdate:", _this.roomInfos, "u:", roomsUpdated, "a:", roomsAdded, "r:", roomsRemoved, gameList);
                });
                mp.addResponseListener(LoadBalancing.Constants.OperationCode.Authenticate, function (data) {
                    mp._logger.debug("resp Authenticate", data);
                    if(!data.errCode) {
                        mp._logger.info("Authenticated");
                        _this.changeState(LoadBalancingClient.State.ConnectedToMaster);
                        mp.sendOperation(LoadBalancing.Constants.OperationCode.JoinLobby);
                        mp._logger.info("Join Lobby...");
                    } else {
                        _this.changeState(LoadBalancingClient.State.Error);
                        _this.onError(LoadBalancingClient.PeerErrorCode.MasterAuthenticationFailed, "Master authentication failed");
                    }
                });
                mp.addResponseListener(LoadBalancing.Constants.OperationCode.JoinLobby, function (data) {
                    mp._logger.debug("resp JoinLobby", data);
                    if(!data.errCode) {
                        mp._logger.info("Joined to Lobby");
                        _this.changeState(LoadBalancingClient.State.JoinedLobby);
                    }
                    _this._onOperationResponseInternal2(LoadBalancing.Constants.OperationCode.JoinLobby, data);
                });
                mp.addResponseListener(LoadBalancing.Constants.OperationCode.CreateGame, function (data) {
                    mp._logger.debug("resp CreateGame", data);
                    if(!data.errCode) {
                        _this.currentRoom._updateFromMasterResponse(data.vals);
                        mp._logger.debug("Created/Joined " + _this.currentRoom.name);
                        _this.connectToGameServer(true);
                    }
                    _this._onOperationResponseInternal2(LoadBalancing.Constants.OperationCode.CreateGame, data);
                });
                mp.addResponseListener(LoadBalancing.Constants.OperationCode.JoinGame, function (data) {
                    mp._logger.debug("resp JoinGame", data);
                    if(!data.errCode) {
                        _this.currentRoom._updateFromMasterResponse(data.vals);
                        mp._logger.debug("Joined " + _this.currentRoom.name);
                        _this.connectToGameServer(false);
                    }
                    _this._onOperationResponseInternal2(LoadBalancing.Constants.OperationCode.JoinGame, data);
                });
                mp.addResponseListener(LoadBalancing.Constants.OperationCode.JoinRandomGame, function (data) {
                    mp._logger.debug("resp JoinRandomGame", data);
                    if(!data.errCode) {
                        _this.currentRoom._updateFromMasterResponse(data.vals);
                        mp._logger.debug("Joined " + _this.currentRoom.name);
                        _this.connectToGameServer(false);
                    }
                    _this._onOperationResponseInternal2(LoadBalancing.Constants.OperationCode.JoinRandomGame, data);
                });
            };
            LoadBalancingClient.prototype.connectToGameServer = function (createGame) {
                if(!this.keepMasterConnection) {
                    this.masterPeer.disconnect();
                }
                if(this.checkNextState(LoadBalancingClient.State.ConnectingToGameserver)) {
                    this.logger.info("Connecting to Game", this.currentRoom.address);
                    this.gamePeer = new GamePeer(this, "ws://" + this.currentRoom.address, "");
                    this.initGamePeer(this.gamePeer, createGame);
                    if(!this.keepMasterConnection) {
                        this.masterPeer.disconnect();
                    }
                    this.gamePeer.connect();
                    this.changeState(LoadBalancingClient.State.ConnectingToGameserver);
                    return true;
                } else {
                    return false;
                }
            };
            LoadBalancingClient.prototype.initGamePeer = function (gp, createGame) {
                var _this = this;
                gp.setLogLevel(this.logger.getLevel());
                gp.addPeerStatusListener(Photon.PhotonPeer.StatusCodes.error, function () {
                    _this.changeState(LoadBalancingClient.State.Error);
                    _this.onError(LoadBalancingClient.PeerErrorCode.GameError, "Game peer error");
                });
                gp.addPeerStatusListener(Photon.PhotonPeer.StatusCodes.connectFailed, function () {
                    _this.changeState(LoadBalancingClient.State.Error);
                    _this.onError(LoadBalancingClient.PeerErrorCode.GameConnectFailed, "Game peer connect failed: " + _this.currentRoom.address);
                });
                gp.addPeerStatusListener(Photon.PhotonPeer.StatusCodes.timeout, function () {
                    _this.changeState(LoadBalancingClient.State.Error);
                    _this.onError(LoadBalancingClient.PeerErrorCode.GameTimeout, "Game peer timeout");
                });
                gp.addPeerStatusListener(Photon.PhotonPeer.StatusCodes.connect, function () {
                    gp._logger.info("Connected");
                    var op = [];
                    op.push(LoadBalancing.Constants.ParameterCode.ApplicationId);
                    op.push(_this.appId);
                    op.push(LoadBalancing.Constants.ParameterCode.AppVersion);
                    op.push(_this.appVersion);
                    gp.sendOperation(LoadBalancing.Constants.OperationCode.Authenticate, op);
                    gp._logger.info("Authenticate...");
                });
                gp.addPeerStatusListener(Photon.PhotonPeer.StatusCodes.disconnect, function () {
                    for(var i in _this.actors) {
                        _this.onActorLeave(_this.actors[i]);
                    }
                    _this.actors = {
                    };
                    _this.addActor(_this._myActor);
                    gp._logger.info("Disconnected");
                    if(_this.masterPeer && _this.masterPeer.isConnected()) {
                        _this.changeState(LoadBalancingClient.State.JoinedLobby);
                    } else {
                        _this.changeState(LoadBalancingClient.State.Disconnected);
                        if(_this.reconnectPending) {
                            _this.connect(_this.keepMasterConnection);
                        }
                    }
                });
                gp.addPeerStatusListener(Photon.PhotonPeer.StatusCodes.connectClosed, function () {
                    gp._logger.info("Server closed connection");
                    _this.changeState(LoadBalancingClient.State.Error);
                    _this.onError(LoadBalancingClient.PeerErrorCode.MasterConnectClosed, "Game server closed connection");
                });
                gp.addResponseListener(LoadBalancing.Constants.OperationCode.Authenticate, function (data) {
                    gp._logger.debug("resp Authenticate", data);
                    if(!data.errCode) {
                        gp._logger.info("Authenticated");
                        gp._logger.info("Connected");
                        if(createGame) {
                            _this.createRoomInternal(gp);
                        } else {
                            var op = [];
                            op.push(LoadBalancing.Constants.ParameterCode.RoomName);
                            op.push(_this.currentRoom.name);
                            op.push(LoadBalancing.Constants.ParameterCode.Broadcast);
                            op.push(true);
                            op.push(LoadBalancing.Constants.ParameterCode.PlayerProperties);
                            op.push(_this._myActor._getAllProperties());
                            gp.sendOperation(LoadBalancing.Constants.OperationCode.JoinGame, op);
                        }
                        _this.changeState(LoadBalancingClient.State.ConnectedToGameserver);
                    } else {
                        _this.changeState(LoadBalancingClient.State.Error);
                        _this.onError(LoadBalancingClient.PeerErrorCode.GameAuthenticationFailed, "Game authentication failed");
                    }
                });
                gp.addResponseListener(LoadBalancing.Constants.OperationCode.CreateGame, function (data) {
                    gp._logger.debug("resp CreateGame", data);
                    if(!data.errCode) {
                        _this._myActor._updateMyActorFromResponse(data.vals);
                        gp._logger.info("myActor: ", _this._myActor);
                        _this.actors = {
                        };
                        _this.addActor(_this._myActor);
                        _this.changeState(LoadBalancingClient.State.Joined);
                        _this.onJoinRoom();
                    }
                    _this._onOperationResponseInternal2(LoadBalancing.Constants.OperationCode.CreateGame, data);
                });
                gp.addResponseListener(LoadBalancing.Constants.OperationCode.JoinGame, function (data) {
                    gp._logger.debug("resp JoinGame", data);
                    if(!data.errCode) {
                        _this._myActor._updateMyActorFromResponse(data.vals);
                        gp._logger.info("myActor: ", _this._myActor);
                        _this.currentRoom._updateFromProps(data.vals[LoadBalancing.Constants.ParameterCode.GameProperties]);
                        _this.actors = {
                        };
                        _this.addActor(_this._myActor);
                        var actorList = data.vals[LoadBalancing.Constants.ParameterCode.PlayerProperties];
                        for(var k in actorList) {
                            var a = _this.actorFactoryInternal(actorList[k][LoadBalancing.Constants.ActorProperties.PlayerName], parseInt(k));
                            a._updateCustomProperties(actorList[k]);
                            _this.addActor(a);
                        }
                        _this.changeState(LoadBalancingClient.State.Joined);
                        _this.onJoinRoom();
                    }
                    _this._onOperationResponseInternal2(LoadBalancing.Constants.OperationCode.JoinGame, data);
                });
                gp.addResponseListener(LoadBalancing.Constants.OperationCode.SetProperties, function (data) {
                    gp._logger.debug("resp SetProperties", data);
                    _this._onOperationResponseInternal2(LoadBalancing.Constants.OperationCode.SetProperties, data);
                });
                gp.addEventListener(LoadBalancing.Constants.EventCode.Join, function (data) {
                    gp._logger.debug("ev Join", data);
                    if(Actor._getActorNrFromResponse(data.vals) === _this._myActor.actorNr) {
                        _this._myActor._updateMyActorFromResponse(data.vals);
                        _this.addActor(_this._myActor);
                    } else {
                        var actor = _this.actorFactoryInternal();
                        actor._updateFromResponse(data.vals);
                        _this.addActor(actor);
                        _this.onActorJoin(actor);
                    }
                });
                gp.addEventListener(LoadBalancing.Constants.EventCode.Leave, function (data) {
                    gp._logger.debug("ev Leave", data);
                    var actorNr = Actor._getActorNrFromResponse(data.vals);
                    if(actorNr && _this.actors[actorNr]) {
                        var a = _this.actors[actorNr];
                        delete _this.actors[actorNr];
                        _this.onActorLeave(a);
                    }
                });
                gp.addEventListener(LoadBalancing.Constants.EventCode.PropertiesChanged, function (data) {
                    gp._logger.debug("ev PropertiesChanged", data);
                    var targetActorNr = data.vals[LoadBalancing.Constants.ParameterCode.TargetActorNr];
                    if(targetActorNr !== undefined && targetActorNr > 0) {
                        if(_this.actors[targetActorNr] !== undefined) {
                            var actor = _this.actors[targetActorNr];
                            actor._updateCustomProperties(data.vals[LoadBalancing.Constants.ParameterCode.Properties]);
                            _this.onActorPropertiesChange(actor);
                        }
                    } else {
                        _this.currentRoom._updateFromProps(data.vals, data.vals[LoadBalancing.Constants.ParameterCode.Properties]);
                        _this.onMyRoomPropertiesChange();
                    }
                });
            };
            LoadBalancingClient.prototype._onOperationResponseInternal2 = function (code, data) {
                this.onOperationResponse(data.errCode, data.errMsg, code, data.vals);
            };
            LoadBalancingClient.prototype.initValidNextState = function () {
                this.validNextState[LoadBalancingClient.State.Error] = [
                    LoadBalancingClient.State.ConnectingToMasterserver
                ];
                this.validNextState[LoadBalancingClient.State.Uninitialized] = [
                    LoadBalancingClient.State.ConnectingToMasterserver
                ];
                this.validNextState[LoadBalancingClient.State.Disconnected] = [
                    LoadBalancingClient.State.ConnectingToMasterserver
                ];
                this.validNextState[LoadBalancingClient.State.ConnectedToMaster] = [
                    LoadBalancingClient.State.JoinedLobby
                ];
                this.validNextState[LoadBalancingClient.State.JoinedLobby] = [
                    LoadBalancingClient.State.ConnectingToGameserver
                ];
                this.validNextState[LoadBalancingClient.State.ConnectingToGameserver] = [
                    LoadBalancingClient.State.ConnectedToGameserver
                ];
                this.validNextState[LoadBalancingClient.State.ConnectedToGameserver] = [
                    LoadBalancingClient.State.Joined
                ];
            };
            LoadBalancingClient.prototype.checkNextState = function (nextState, dontThrow) {
                if (typeof dontThrow === "undefined") { dontThrow = false; }
                var valid = this.validNextState[this.state];
                var res = valid && valid.indexOf(nextState) >= 0;
                if(res || dontThrow) {
                    return res;
                } else {
                    throw new Error("LoadBalancingPeer checkNextState fail: " + LoadBalancingClient.StateToName(this.state) + " -> " + LoadBalancingClient.StateToName(nextState));
                }
            };
            LoadBalancingClient.PeerErrorCode = {
                Ok: 0,
                MasterError: 1001,
                MasterConnectFailed: 1002,
                MasterConnectClosed: 1003,
                MasterTimeout: 1004,
                MasterAuthenticationFailed: 1101,
                GameError: 2001,
                GameConnectFailed: 2002,
                GameConnectClosed: 2003,
                GameTimeout: 2004,
                GameAuthenticationFailed: 2101
            };
            LoadBalancingClient.State = {
                Error: -1,
                Uninitialized: 0,
                ConnectingToMasterserver: 1,
                ConnectedToMaster: 2,
                JoinedLobby: 3,
                ConnectingToGameserver: 4,
                ConnectedToGameserver: 5,
                Joined: 6,
                Disconnecting: 7,
                Disconnected: 8
            };
            LoadBalancingClient.StateToName = function StateToName(value) {
                return Exitgames.Common.Util.enumValueToName(LoadBalancingClient.State, value);
            };
            return LoadBalancingClient;
        })();
        LoadBalancing.LoadBalancingClient = LoadBalancingClient;        
        var MasterPeer = (function (_super) {
            __extends(MasterPeer, _super);
            function MasterPeer(client, url, subprotocol) {
                        _super.call(this, url, subprotocol, "Master");
                this.client = client;
            }
            MasterPeer.prototype.onUnhandledEvent = function (code, args) {
                this.client.onEvent(code, args.vals[LoadBalancing.Constants.ParameterCode.CustomEventContent], args.vals[LoadBalancing.Constants.ParameterCode.ActorNr]);
            };
            MasterPeer.prototype.onUnhandledResponse = function (code, args) {
                this.client.onOperationResponse(args.errCode, args.errMsg, code, args.vals);
            };
            return MasterPeer;
        })(Photon.PhotonPeer);
        LoadBalancing.MasterPeer = MasterPeer;        
        var GamePeer = (function (_super) {
            __extends(GamePeer, _super);
            function GamePeer(client, url, subprotocol) {
                        _super.call(this, url, subprotocol, "Game");
                this.client = client;
            }
            GamePeer.prototype.onUnhandledEvent = function (code, args) {
                this.client.onEvent(code, args.vals[LoadBalancing.Constants.ParameterCode.CustomEventContent], args.vals[LoadBalancing.Constants.ParameterCode.ActorNr]);
            };
            GamePeer.prototype.onUnhandledResponse = function (code, args) {
                this.client.onOperationResponse(args.errCode, args.errMsg, code, args.vals);
            };
            GamePeer.prototype.raiseEvent = function (eventCode, data, options) {
                if(this.client.isJoinedToRoom()) {
                    this._logger.debug("raiseEvent", eventCode, data, options);
                    var params = [
                        LoadBalancing.Constants.ParameterCode.Code, 
                        eventCode, 
                        LoadBalancing.Constants.ParameterCode.Data, 
                        data
                    ];
                    if(options) {
                        if(options.receivers != undefined && options.receivers !== LoadBalancing.Constants.ReceiverGroup.Others) {
                            params.push(LoadBalancing.Constants.ParameterCode.ReceiverGroup);
                            params.push(options.receivers);
                        }
                        if(options.cache != undefined && options.cache !== LoadBalancing.Constants.EventCaching.DoNotCache) {
                            params.push(LoadBalancing.Constants.ParameterCode.Cache);
                            params.push(options.cache);
                        }
                        if(options.interestGroup != undefined) {
                            if(this.checkGroupNumber(options.interestGroup)) {
                                params.push(LoadBalancing.Constants.ParameterCode.Group);
                                params.push(options.interestGroup);
                            } else {
                                throw new Error("raiseEvent - Group not a number: " + options.interestGroup);
                            }
                        }
                    }
                    this.sendOperation(LoadBalancing.Constants.OperationCode.RaiseEvent, params);
                } else {
                    throw new Error("raiseEvent - Not joined!");
                }
            };
            GamePeer.prototype.changeGroups = function (groupsToRemove, groupsToAdd) {
                var params = [];
                if(groupsToRemove != null && groupsToRemove != undefined) {
                    this.checkGroupArray(groupsToRemove, "groupsToRemove");
                    params.push(LoadBalancing.Constants.ParameterCode.Remove);
                    params.push(groupsToRemove);
                }
                if(groupsToAdd != null && groupsToAdd != undefined) {
                    this.checkGroupArray(groupsToAdd, "groupsToAdd");
                    params.push(LoadBalancing.Constants.ParameterCode.Add);
                    params.push(groupsToAdd);
                }
                this.sendOperation(LoadBalancing.Constants.OperationCode.ChangeGroups, params);
            };
            GamePeer.prototype.checkGroupNumber = function (g) {
                return !(typeof (g) != "number" || isNaN(g) || g === Infinity || g === -Infinity);
            };
            GamePeer.prototype.checkGroupArray = function (groups, groupsName) {
                if(Exitgames.Common.Util.isArray(groups)) {
                    for(var i = 0; i < groups.length; ++i) {
                        var g = groups[i];
                        if(this.checkGroupNumber(g)) {
                        } else {
                            throw new Error("changeGroups - " + groupsName + " (" + groups + ") not an array of numbers: element " + i + " = " + g);
                        }
                    }
                } else {
                    throw new Error("changeGroups - groupsToRemove not an array: " + groups);
                }
            };
            return GamePeer;
        })(Photon.PhotonPeer);
        LoadBalancing.GamePeer = GamePeer;        
    })(Photon.LoadBalancing || (Photon.LoadBalancing = {}));
    var LoadBalancing = Photon.LoadBalancing;
})(Photon || (Photon = {}));
