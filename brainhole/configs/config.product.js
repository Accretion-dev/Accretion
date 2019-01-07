"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// config file for the whole Accretion project
exports.default = _defineProperty({
	/* which database to use
    if the database is test, will rewrite the database by test data each time we start backend
    otherwise, will not modify the database. Will be set to product in the master branch through ./dev-script/release
 */
	// "database":"product",
	"database": "product",
	// the dir to store the database
	"databaseDir": './database'
}, "databaseDir", './data');
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2NvbmZpZ3MvY29uZmlnLnByb2R1Y3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQTs7QUFFQzs7OztBQUlBO0FBQ0EsYUFBVyxTO0FBQ1g7QUFDQSxnQkFBZTtrQkFFQSxRIiwiZmlsZSI6ImNvbmZpZy5wcm9kdWN0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gY29uZmlnIGZpbGUgZm9yIHRoZSB3aG9sZSBBY2NyZXRpb24gcHJvamVjdFxuZXhwb3J0IGRlZmF1bHQge1xuXHQvKiB3aGljaCBkYXRhYmFzZSB0byB1c2Vcblx0ICAgaWYgdGhlIGRhdGFiYXNlIGlzIHRlc3QsIHdpbGwgcmV3cml0ZSB0aGUgZGF0YWJhc2UgYnkgdGVzdCBkYXRhIGVhY2ggdGltZSB3ZSBzdGFydCBiYWNrZW5kXG5cdCAgIG90aGVyd2lzZSwgd2lsbCBub3QgbW9kaWZ5IHRoZSBkYXRhYmFzZS4gV2lsbCBiZSBzZXQgdG8gcHJvZHVjdCBpbiB0aGUgbWFzdGVyIGJyYW5jaCB0aHJvdWdoIC4vZGV2LXNjcmlwdC9yZWxlYXNlXG5cdCovXG5cdC8vIFwiZGF0YWJhc2VcIjpcInByb2R1Y3RcIixcblx0XCJkYXRhYmFzZVwiOlwicHJvZHVjdFwiLFxuXHQvLyB0aGUgZGlyIHRvIHN0b3JlIHRoZSBkYXRhYmFzZVxuXHRcImRhdGFiYXNlRGlyXCI6ICcuL2RhdGFiYXNlJyxcblx0Ly8gdGhlIGRpciB0byBzdG9yZSBsYXJnZSBmaWxlIChlLmcuIG1vdmllLCBwaWN0dXJlcylcblx0XCJkYXRhYmFzZURpclwiOiAnLi9kYXRhJyxcbn1cbiJdfQ==