.PHONY: api
all:
	@cat makefile
api:
	node --inspect --inspect-port=60233 ./api.js
database:
	npx cross-env NODE_ENV=development NODE_OPTIONS="--max-old-space-size=16384" \
		nodemon --inspect --inspect-port="60233" database.js --watch database.js
