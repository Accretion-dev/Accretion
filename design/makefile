.PHONY: all update features
all:
	@cat makefile
update: # update the simple devmanager
	cp ../../simpleDevManager/bin/*.py ./bin/
	cp ../../simpleDevManager/features_demo.md .
	cp ../../simpleDevManager/features_demo.txt .
	cp ../../simpleDevManager/.gitignore .
demo:
	ipython -i ./bin/processFeatures.py -- features_demo.txt
design:
	python ./bin/featuresStat.py ./design.txt
dev:
	python ./bin/featuresStat.py ./dev_design.txt

