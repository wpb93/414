var Photon;
(function (Photon) {
    (function (LoadBalancing) {
        (function (Constants) {
            Constants.LiteOpKey = Photon.Lite.Constants.LiteOpKey;
            Constants.LiteOpCode = Photon.Lite.Constants.LiteOpCode;
            Constants.LiteEventCode = Photon.Lite.Constants.LiteEventCode;
            Constants.ErrorCode = {
                Ok: 0,
                OperationNotAllowedInCurrentState: -3,
                InvalidOperationCode: -2,
                InternalServerError: -1,
                InvalidAuthentication: 0x7FFF,
                GameIdAlreadyExists: 0x7FFF - 1,
                GameFull: 0x7FFF - 2,
                GameClosed: 0x7FFF - 3,
                NoRandomMatchFound: 0x7FFF - 7,
                GameDoesNotExist: 0x7FFF - 9,
                MaxCcuReached: 0x7FFF - 10,
                InvalidRegion: 0x7FFF - 11
            };
            Constants.ActorProperties = {
                PlayerName: 255
            };
            Constants.GameProperties = {
                MaxPlayers: 255,
                IsVisible: 254,
                IsOpen: 253,
                PlayerCount: 252,
                Removed: 251,
                PropsListedInLobby: 250,
                CleanupCacheOnLeave: 249
            };
            Constants.EventCode = {
                GameList: 230,
                GameListUpdate: 229,
                QueueState: 228,
                AppStats: 226,
                AzureNodeInfo: 210,
                Join: Constants.LiteEventCode.Join,
                Leave: Constants.LiteEventCode.Leave,
                PropertiesChanged: Constants.LiteEventCode.PropertiesChanged
            };
            Constants.ParameterCode = {
                Address: 230,
                PeerCount: 229,
                GameCount: 228,
                MasterPeerCount: 227,
                UserId: 225,
                ApplicationId: 224,
                Position: 223,
                MatchMakingType: 223,
                GameList: 222,
                Secret: 221,
                AppVersion: 220,
                AzureNodeInfo: 210,
                AzureLocalNodeId: 209,
                AzureMasterNodeId: 208,
                RoomName: Constants.LiteOpKey.GameId,
                Broadcast: Constants.LiteOpKey.Broadcast,
                ActorList: Constants.LiteOpKey.ActorList,
                ActorNr: Constants.LiteOpKey.ActorNr,
                PlayerProperties: Constants.LiteOpKey.ActorProperties,
                CustomEventContent: Constants.LiteOpKey.Data,
                Data: Constants.LiteOpKey.Data,
                Code: Constants.LiteOpKey.Code,
                GameProperties: Constants.LiteOpKey.GameProperties,
                Properties: Constants.LiteOpKey.Properties,
                TargetActorNr: Constants.LiteOpKey.TargetActorNr,
                ReceiverGroup: Constants.LiteOpKey.ReceiverGroup,
                Cache: Constants.LiteOpKey.Cache,
                CleanupCacheOnLeave: 241,
                Group: Constants.LiteOpKey.Group,
                Remove: Constants.LiteOpKey.Remove,
                Add: Constants.LiteOpKey.Add
            };
            Constants.OperationCode = {
                Authenticate: 230,
                JoinLobby: 229,
                LeaveLobby: 228,
                CreateGame: 227,
                JoinGame: 226,
                JoinRandomGame: 225,
                Leave: Constants.LiteOpCode.Leave,
                RaiseEvent: Constants.LiteOpCode.RaiseEvent,
                SetProperties: Constants.LiteOpCode.SetProperties,
                GetProperties: Constants.LiteOpCode.GetProperties,
                ChangeGroups: Constants.LiteOpCode.ChangeGroups
            };
            Constants.MatchmakingMode = {
                FillRoom: 0,
                SerialMatching: 1,
                RandomMatching: 2
            };
            Constants.EventCaching = {
                DoNotCache: 0,
                MergeCache: 1,
                ReplaceCache: 2,
                RemoveCache: 3,
                AddToRoomCache: 4,
                AddToRoomCacheGlobal: 5,
                RemoveFromRoomCache: 6,
                RemoveFromRoomCacheForActorsLeft: 7
            };
            Constants.ReceiverGroup = {
                Others: 0,
                All: 1,
                MasterClient: 2
            };
        })(LoadBalancing.Constants || (LoadBalancing.Constants = {}));
        var Constants = LoadBalancing.Constants;
    })(Photon.LoadBalancing || (Photon.LoadBalancing = {}));
    var LoadBalancing = Photon.LoadBalancing;
})(Photon || (Photon = {}));
