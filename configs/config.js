// config file for the whole Accretion project
// all string MUST be quoted in "
export default {
	/* which database to use
	   if the database is test, will rewrite the database by test data each time we start backend
	   otherwise, will not modify the database. Will be set to product in the master branch through ./dev-script/release
	*/
	// "database":"product",
	"database":"test",
	// the dir to store the database
	"databaseDir": "./database",
	// the dir to store large file (e.g. movie, pictures)
	"dataDir": "./data",
	// host and port of the backend
	"host": "127.0.0.1",
	"port": "3000",
}
