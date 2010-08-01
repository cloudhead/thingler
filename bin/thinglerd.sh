#! /bin/sh

PID_FILE="/tmp/thinglerd.pid"
SERVER_PATH="$PWD/src/index.js"
PORT=$2

if [ "$1" = "start" ]; then
    if [ -e $PID_FILE ]; then
        echo "~ thinglerd is already running."
    else
        echo "~ starting thinglerd."
        nohup node $SERVER_PATH $PORT > /dev/null 2>&1 &
    fi
elif [ "$1" = "stop" ]; then
    if [ ! -e $PID_FILE ]; then
        echo "~ thinglerd is not running."
    else
        echo "~ stopping thinglerd."
        kill `cat $PID_FILE`
        rm -f $PID_FILE
    fi
elif [ "$1" = "status" ]; then
    if [ -e $PID_FILE ]; then
        echo "~ thinglerd is running as process "`cat $PID_FILE`
    else
        echo "~ thinglerd is not running."
    fi
fi
