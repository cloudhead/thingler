css:
	lessc pub/less/thingler.less > pub/css/thingler.css -x

crontab:
	sudo crontab etc/thingler.cron -u couchdb

deps:
	test -e $(which npm) && echo 'npm already installed.' || curl http://npmjs.org/install.sh | sh
	test -e $(which npm) && npm install cradle || echo 'npm not installed. install via "curl http://npmjs.org/install.sh | sh"'
	test -e $(which npm) && npm install journey || echo  'npm not installed. install via "curl http://npmjs.org/install.sh | sh"'
	test -e $(which npm) && npm install node-static || echo   'npm not installed. install via "curl http://npmjs.org/install.sh | sh"'
