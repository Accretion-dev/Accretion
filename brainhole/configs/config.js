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
	"port": "3000",
	"unittest": true
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2NvbmZpZ3MvY29uZmlnLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUE7QUFDQTtrQkFDZTtBQUNkOzs7O0FBSUE7QUFDQSxhQUFXLE1BTkc7QUFPZDtBQUNBLGdCQUFlLFlBUkQ7QUFTZDtBQUNBLFlBQVcsUUFWRztBQVdkO0FBQ0EsU0FBUSxXQVpNO0FBYWQsU0FBUSxNQWJNO0FBY2QsYUFBWTtBQWRFLEMiLCJmaWxlIjoiY29uZmlnLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gY29uZmlnIGZpbGUgZm9yIHRoZSB3aG9sZSBBY2NyZXRpb24gcHJvamVjdFxuLy8gYWxsIHN0cmluZyBNVVNUIGJlIHF1b3RlZCBpbiBcIlxuZXhwb3J0IGRlZmF1bHQge1xuXHQvKiB3aGljaCBkYXRhYmFzZSB0byB1c2Vcblx0ICAgaWYgdGhlIGRhdGFiYXNlIGlzIHRlc3QsIHdpbGwgcmV3cml0ZSB0aGUgZGF0YWJhc2UgYnkgdGVzdCBkYXRhIGVhY2ggdGltZSB3ZSBzdGFydCBiYWNrZW5kXG5cdCAgIG90aGVyd2lzZSwgd2lsbCBub3QgbW9kaWZ5IHRoZSBkYXRhYmFzZS4gV2lsbCBiZSBzZXQgdG8gcHJvZHVjdCBpbiB0aGUgbWFzdGVyIGJyYW5jaCB0aHJvdWdoIC4vZGV2LXNjcmlwdC9yZWxlYXNlXG5cdCovXG5cdC8vIFwiZGF0YWJhc2VcIjpcInByb2R1Y3RcIixcblx0XCJkYXRhYmFzZVwiOlwidGVzdFwiLFxuXHQvLyB0aGUgZGlyIHRvIHN0b3JlIHRoZSBkYXRhYmFzZVxuXHRcImRhdGFiYXNlRGlyXCI6IFwiLi9kYXRhYmFzZVwiLFxuXHQvLyB0aGUgZGlyIHRvIHN0b3JlIGxhcmdlIGZpbGUgKGUuZy4gbW92aWUsIHBpY3R1cmVzKVxuXHRcImRhdGFEaXJcIjogXCIuL2RhdGFcIixcblx0Ly8gaG9zdCBhbmQgcG9ydCBvZiB0aGUgYmFja2VuZFxuXHRcImhvc3RcIjogXCIxMjcuMC4wLjFcIixcblx0XCJwb3J0XCI6IFwiMzAwMFwiLFxuXHRcInVuaXR0ZXN0XCI6IHRydWUsXG59XG4iXX0=