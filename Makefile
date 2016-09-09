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
	-rm -f Yasmini.tgz
	m Yasmini.tgz install
	cd tmp/Yasmini/ && npm version patch && npm publish
	cp -pf tmp/Yasmini/package.json .
	rm -rf tmp

Yasmini.tgz : clean
	-rm -rf tmp
	mkdir -p tmp
	cd tmp/ && git clone https://github.com/Paracamplus/Yasmini.git
	rm -rf tmp/Yasmini/.git
	cp -p package.json tmp/Yasmini/ 
	tar czf Yasmini.tgz -C tmp Yasmini
	tar tzf Yasmini.tgz

REMOTE	=	www.paracamplus.com
install : 
	rsync -avu ../Yasmini.tgz \
	    ${REMOTE}:/var/www/www.paracamplus.com/Resources/Javascript/

update :
	npm version patch
publish :
	npm publish

# end of Makefile
