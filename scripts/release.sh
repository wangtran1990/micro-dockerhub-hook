#!/bin/sh
# Path needs to be mounted from host to container.
sudo docker pull wangtran1990/docker_with_sailsjs
sudo docker stop docker_with_sailsjs
sudo docker rm docker_with_sailsjs
sudo docker run -p 1400:1400 wangtran1990/docker_with_sailsjs:latest docker_with_sailsjs
echo 'you are all set'
