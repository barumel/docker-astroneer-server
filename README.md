# docker-astroneer-server

## Prerequisites

### Disable Encryption in Client

The current astroneer server implementation uses an encryption algorithm that is not supported by wine's implementation of bcrypt.dll.
Due to this issue, we have to disable encryption on the server side to make things work.

To be able to connect to the server you will have to disable encryption on the client side as well.

Locate the Engine.ini file on your file system (usually located under `<<User Home>>/AppData/Local/Astro/Saved/Config/WindowsNoEditor)` and add the following line to the bottom of the file:

```
[SystemSettings]
net.AllowEncryption=False
```

### Configure Router / Firewall

Make sure you configured your router to forward the configured port (default 8777) to your server machine.

Also open this port on your firewall if you have one.

There is no general way to do this as it varies depending on the router / firewall used.

## Configuration

The following configuration values are currently available

| VAR                     | Required | Default Value | Description                                                                                                                                 |
| ----------------------- | -------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| ASTRO_SERVER_NAME       | Yes      |               | The name or your server.                                                                                                                    |
| ASTRO_SERVER_PORT       | No       | 8777          | Custom server port                                                                                                                          |
| ASTRO_SERVER_PUBLIC_IP  | No       |               | The public ip address of your server. If left empty, https://api.ipify.org/ will be used to determine your current ip address (recommended) |
| ASTRO_SERVER_OWNER_NAME | Yes      |               | Name or the server owner (Steam username)                                                                                                   |
| ASTRO_SERVER_PASSWORD   | Yes      |               | Server password                                                                                                                             |

## Starting the server

You can use the provided docker-compose.yml to start the server.

Just create a .env file in the same directory and add the necessary env vars.

```Example
# Exampe .env
ASTRO_SERVER_NAME="My Astro Server"
ASTRO_SERVER_PASSWORD="Replace_me_with_a_Password!"
ASTRO_SERVER_OWNER_NAME="Your_Steam_Username"
```

If you want to import an existing save game, do it like described below.

Then run:

```
docker compose up -d
```

This may take a few minutes if the server runs the first time as it installs the server software via steamcmd and launches the server to make sure all necessary .ini files were created.

## Using an existing save game

You can import an existing save game to the server via the following commands.

```
# Stop the server if it is already running
docker compose down

# Create the container but do not start it
docker componse create

# Get the container id via docker ps
docker ps -a

# Copy the save game to the container's /backup/restore dir
# This will overwrite the automatically created SAVE_1 file. If you want to keep the current save game, make sure you choose a name that does not exist in the SaveGames folder
docker cp MY_SAVE_GAME.savegame <<CONTAINER ID>>:/backup/restore/SAVE_1


# Start the server
docker compose up -d
```

The server will check the /tmp dir on the first run and copy the save game to the SaveGames folder.

## Backups

Backups are created every 10 minutes under `/backup` (backup volume in docker compose).

These backups are only kept for the current day and are removed by a cleanup job that  periodically runs.

The latest backup of each day gets moved to `/backup/daily`

### Restore a backup

#### Manually restore

```shell
# Copy the backup to the local dir
docker cp <<CONTAINER_ID>>:/backup/<<BACKUP FILE PATH>> ./SAVE_1.savegame

# Stop the server
docker compose stop

# Create but don't start the container
docker-compose create

# Get the container id
docker ps -a

# Copy the backup file
# Adjust the file name to your current active save game name (if you did not create a new save game via UI the default is SAVE_1)
docker cp SAVE_1.savegame <<CONTAINER_ID>>:/backup/restore/SAVE_1

# Start the server
docker compose up -d
```
