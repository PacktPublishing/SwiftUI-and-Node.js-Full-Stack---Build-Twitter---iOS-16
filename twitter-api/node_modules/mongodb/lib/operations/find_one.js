"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FindOneOperation = void 0;
const command_1 = require("./command");
const operation_1 = require("./operation");
/** @internal */
class FindOneOperation extends command_1.CommandOperation {
    constructor(collection, query, options) {
        super(collection, options);
        this.options = options;
        this.collection = collection;
        this.query = query;
    }
    execute(server, session, callback) {
        const coll = this.collection;
        const query = this.query;
        const options = { ...this.options, ...this.bsonOptions, session };
        try {
            const cursor = coll.find(query, options).limit(-1).batchSize(1);
            // Return the item
            cursor.next((err, item) => {
                if (err != null)
                    return callback(err);
                callback(undefined, item || undefined);
            });
        }
        catch (e) {
            callback(e);
        }
    }
}
exports.FindOneOperation = FindOneOperation;
operation_1.defineAspects(FindOneOperation, [operation_1.Aspect.EXPLAINABLE]);
//# sourceMappingURL=find_one.js.map