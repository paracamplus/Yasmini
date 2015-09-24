work : test pack install 
clean :: cleanMakefile

test :
	npm test

pack :
	-rm -f ../yasmini.tgz
	tar czf ../yasmini.tgz .

REMOTE	=	www.paracamplus.com
install : 
	rsync -avu ../yasmini.tgz \
	    ${REMOTE}:/var/www/www.paracamplus.com/Resources/Javascript/


# end of Makefile
