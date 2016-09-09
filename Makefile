work : tests update pack install publish
clean :
	-rm npm-debug.log

# ############## Working rules:

tests : test.with.jasmine test.with.yasmini
	@echo;echo "    ALL TESTS SUCCESSFUL ";echo
test.with.jasmine :
	jasmine spec/test2-spec.js
	jasmine spec/verbalize2-spec.js
test.with.yasmini :
	cd spec/ && ln -sf ../node_modules .
	node spec/ytests.js
	node spec/ytestfact.js

pack : clean
	-rm -f ../yasmini.tgz
	tar czf ../yasmini.tgz .

# ############## NPM package

publish : clean 
	git status .
	-git commit -m "NPM publication `date`" .
	git push
	-rm -f yasmini.tgz
	m yasmini.tgz install
	cd tmp/yasmini/ && npm version patch && npm publish
	cp -pf tmp/yasmini/package.json .
	rm -rf tmp

yasmini.tgz : clean
	-rm -rf tmp
	mkdir -p tmp
	cd tmp/ && git clone https://github.com/ChristianQueinnec/yasmini.git
	rm -rf tmp/yasmini/.git
	cp -p package.json tmp/yasmini/ 
	tar czf yasmini.tgz -C tmp yasmini
	tar tzf yasmini.tgz

REMOTE	=	www.paracamplus.com
install : 
	rsync -avu ../yasmini.tgz \
	    ${REMOTE}:/var/www/www.paracamplus.com/Resources/Javascript/

update :
	npm version patch
publish :
	npm publish

# end of Makefile
