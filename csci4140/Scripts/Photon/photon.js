var Photon;
(function (Photon) {
    var PhotonPeer = (function () {
        function PhotonPeer(url, subprotocol, debugName) {
            if (typeof subprotocol === "undefined") { subprotocol = ""; }
            if (typeof debugName === "undefined") { debugName = ""; }
            this.url = url;
            this.subprotocol = subprotocol;
            this.keepAliveTimeoutMs = 5000;
            this._frame = "~m~";
            this._isConnecting = false;
            this._isConnected = false;
            this._isClosing = false;
            this._peerStatusListeners = {
            };
            this._eventListeners = {
            };
            this._responseListeners = {
            };
            this.keepAliveTimer = 0;
            this._logger = new Exitgames.Common.Logger(debugName && debugName != "" ? debugName + ": " : "");
        }
        PhotonPeer.prototype.isConnecting = function () {
            return this._isConnecting;
        };
        PhotonPeer.prototype.isConnected = function () {
            return this._isConnected;
        };
        PhotonPeer.prototype.isClosing = function () {
            return this._isClosing;
        };
        PhotonPeer.prototype.connect = function () {
            var _this = this;
            if(this.subprotocol == "") {
                this._socket = new WebSocket(this.url);
            } else {
                this._socket = new WebSocket(this.url, this.subprotocol);
            }
            this._onConnecting();
            this._socket.onopen = function (ev) {
            };
            this._socket.onmessage = function (ev) {
                var message = _this._decode(ev.data);
                _this._onMessage(message.toString());
            };
            this._socket.onclose = function (ev) {
                _this._logger.debug("onclose: wasClean =", ev.wasClean, ", code=", ev.code, ", reason =", ev.reason);
                if(_this._isConnecting) {
                    _this._onConnectFailed(ev);
                } else {
                    if(1006 == ev.code) {
                        _this._onTimeout();
                    }
                    _this._onDisconnect();
                }
            };
            this._socket.onerror = function (ev) {
                _this._onError(ev);
            };
        };
        PhotonPeer.prototype.disconnect = function () {
            this._isClosing = true;
            this._socket.close();
        };
        PhotonPeer.prototype.sendOperation = function (code, data, sendReliable, channelId) {
            if (typeof sendReliable === "undefined") { sendReliable = false; }
            if (typeof channelId === "undefined") { channelId = 0; }
            var sndJSON = {
                req: code,
                vals: []
            };
            if(Exitgames.Common.Util.isArray(data)) {
                sndJSON.vals = data;
            } else {
                if(data === undefined) {
                    sndJSON.vals = [];
                } else {
                    throw new Error(this._logger.format("PhotonPeer[sendOperation] - Trying to send non array data:", data));
                }
            }
            this._send(sndJSON);
            this._logger.debug("PhotonPeer[sendOperation] - Sending request:", sndJSON);
        };
        PhotonPeer.prototype.addPeerStatusListener = function (statusCode, callback) {
            this._addListener(this._peerStatusListeners, statusCode, callback);
        };
        PhotonPeer.prototype.addEventListener = function (eventCode, callback) {
            this._addListener(this._eventListeners, eventCode.toString(), callback);
        };
        PhotonPeer.prototype.addResponseListener = function (operationCode, callback) {
            this._addListener(this._responseListeners, operationCode.toString(), callback);
        };
        PhotonPeer.prototype.removePeerStatusListener = function (statusCode, callback) {
            this._removeListener(this._peerStatusListeners, statusCode, callback);
        };
        PhotonPeer.prototype.removeEventListener = function (eventCode, callback) {
            this._removeListener(this._eventListeners, eventCode.toString(), callback);
        };
        PhotonPeer.prototype.removeResponseListener = function (operationCode, callback) {
            this._removeListener(this._responseListeners, operationCode.toString(), callback);
        };
        PhotonPeer.prototype.removePeerStatusListenersForCode = function (statusCode) {
            this._removeListenersForCode(this._peerStatusListeners, statusCode);
        };
        PhotonPeer.prototype.removeEventListenersForCode = function (eventCode) {
            this._removeListenersForCode(this._eventListeners, eventCode.toString());
        };
        PhotonPeer.prototype.removeResponseListenersForCode = function (operationCode) {
            this._removeListenersForCode(this._responseListeners, operationCode.toString());
        };
        PhotonPeer.prototype.setLogLevel = function (level) {
            this._logger.setLevel(level);
        };
        PhotonPeer.prototype.onUnhandledEvent = function (eventCode, args) {
            this._logger.warn('PhotonPeer: No handler for event', eventCode, 'registered.');
        };
        PhotonPeer.prototype.onUnhandledResponse = function (operationCode, args) {
            this._logger.warn('PhotonPeer: No handler for response', operationCode, 'registered.');
        };
        PhotonPeer.StatusCodes = {
            connecting: "connecting",
            connect: "connect",
            connectFailed: "connectFailed",
            disconnect: "disconnect",
            connectClosed: "connectClosed",
            error: "error",
            timeout: "timeout"
        };
        PhotonPeer.prototype._dispatchEvent = function (code, args) {
            if(!this._dispatch(this._eventListeners, code.toString(), args, "event")) {
                this.onUnhandledEvent(code, args);
            }
        };
        PhotonPeer.prototype._dispatchResponse = function (code, args) {
            if(!this._dispatch(this._responseListeners, code.toString(), args, "response")) {
                this.onUnhandledResponse(code, args);
            }
        };
        PhotonPeer.prototype._stringify = function (message) {
            if(Object.prototype.toString.call(message) == "[object Object]") {
                if(!JSON) {
                    throw new Error("PhotonPeer[_stringify] - Trying to encode as JSON, but JSON.stringify is missing.");
                }
                return "~j~" + JSON.stringify(message);
            } else {
                return String(message);
            }
        };
        PhotonPeer.prototype._encode = function (messages) {
            var ret = "", message, messages = Exitgames.Common.Util.isArray(messages) ? messages : [
                messages
            ];
            for(var i = 0, l = messages.length; i < l; i++) {
                message = messages[i] === null || messages[i] === undefined ? "" : this._stringify(messages[i]);
                ret += this._frame + message.length + this._frame + message;
            }
            return ret;
        };
        PhotonPeer.prototype._decode = function (data) {
            var messages = [], number, n, newdata = data;
            var nulIndex = data.indexOf("\x00");
            if(nulIndex !== -1) {
                newdata = data.replace(/[\0]/g, "");
            }
            data = newdata;
            do {
                if(data.substr(0, 3) !== this._frame) {
                    return messages;
                }
                data = data.substr(3);
                number = "" , n = "";
                for(var i = 0, l = data.length; i < l; i++) {
                    n = Number(data.substr(i, 1));
                    if(data.substr(i, 1) == n) {
                        number += n;
                    } else {
                        data = data.substr(number.length + this._frame.length);
                        number = Number(number);
                        break;
                    }
                }
                messages.push(data.substr(0, number));
                data = data.substr(number);
            }while(data !== "");
            return messages;
        };
        PhotonPeer.prototype._onMessage = function (message) {
            if(message.substr(0, 3) == "~j~") {
                this._onMessageReceived(JSON.parse(message.substr(3)));
            } else {
                if(!this._sessionid) {
                    this._sessionid = message;
                    this._onConnect();
                } else {
                    this._onMessageReceived(message);
                }
            }
        };
        PhotonPeer.prototype.resetKeepAlive = function () {
            var _this = this;
            clearTimeout(this.keepAliveTimer);
            if(this.keepAliveTimeoutMs >= 1000) {
                this.keepAliveTimer = setTimeout(function () {
                    return _this._send({
                        irq: 1,
                        vals: [
                            1, 
                            Date.now()
                        ]
                    }, true);
                }, this.keepAliveTimeoutMs);
            }
        };
        PhotonPeer.prototype._send = function (data, checkConnected) {
            if (typeof checkConnected === "undefined") { checkConnected = false; }
            var message = this._encode(data);
            if(this._isConnected && !this._isClosing) {
                this.resetKeepAlive();
                this._socket.send(message);
            } else {
                if(!checkConnected) {
                    throw new Error(this._logger.format('PhotonPeer[_send] - Operation', data.req, '- failed, "isConnected" is', this._isConnected, ', "isClosing" is', this._isClosing, "!"));
                }
            }
        };
        PhotonPeer.prototype._onMessageReceived = function (message) {
            if(typeof message === "object") {
                this._logger.debug("PhotonPeer[_onMessageReceived] - Socket received message:", message);
                var msgJSON = message;
                var msgErr = msgJSON.err ? msgJSON.err : 0;
                msgJSON.vals = msgJSON.vals !== undefined ? msgJSON.vals : [];
                if(msgJSON.vals.length > 0) {
                    msgJSON.vals = this._parseMessageValuesArrayToJSON(msgJSON.vals);
                }
                if(msgJSON.res !== undefined) {
                    var code = parseInt(msgJSON.res);
                    this._parseResponse(code, msgJSON);
                } else {
                    if(msgJSON.evt !== undefined) {
                        var code = parseInt(msgJSON.evt);
                        this._parseEvent(code, msgJSON);
                    } else {
                        if(msgJSON.irs !== undefined) {
                            var code = parseInt(msgJSON.irs);
                            this._parseInternalResponse(code, msgJSON);
                        } else {
                            throw new Error(this._logger.format("PhotonPeer[_onMessageReceived] - Received undefined message type:", msgJSON));
                        }
                    }
                }
            }
        };
        PhotonPeer.prototype._parseMessageValuesArrayToJSON = function (vals) {
            var parsedJSON = {
            };
            if(Exitgames.Common.Util.isArray(vals)) {
                if(vals.length % 2 == 0) {
                    var toParse = vals, key, value;
                    while(toParse.length > 0) {
                        key = toParse.shift() + "";
                        value = toParse.shift();
                        parsedJSON[key] = value;
                    }
                } else {
                    throw new Error(this._logger.format("PhotonPeer[_parseMessageValuesToJSON] - Received invalid values array:", vals));
                }
            }
            return parsedJSON;
        };
        PhotonPeer.prototype._parseEvent = function (code, event) {
            switch(code) {
                default:
                    this._dispatchEvent(code, {
                        vals: event.vals
                    });
                    break;
            }
        };
        PhotonPeer.prototype._parseResponse = function (code, response) {
            switch(code) {
                default:
                    this._dispatchResponse(code, {
                        errCode: response.err,
                        errMsg: response.msg,
                        vals: response.vals
                    });
                    break;
            }
        };
        PhotonPeer.prototype._parseInternalResponse = function (code, response) {
            this._logger.debug("internal response:", response);
        };
        PhotonPeer.prototype._onConnecting = function () {
            this._logger.debug("PhotonPeer[_onConnecting] - Starts connecting", this.url, '..., raising "connecting" event ...');
            this._isConnecting = true;
            this._dispatchPeerStatus(PhotonPeer.StatusCodes.connecting);
        };
        PhotonPeer.prototype._onConnect = function () {
            this._logger.debug('PhotonPeer[_onConnect] - Connected successfully! Raising "connect" event ...');
            this._isConnecting = false;
            this._isConnected = true;
            this._dispatchPeerStatus(PhotonPeer.StatusCodes.connect);
        };
        PhotonPeer.prototype._onConnectFailed = function (evt) {
            this._logger.error('PhotonPeer[_onConnectFailed] - Socket connection could not be created:', this.url, this.subprotocol, 'Wrong host or port?\n Raising "connectFailed event ...');
            this._isConnecting = this._isConnected = false;
            this._dispatchPeerStatus(PhotonPeer.StatusCodes.connectFailed);
        };
        PhotonPeer.prototype._onDisconnect = function () {
            var wasConnected = this._isConnected;
            var wasClosing = this._isClosing;
            this._logger.debug('PhotonPeer[_onDisconnect] - Socket closed, raising "disconnect" event ...');
            this._isClosing = this._isConnected = this._isConnecting = false;
            if(wasConnected) {
                if(wasClosing) {
                    this._dispatchPeerStatus(PhotonPeer.StatusCodes.disconnect);
                } else {
                    this._dispatchPeerStatus(PhotonPeer.StatusCodes.connectClosed);
                }
            }
        };
        PhotonPeer.prototype._onTimeout = function () {
            this._logger.debug('PhotonPeer[_onTimeout] - Client timed out! Raising "timeout" event ...');
            this._dispatchPeerStatus(PhotonPeer.StatusCodes.timeout);
        };
        PhotonPeer.prototype._onError = function (ev) {
            this._logger.error("PhotonPeer[_onError] - Connection error:", arguments[0]);
            this._isConnecting = this._isConnected = this._isClosing = false;
            this._dispatchPeerStatus(PhotonPeer.StatusCodes.error);
        };
        PhotonPeer.prototype._addListener = function (listeners, code, callback) {
            if(!(code in listeners)) {
                listeners[code] = [];
            }
            if(callback && typeof callback === "function") {
                this._logger.debug('PhotonPeer[_addListener] - Adding listener for event', code);
                listeners[code].push(callback);
            } else {
                this._logger.error('PhotonPeer[_addListener] - Listener', code, 'is not a function but of type', typeof callback, '. No listener added!');
            }
            return this;
        };
        PhotonPeer.prototype._dispatch = function (listeners, code, args, debugType) {
            if(code in listeners) {
                var events = listeners[code];
                for(var i = 0, l = events.length; i < l; i++) {
                    if(!Exitgames.Common.Util.isArray(args)) {
                        args = [
                            args
                        ];
                    }
                    events[i].apply(this, args === undefined ? [] : args);
                }
                return true;
            } else {
                return false;
            }
        };
        PhotonPeer.prototype._dispatchPeerStatus = function (code) {
            if(!this._dispatch(this._peerStatusListeners, code, undefined, "peerStatus")) {
                this._logger.warn('PhotonPeer[_dispatchPeerStatus] - No handler for ', code, 'registered.');
            }
        };
        PhotonPeer.prototype._removeListener = function (listeners, code, callback) {
            if((code in listeners)) {
                var prevLenght = listeners[code].length;
                listeners[code] = listeners[code].filter(function (x) {
                    return x != callback;
                });
                this._logger.debug('PhotonPeer[_removeListener] - Removing listener for event', code, "removed:", prevLenght - listeners[code].length);
            }
            return this;
        };
        PhotonPeer.prototype._removeListenersForCode = function (listeners, code) {
            this._logger.debug('PhotonPeer[_removeListenersForCode] - Removing all listeners for event', code);
            if(code in listeners) {
                listeners[code] = [];
            }
            return this;
        };
        return PhotonPeer;
    })();
    Photon.PhotonPeer = PhotonPeer;    
})(Photon || (Photon = {}));
var Exitgames;
(function (Exitgames) {
    (function (Common) {
        var Logger = (function () {
            function Logger(prefix, level) {
                if (typeof prefix === "undefined") { prefix = ""; }
                if (typeof level === "undefined") { level = Logger.Level.INFO; }
                this.prefix = prefix;
                this.level = level;
            }
            Logger.prototype.setLevel = function (level) {
                level = Math.max(level, Logger.Level.DEBUG);
                level = Math.min(level, Logger.Level.OFF);
                this.level = level;
            };
            Logger.prototype.isLevelEnabled = function (level) {
                return level >= this.level;
            };
            Logger.prototype.getLevel = function () {
                return this.level;
            };
            Logger.prototype.debug = function (mess) {
                var optionalParams = [];
                for (var _i = 0; _i < (arguments.length - 1); _i++) {
                    optionalParams[_i] = arguments[_i + 1];
                }
                this.log(Logger.Level.DEBUG, mess, optionalParams);
            };
            Logger.prototype.info = function (mess) {
                var optionalParams = [];
                for (var _i = 0; _i < (arguments.length - 1); _i++) {
                    optionalParams[_i] = arguments[_i + 1];
                }
                this.log(Logger.Level.INFO, mess, optionalParams);
            };
            Logger.prototype.warn = function (mess) {
                var optionalParams = [];
                for (var _i = 0; _i < (arguments.length - 1); _i++) {
                    optionalParams[_i] = arguments[_i + 1];
                }
                this.log(Logger.Level.WARN, mess, optionalParams);
            };
            Logger.prototype.error = function (mess) {
                var optionalParams = [];
                for (var _i = 0; _i < (arguments.length - 1); _i++) {
                    optionalParams[_i] = arguments[_i + 1];
                }
                this.log(Logger.Level.ERROR, mess, optionalParams);
            };
            Logger.prototype.format = function (mess) {
                var optionalParams = [];
                for (var _i = 0; _i < (arguments.length - 1); _i++) {
                    optionalParams[_i] = arguments[_i + 1];
                }
                return this.format0(mess, optionalParams);
            };
            Logger.prototype.formatArr = function (mess, optionalParams) {
                return this.format0(mess, optionalParams);
            };
            Logger.Level = {
                DEBUG: 1,
                INFO: 2,
                WARN: 3,
                ERROR: 4,
                OFF: 6
            };
            Logger.log_types = [
                "debug", 
                "debug", 
                "info", 
                "warn", 
                "error"
            ];
            Logger.prototype.log = function (level, msg, optionalParams) {
                if(level >= this.level) {
                    if(typeof console !== "undefined" && msg !== undefined) {
                        try  {
                            var logMethod = console[Logger.log_types[level]];
                            if(!logMethod) {
                                logMethod = console["log"];
                            }
                            if(logMethod) {
                                if(logMethod.call) {
                                    logMethod.call(console, this.format0(msg, optionalParams));
                                } else {
                                    logMethod(console, this.format0(msg, optionalParams));
                                }
                            }
                        } catch (error) {
                        }
                    }
                }
            };
            Logger.prototype.format0 = function (msg, optionalParams) {
                return this.prefix + msg + " " + optionalParams.map(function (x) {
                    if(x !== undefined) {
                        switch(typeof x) {
                            case "object":
                                try  {
                                    return JSON.stringify(x);
                                } catch (error) {
                                    return x.toString() + "(" + error + ")";
                                }
                                break;
                            default:
                                return x.toString();
                                break;
                        }
                    }
                }).join(" ");
            };
            return Logger;
        })();
        Common.Logger = Logger;        
        var Util = (function () {
            function Util() { }
            Util.indexOf = function indexOf(arr, item, from) {
                for(var l = arr.length, i = from < 0 ? Math.max(0, l + from) : from || 0; i < l; i++) {
                    if(arr[i] === item) {
                        return i;
                    }
                }
                return -1;
            };
            Util.isArray = function isArray(obj) {
                return Object.prototype.toString.call(obj) === "[object Array]";
            };
            Util.merge = function merge(target, additional) {
                for(var i in additional) {
                    if(additional.hasOwnProperty(i)) {
                        target[i] = additional[i];
                    }
                }
            };
            Util.getPropertyOrElse = function getPropertyOrElse(obj, prop, defaultValue) {
                if(obj.hasOwnProperty(prop)) {
                    return obj[prop];
                } else {
                    return defaultValue;
                }
            };
            Util.enumValueToName = function enumValueToName(enumObj, value) {
                for(var i in enumObj) {
                    if(value == enumObj[i]) {
                        return i;
                    }
                }
                return "undefined";
            };
            return Util;
        })();
        Common.Util = Util;        
    })(Exitgames.Common || (Exitgames.Common = {}));
    var Common = Exitgames.Common;
})(Exitgames || (Exitgames = {}));
