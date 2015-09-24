work : test pack
clean :: cleanMakefile

test :
	npm test

pack : ../yasmini.tgz
	-rm -f ../yasmini.tgz
	tar czf ../yasmini.tgz .




# end of Makefile
