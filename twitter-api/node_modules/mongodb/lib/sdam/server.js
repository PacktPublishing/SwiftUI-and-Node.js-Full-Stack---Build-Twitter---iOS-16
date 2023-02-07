"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HEARTBEAT_EVENTS = exports.Server = void 0;
const logger_1 = require("../logger");
const connection_pool_1 = require("../cmap/connection_pool");
const server_description_1 = require("./server_description");
const monitor_1 = require("./monitor");
const transactions_1 = require("../transactions");
const utils_1 = require("../utils");
const common_1 = require("./common");
const error_1 = require("../error");
const connection_1 = require("../cmap/connection");
const mongo_types_1 = require("../mongo_types");
const stateTransition = utils_1.makeStateMachine({
    [common_1.STATE_CLOSED]: [common_1.STATE_CLOSED, common_1.STATE_CONNECTING],
    [common_1.STATE_CONNECTING]: [common_1.STATE_CONNECTING, common_1.STATE_CLOSING, common_1.STATE_CONNECTED, common_1.STATE_CLOSED],
    [common_1.STATE_CONNECTED]: [common_1.STATE_CONNECTED, common_1.STATE_CLOSING, common_1.STATE_CLOSED],
    [common_1.STATE_CLOSING]: [common_1.STATE_CLOSING, common_1.STATE_CLOSED]
});
/** @internal */
const kMonitor = Symbol('monitor');
/** @internal */
class Server extends mongo_types_1.TypedEventEmitter {
    /**
     * Create a server
     */
    constructor(topology, description, options) {
        super();
        this.serverApi = options.serverApi;
        const poolOptions = { hostAddress: description.hostAddress, ...options };
        this.s = {
            description,
            options,
            logger: new logger_1.Logger('Server'),
            state: common_1.STATE_CLOSED,
            topology,
            pool: new connection_pool_1.ConnectionPool(poolOptions)
        };
        for (const event of [...connection_pool_1.CMAP_EVENTS, ...connection_1.APM_EVENTS]) {
            this.s.pool.on(event, (e) => this.emit(event, e));
        }
        this.s.pool.on(connection_1.Connection.CLUSTER_TIME_RECEIVED, (clusterTime) => {
            this.clusterTime = clusterTime;
        });
        // create the monitor
        this[kMonitor] = new monitor_1.Monitor(this, this.s.options);
        for (const event of exports.HEARTBEAT_EVENTS) {
            this[kMonitor].on(event, (e) => this.emit(event, e));
        }
        this[kMonitor].on('resetConnectionPool', () => {
            this.s.pool.clear();
        });
        this[kMonitor].on('resetServer', (error) => markServerUnknown(this, error));
        this[kMonitor].on(Server.SERVER_HEARTBEAT_SUCCEEDED, (event) => {
            this.emit(Server.DESCRIPTION_RECEIVED, new server_description_1.ServerDescription(this.description.hostAddress, event.reply, {
                roundTripTime: calculateRoundTripTime(this.description.roundTripTime, event.duration)
            }));
            if (this.s.state === common_1.STATE_CONNECTING) {
                stateTransition(this, common_1.STATE_CONNECTED);
                this.emit(Server.CONNECT, this);
            }
        });
    }
    get description() {
        return this.s.description;
    }
    get name() {
        return this.s.description.address;
    }
    get autoEncrypter() {
        if (this.s.options && this.s.options.autoEncrypter) {
            return this.s.options.autoEncrypter;
        }
    }
    /**
     * Initiate server connect
     */
    connect() {
        if (this.s.state !== common_1.STATE_CLOSED) {
            return;
        }
        stateTransition(this, common_1.STATE_CONNECTING);
        this[kMonitor].connect();
    }
    /** Destroy the server connection */
    destroy(options, callback) {
        if (typeof options === 'function')
            (callback = options), (options = {});
        options = Object.assign({}, { force: false }, options);
        if (this.s.state === common_1.STATE_CLOSED) {
            if (typeof callback === 'function') {
                callback();
            }
            return;
        }
        stateTransition(this, common_1.STATE_CLOSING);
        this[kMonitor].close();
        this.s.pool.close(options, err => {
            stateTransition(this, common_1.STATE_CLOSED);
            this.emit('closed');
            if (typeof callback === 'function') {
                callback(err);
            }
        });
    }
    /**
     * Immediately schedule monitoring of this server. If there already an attempt being made
     * this will be a no-op.
     */
    requestCheck() {
        this[kMonitor].requestCheck();
    }
    command(ns, cmd, options, callback) {
        if (typeof options === 'function') {
            (callback = options), (options = {}), (options = options !== null && options !== void 0 ? options : {});
        }
        if (callback == null) {
            throw new error_1.MongoDriverError('callback must be provided');
        }
        if (ns.db == null || typeof ns === 'string') {
            throw new error_1.MongoDriverError('ns must not be a string');
        }
        if (this.s.state === common_1.STATE_CLOSING || this.s.state === common_1.STATE_CLOSED) {
            callback(new error_1.MongoDriverError('server is closed'));
            return;
        }
        // Clone the options
        const finalOptions = Object.assign({}, options, { wireProtocolCommand: false });
        // error if collation not supported
        if (utils_1.collationNotSupported(this, cmd)) {
            callback(new error_1.MongoDriverError(`server ${this.name} does not support collation`));
            return;
        }
        this.s.pool.withConnection((err, conn, cb) => {
            if (err || !conn) {
                markServerUnknown(this, err);
                return cb(err);
            }
            conn.command(ns, cmd, finalOptions, makeOperationHandler(this, conn, cmd, finalOptions, cb));
        }, callback);
    }
    /**
     * Execute a query against the server
     * @internal
     */
    query(ns, cmd, options, callback) {
        if (this.s.state === common_1.STATE_CLOSING || this.s.state === common_1.STATE_CLOSED) {
            callback(new error_1.MongoDriverError('server is closed'));
            return;
        }
        this.s.pool.withConnection((err, conn, cb) => {
            if (err || !conn) {
                markServerUnknown(this, err);
                return cb(err);
            }
            conn.query(ns, cmd, options, makeOperationHandler(this, conn, cmd, options, cb));
        }, callback);
    }
    /**
     * Execute a `getMore` against the server
     * @internal
     */
    getMore(ns, cursorId, options, callback) {
        if (this.s.state === common_1.STATE_CLOSING || this.s.state === common_1.STATE_CLOSED) {
            callback(new error_1.MongoDriverError('server is closed'));
            return;
        }
        this.s.pool.withConnection((err, conn, cb) => {
            if (err || !conn) {
                markServerUnknown(this, err);
                return cb(err);
            }
            conn.getMore(ns, cursorId, options, makeOperationHandler(this, conn, {}, options, cb));
        }, callback);
    }
    /**
     * Execute a `killCursors` command against the server
     * @internal
     */
    killCursors(ns, cursorIds, options, callback) {
        if (this.s.state === common_1.STATE_CLOSING || this.s.state === common_1.STATE_CLOSED) {
            if (typeof callback === 'function') {
                callback(new error_1.MongoDriverError('server is closed'));
            }
            return;
        }
        this.s.pool.withConnection((err, conn, cb) => {
            if (err || !conn) {
                markServerUnknown(this, err);
                return cb(err);
            }
            conn.killCursors(ns, cursorIds, options, makeOperationHandler(this, conn, {}, undefined, cb));
        }, callback);
    }
}
exports.Server = Server;
/** @event */
Server.SERVER_HEARTBEAT_STARTED = 'serverHeartbeatStarted';
/** @event */
Server.SERVER_HEARTBEAT_SUCCEEDED = 'serverHeartbeatSucceeded';
/** @event */
Server.SERVER_HEARTBEAT_FAILED = 'serverHeartbeatFailed';
/** @event */
Server.CONNECT = 'connect';
/** @event */
Server.DESCRIPTION_RECEIVED = 'descriptionReceived';
/** @event */
Server.CLOSED = 'closed';
/** @event */
Server.ENDED = 'ended';
exports.HEARTBEAT_EVENTS = [
    Server.SERVER_HEARTBEAT_STARTED,
    Server.SERVER_HEARTBEAT_SUCCEEDED,
    Server.SERVER_HEARTBEAT_FAILED
];
Object.defineProperty(Server.prototype, 'clusterTime', {
    get() {
        return this.s.topology.clusterTime;
    },
    set(clusterTime) {
        this.s.topology.clusterTime = clusterTime;
    }
});
function supportsRetryableWrites(server) {
    return (server.description.maxWireVersion >= 6 &&
        server.description.logicalSessionTimeoutMinutes &&
        server.description.type !== common_1.ServerType.Standalone);
}
function calculateRoundTripTime(oldRtt, duration) {
    if (oldRtt === -1) {
        return duration;
    }
    const alpha = 0.2;
    return alpha * duration + (1 - alpha) * oldRtt;
}
function markServerUnknown(server, error) {
    if (error instanceof error_1.MongoNetworkError && !(error instanceof error_1.MongoNetworkTimeoutError)) {
        server[kMonitor].reset();
    }
    server.emit(Server.DESCRIPTION_RECEIVED, new server_description_1.ServerDescription(server.description.hostAddress, undefined, {
        error,
        topologyVersion: error && error.topologyVersion ? error.topologyVersion : server.description.topologyVersion
    }));
}
function connectionIsStale(pool, connection) {
    return connection.generation !== pool.generation;
}
function shouldHandleStateChangeError(server, err) {
    const etv = err.topologyVersion;
    const stv = server.description.topologyVersion;
    return server_description_1.compareTopologyVersion(stv, etv) < 0;
}
function inActiveTransaction(session, cmd) {
    return session && session.inTransaction() && !transactions_1.isTransactionCommand(cmd);
}
/** this checks the retryWrites option passed down from the client options, it
 * does not check if the server supports retryable writes */
function isRetryableWritesEnabled(topology) {
    return topology.s.options.retryWrites !== false;
}
function makeOperationHandler(server, connection, cmd, options, callback) {
    const session = options === null || options === void 0 ? void 0 : options.session;
    return function handleOperationResult(err, result) {
        if (err && !connectionIsStale(server.s.pool, connection)) {
            if (err instanceof error_1.MongoNetworkError) {
                if (session && !session.hasEnded && session.serverSession) {
                    session.serverSession.isDirty = true;
                }
                if ((isRetryableWritesEnabled(server.s.topology) || transactions_1.isTransactionCommand(cmd)) &&
                    supportsRetryableWrites(server) &&
                    !inActiveTransaction(session, cmd)) {
                    err.addErrorLabel('RetryableWriteError');
                }
                if (!(err instanceof error_1.MongoNetworkTimeoutError) || error_1.isNetworkErrorBeforeHandshake(err)) {
                    markServerUnknown(server, err);
                    server.s.pool.clear();
                }
            }
            else {
                // if pre-4.4 server, then add error label if its a retryable write error
                if ((isRetryableWritesEnabled(server.s.topology) || transactions_1.isTransactionCommand(cmd)) &&
                    utils_1.maxWireVersion(server) < 9 &&
                    error_1.isRetryableWriteError(err) &&
                    !inActiveTransaction(session, cmd)) {
                    err.addErrorLabel('RetryableWriteError');
                }
                if (error_1.isSDAMUnrecoverableError(err)) {
                    if (shouldHandleStateChangeError(server, err)) {
                        if (utils_1.maxWireVersion(server) <= 7 || error_1.isNodeShuttingDownError(err)) {
                            server.s.pool.clear();
                        }
                        markServerUnknown(server, err);
                        process.nextTick(() => server.requestCheck());
                    }
                }
            }
        }
        callback(err, result);
    };
}
//# sourceMappingURL=server.js.map