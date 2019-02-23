"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
// config file for the whole Accretion project
// all string MUST be quoted in "
exports.default = {
	/* which database to use
    if the database is test, will rewrite the database by test data each time we start backend
    otherwise, will not modify the database. Will be set to product in the master branch through ./dev-script/release
 */
	// "database":"product",
	"database": "test",
	// the dir to store the database
	"databaseDir": "./database",
	// the dir to store large file (e.g. movie, pictures)
	"dataDir": "./data",
	// host and port of the backend
	"host": "127.0.0.1",
	"port": "3000"
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2NvbmZpZ3MvY29uZmlnLnByb2R1Y3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQTtBQUNBO2tCQUNlO0FBQ2Q7Ozs7QUFJQTtBQUNBLGFBQVcsTUFORztBQU9kO0FBQ0EsZ0JBQWUsWUFSRDtBQVNkO0FBQ0EsWUFBVyxRQVZHO0FBV2Q7QUFDQSxTQUFRLFdBWk07QUFhZCxTQUFRO0FBYk0sQyIsImZpbGUiOiJjb25maWcucHJvZHVjdC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIGNvbmZpZyBmaWxlIGZvciB0aGUgd2hvbGUgQWNjcmV0aW9uIHByb2plY3Rcbi8vIGFsbCBzdHJpbmcgTVVTVCBiZSBxdW90ZWQgaW4gXCJcbmV4cG9ydCBkZWZhdWx0IHtcblx0Lyogd2hpY2ggZGF0YWJhc2UgdG8gdXNlXG5cdCAgIGlmIHRoZSBkYXRhYmFzZSBpcyB0ZXN0LCB3aWxsIHJld3JpdGUgdGhlIGRhdGFiYXNlIGJ5IHRlc3QgZGF0YSBlYWNoIHRpbWUgd2Ugc3RhcnQgYmFja2VuZFxuXHQgICBvdGhlcndpc2UsIHdpbGwgbm90IG1vZGlmeSB0aGUgZGF0YWJhc2UuIFdpbGwgYmUgc2V0IHRvIHByb2R1Y3QgaW4gdGhlIG1hc3RlciBicmFuY2ggdGhyb3VnaCAuL2Rldi1zY3JpcHQvcmVsZWFzZVxuXHQqL1xuXHQvLyBcImRhdGFiYXNlXCI6XCJwcm9kdWN0XCIsXG5cdFwiZGF0YWJhc2VcIjpcInRlc3RcIixcblx0Ly8gdGhlIGRpciB0byBzdG9yZSB0aGUgZGF0YWJhc2Vcblx0XCJkYXRhYmFzZURpclwiOiBcIi4vZGF0YWJhc2VcIixcblx0Ly8gdGhlIGRpciB0byBzdG9yZSBsYXJnZSBmaWxlIChlLmcuIG1vdmllLCBwaWN0dXJlcylcblx0XCJkYXRhRGlyXCI6IFwiLi9kYXRhXCIsXG5cdC8vIGhvc3QgYW5kIHBvcnQgb2YgdGhlIGJhY2tlbmRcblx0XCJob3N0XCI6IFwiMTI3LjAuMC4xXCIsXG5cdFwicG9ydFwiOiBcIjMwMDBcIixcbn1cbiJdfQ==