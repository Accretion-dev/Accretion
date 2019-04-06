.PHONY: api
all:
	@cat makefile
api:
	npx cross-env NODE_ENV=development NODE_OPTIONS="--max-old-space-size=16384" \
		nodemon --watch api.js --exec 'babel-node --inspect="localhost:60233" api.js'
database:
	npx cross-env NODE_ENV=development NODE_OPTIONS="--max-old-space-size=16384" \
		nodemon --watch database.js --exec 'babel-node --inspect="localhost:60233" database.js'
