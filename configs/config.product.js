// config file for the whole Accretion project
export default {
	/* which database to use
	   if the database is test, will rewrite the database by test data each time we start backend
	   otherwise, will not modify the database. Will be set to product in the master branch through ./dev-script/release
	*/
	// "database":"product",
	"database":"product",
	// the dir to store the database
	"databaseDir": './database',
	// the dir to store large file (e.g. movie, pictures)
	"databaseDir": './data',
}
