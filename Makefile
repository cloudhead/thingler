css:
	lessc pub/less/thingler.less > pub/css/thingler.css -x

crontab:
	sudo crontab etc/thingler.cron -u couchdb
