work : tests update install publish
clean :
	-rm npm-debug.log
	-rm -rf tmp

# ############## Working rules:

tests : test.with.jasmine test.with.yasmini
	@echo;echo "    ALL TESTS SUCCESSFUL ";echo
test.with.jasmine :
	rm -rf node_modules/yasmini
	mkdir -p node_modules/yasmini
	cp -rp example package.json yasmini.js \
		node_modules/yasmini/
	jasmine spec/test2-spec.js
	jasmine spec/verbalize2-spec.js
test.with.yasmini :
	cd spec/ && ln -sf ../node_modules .
	node spec/ytests.js
	node spec/ytestorder.js
	node spec/ytestserver.js
	node spec/ytestverbalize.js

jshint :
	node_modules/.bin/jshint yasmini.js example/*.js 

# ############## NPM package

publish : clean 
	git status .
	-git commit -m "NPM publication `date`" .
	git push
	-rm -f yasmini.tgz
	m Yasmini.tgz install
	cd tmp/Yasmini/ && npm version patch && npm publish
	cp -pf tmp/Yasmini/package.json .
	rm -rf tmp

Yasmini.tgz : clean
	mkdir -p tmp
	cd tmp/ && git clone https://github.com/paracamplus/Yasmini.git
	rm -rf tmp/Yasmini/.git
	cp -p package.json tmp/Yasmini/ 
	tar czf Yasmini.tgz -C tmp Yasmini
	tar tzf Yasmini.tgz

REMOTE	=	www.paracamplus.com
install : Yasmini.tgz
	rsync -avu Yasmini.tgz \
	    ${REMOTE}:/var/www/www.paracamplus.com/Resources/Javascript/

update :
	npm version patch

# end of Makefile
