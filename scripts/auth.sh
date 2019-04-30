#!/bin/bash

echo -n "Username: "
read USERNAME

echo -n "Password: "
read -s PASSWORD 

yarn --silent start \
  --loginUrl=$1 \
  --username=$USERNAME \
  --password=$PASSWORD \
  ${@:2}

unset USERNAME
unset PASSWORD