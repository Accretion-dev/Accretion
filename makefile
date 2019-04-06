.PHONY: initBrainhole initDevEnvironment database
all:
	@cat makefile
initBrainhole:
	./dev-scripts/initBrainhole
initDevEnvironment:
	./dev-scripts/initDevEnvironment
installPackages:
	cd brainhole; bash ../dev-scripts/backend/installPackages
database:
	bash dev-scripts/startDatabase-dev
test-database:
	cd brainhole/test; bash startDatabase-test
test-force-restart-database:
	cd brainhole/test; pkill mongod -sigkill; bash startDatabase-test
brainhole-watch:
	cd brainhole; npm run watch
brainhole-dev:
	cd brainhole; npm run dev
test:
	cd brainhole; npm run test
test-inspect:
	cd brainhole; npm run test-inspect
tmux:
	./dev-scripts/backend/opneInTmux
