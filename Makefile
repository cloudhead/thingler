css:
	lessc pub/less/thingler.less > pub/css/thingler.css -x

crontab:
	sudo crontab thingler.cron -u couchdb
