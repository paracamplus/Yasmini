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
	node spec/y*.js

pack : clean
	-rm -f ../yasmini.tgz
	tar czf ../yasmini.tgz .

REMOTE	=	www.paracamplus.com
install : 
	rsync -avu ../yasmini.tgz \
	    ${REMOTE}:/var/www/www.paracamplus.com/Resources/Javascript/

update :
	npm version patch
publish :
	npm publish

# end of Makefile
