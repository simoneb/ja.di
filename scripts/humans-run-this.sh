#!/bin/bash

BASE_DIR=`dirname $0`

echo ""
echo "Starting Karma Server (http://karma-runner.github.io)"
echo "-------------------------------------------------------------------"

karma start $BASE_DIR/../config/karma.conf.js $*

echo ""
echo "Running jasmine-node (https://github.com/mhevery/jasmine-node)"
echo "-------------------------------------------------------------------"

jasmine-node $BASE_DIR/.. --matchall --verbose $*