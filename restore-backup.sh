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

if [ -z "$backup" ];
then
  echo "The parameter -b (backup file) is required!";
  exit;
fi

echo "Going to restore \"$backup\" in container with id \"$container\""

echo "GOINT TO COPY THE BACKUP TO LOCAL FS"
# docker exec -it $container cp $container:/backup/daily/$backup $container:/astroneer/Astro/Saved/SaveGames/$filename || docker exec -it $container cp $container:/backup/$backup $container:/astroneer/Astro/Saved/SaveGames/$filename
docker cp $container:/backup/daily/$backup SAVEGAME.tmp || docker cp $container:/backup/$backup SAVEGAME.tmp

echo "COPY BACKUP FILE FROM LOCAL FS TO CONTAINER'S /backup/restore"

docker cp SAVEGAME.tmp $container:/backup/restore/SERVER.savegame

# Stop the container
echo "GOINT TO STOP THE CONTAINER"
docker compose down || docker-compose down

echo "RESTART THE CONTAINER"
docker compose up -d || docker-compose up -d
