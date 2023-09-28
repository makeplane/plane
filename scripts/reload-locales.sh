#!/bin/bash

DIR="$(realpath `dirname $0`/..)"

cp -r $DIR/locales $DIR/web/public/
cp -r $DIR/locales $DIR/space/public/
