"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decompress = exports.compress = exports.uncompressibleCommands = exports.Compressor = void 0;
const zlib = require("zlib");
const deps_1 = require("../../deps");
const error_1 = require("../../error");
/** @public */
exports.Compressor = Object.freeze({
    none: 0,
    snappy: 1,
    zlib: 2
});
exports.uncompressibleCommands = new Set([
    'ismaster',
    'saslStart',
    'saslContinue',
    'getnonce',
    'authenticate',
    'createUser',
    'updateUser',
    'copydbSaslStart',
    'copydbgetnonce',
    'copydb'
]);
// Facilitate compressing a message using an agreed compressor
function compress(self, dataToBeCompressed, callback) {
    const zlibOptions = {};
    switch (self.options.agreedCompressor) {
        case 'snappy':
            if ('kModuleError' in deps_1.Snappy) {
                return callback(deps_1.Snappy['kModuleError']);
            }
            deps_1.Snappy.compress(dataToBeCompressed, callback);
            break;
        case 'zlib':
            // Determine zlibCompressionLevel
            if (self.options.zlibCompressionLevel) {
                zlibOptions.level = self.options.zlibCompressionLevel;
            }
            zlib.deflate(dataToBeCompressed, zlibOptions, callback);
            break;
        default:
            throw new error_1.MongoDriverError('Attempt to compress message using unknown compressor "' +
                self.options.agreedCompressor +
                '".');
    }
}
exports.compress = compress;
// Decompress a message using the given compressor
function decompress(compressorID, compressedData, callback) {
    if (compressorID < 0 || compressorID > Math.max(2)) {
        throw new error_1.MongoDriverError(`Server sent message compressed using an unsupported compressor.` +
            ` (Received compressor ID ${compressorID})`);
    }
    switch (compressorID) {
        case exports.Compressor.snappy:
            if ('kModuleError' in deps_1.Snappy) {
                return callback(deps_1.Snappy['kModuleError']);
            }
            deps_1.Snappy.uncompress(compressedData, { asBuffer: true }, callback);
            break;
        case exports.Compressor.zlib:
            zlib.inflate(compressedData, callback);
            break;
        default:
            callback(undefined, compressedData);
    }
}
exports.decompress = decompress;
//# sourceMappingURL=compression.js.map