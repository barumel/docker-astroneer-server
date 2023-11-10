# docker-astroneer-server

## Prerequisites

The current astroneer server implementation uses an encryption algorithm that is not supported by wine's implementation of bcrypt.dll.
Due to this issue, we have to disable encryption on the server side to make things work.



To be able to connect to the server you will have to disable encryption on the client side as well.



Locate the Engine.ini file on your file system (usually located under %AppData% -> Local -> Astro -> Saved -> Config) and add the following line to the bottom of the file:

```
[SystemSettings]
net.AllowEncryption=False
```

## Configuration

The following configuration values are currently available

| VAR                     | Required | Default Value | Description                                                                                                                   |
| ----------------------- | -------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| ASTRO_SERVER_NAME       | Yes      |               | The name or your server.                                                                                                      |
| ASTRO_SERVER_PORT       | No       | 8777          | Custom server port                                                                                                            |
| ASTRO_SERVER_PUBLIC_IP  | No       |               | The public ip address of your server. If left empty, https://api.ipify.org/ will be used to determine your current ip address |
| ASTRO_SERVER_OWNER_NAME | Yes      |               | Name or the server owner (Steam username)                                                                                     |
| ASTRO_SERVER_PASSWORD   | Yes      |               | Server password                                                                                                               |

## 

## Using an existing save game

You can import an existing save game to the server via the following commands.



Be aware that this must be done BEFORE the server runs the first time.

```
# Create the server but do not start it
docker componse create 

# Get the container id via docker ps
docker ps -a

# Copy the save game to the container's /tmp dir
docker cp MY_SAVE_GAME.savegame <<CONTAINER ID>>:/tmp/SERVER.savegame
```



The server will check the /tmp dir on the first run and copy the save game to the SaveGames folder.



## Starting the server

You can use the provided docker-compose.yml to start the server. 

Just create a .env file in the same directory and add the necessary env vars.



If you want to import an existing save game, do it like described above.

Then run:

```
docker compose up -d
```



This may take a few minutes if the server runs the first time as it installs the server software via steamcmd and launches the server to make sure all necessary .ini files were created.



## Backups

Backups are created every 10 minutes under `/backup` (backup volume in docker compose).

These backups are only kept for the current day and are removed by a cleanup job that  periodically runs.

The latest backup of each day gets moved to `/backup/daily` 

### 

### Restoring a backup

Atm. there is no script to restore a backup (WIP) but you can restore a backup manually with the following steps:



```
# Copy the backup
docker cp <<CONTAINER_ID>>:/backup/<<BACKUP FILE PATH>> ./MY_BACKUP.savegame

# Stop the server
docker compose stop

# Get the volume name (volume astroneer: in docker-compose.yml)
docker volume ls

# Remove the astroneer volume that contains the current save game
docker volume rm <<VOLUME NAME>>

# Copy the backup to the container's /tmp dir
docker cp MY_BACKUP.savegame <<CONTAINER ID>>:/tmp/SERVER.savegame

# Run the server
docker compose up -d
```
