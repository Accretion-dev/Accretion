"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _database$database$da;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// config file for the whole Accretion project
// all string MUST be quoted in "
exports.default = (_database$database$da = {
	/* which database to use
    if the database is test, will rewrite the database by test data each time we start backend
    otherwise, will not modify the database. Will be set to product in the master branch through ./dev-script/release
 */
	"database": "product"
}, _defineProperty(_database$database$da, "database", "test"), _defineProperty(_database$database$da, "databaseDir", "./database"), _defineProperty(_database$database$da, "dataDir", "./data"), _database$database$da);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2NvbmZpZ3MvY29uZmlnLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQTtBQUNBOztBQUVDOzs7O0FBSUEsYUFBVztzREFDQSxNLDBDQUVYLGEsRUFBZSxZLDBDQUVmLFMsRUFBVyxRIiwiZmlsZSI6ImNvbmZpZy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIGNvbmZpZyBmaWxlIGZvciB0aGUgd2hvbGUgQWNjcmV0aW9uIHByb2plY3Rcbi8vIGFsbCBzdHJpbmcgTVVTVCBiZSBxdW90ZWQgaW4gXCJcbmV4cG9ydCBkZWZhdWx0IHtcblx0Lyogd2hpY2ggZGF0YWJhc2UgdG8gdXNlXG5cdCAgIGlmIHRoZSBkYXRhYmFzZSBpcyB0ZXN0LCB3aWxsIHJld3JpdGUgdGhlIGRhdGFiYXNlIGJ5IHRlc3QgZGF0YSBlYWNoIHRpbWUgd2Ugc3RhcnQgYmFja2VuZFxuXHQgICBvdGhlcndpc2UsIHdpbGwgbm90IG1vZGlmeSB0aGUgZGF0YWJhc2UuIFdpbGwgYmUgc2V0IHRvIHByb2R1Y3QgaW4gdGhlIG1hc3RlciBicmFuY2ggdGhyb3VnaCAuL2Rldi1zY3JpcHQvcmVsZWFzZVxuXHQqL1xuXHRcImRhdGFiYXNlXCI6XCJwcm9kdWN0XCIsXG5cdFwiZGF0YWJhc2VcIjpcInRlc3RcIixcblx0Ly8gdGhlIGRpciB0byBzdG9yZSB0aGUgZGF0YWJhc2Vcblx0XCJkYXRhYmFzZURpclwiOiBcIi4vZGF0YWJhc2VcIixcblx0Ly8gdGhlIGRpciB0byBzdG9yZSBsYXJnZSBmaWxlIChlLmcuIG1vdmllLCBwaWN0dXJlcylcblx0XCJkYXRhRGlyXCI6IFwiLi9kYXRhXCIsXG59XG4iXX0=