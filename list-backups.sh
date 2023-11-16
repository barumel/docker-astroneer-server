#!/bin/bash

while getopts c:b: flag
do
    case "${flag}" in
        c) container=${OPTARG};;
        b) backup=${OPTARG};;
    esac
done

if [ -z "$container" ];
then
  echo "The parameter -c (container id) is required!";
  exit;
fi

echo ""

echo "--------DAILY--------"
docker exec -it $container ls -al /backup/daily

echo ""

echo "--------TODAY--------"
docker exec -it $container ls -al /backup

echo ""

# YYYY.MM.DD-hh.mm.ss
# SAVE_1$2023.11.16-19.21.36.savegame
# SERVER$2023.11.16-20.26.08.savegame
#        2023.11.16-20.25.07
#
ds=$(date +"%Y.%m.%d-%H.%M.%S")
filename="SERVER\$$ds.savegame"

echo $filename
