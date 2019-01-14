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
	./dev-scripts/startDatabase
brainhole-watch:
	cd brainhole; npm run watch
brainhole-dev:
	cd brainhole; npm run dev
brainhole-test:
	cd brainhole; npm run test
tmux:
	./dev-scripts/backend/opneInTmux
