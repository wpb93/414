var Photon;
(function (Photon) {
    (function (Lite) {
        (function (Constants) {
            Constants.LiteOpKey = {
                ActorList: 252,
                ActorNr: 254,
                ActorProperties: 249,
                Add: 238,
                Broadcast: 250,
                Cache: 247,
                Code: 244,
                Data: 245,
                GameId: 255,
                GameProperties: 248,
                Group: 240,
                Properties: 251,
                ReceiverGroup: 246,
                Remove: 239,
                TargetActorNr: 253
            };
            Constants.LiteEventCode = {
                Join: 255,
                Leave: 254,
                PropertiesChanged: 253
            };
            Constants.LiteOpCode = {
                ChangeGroups: 248,
                GetProperties: 251,
                Join: 255,
                Leave: 254,
                RaiseEvent: 253,
                SetProperties: 252
            };
        })(Lite.Constants || (Lite.Constants = {}));
        var Constants = Lite.Constants;
    })(Photon.Lite || (Photon.Lite = {}));
    var Lite = Photon.Lite;
})(Photon || (Photon = {}));
