# docker-astroneer-server

## Breaking Change in 3.x: Client Encryption

With the latest Proton releases now supporting the encryption algorithm used by Astroneer’s dedicated server, **encryption is enabled by default again** in this project.

If you previously followed the old instructions to **disable client‑side encryption**, you must revert those changes. Clients with `net.AllowEncryption=False` will no longer be able to connect to servers running current versions of this container.



### What You Need to Do

#### Re-enable encryption

If you modified your `Engine.ini` as previously instructed, remove the override or set encryption back to `True`.



##### Option 1: Edit the file manually

Open:

```shell
%LocalAppData%\Astro\Saved\Config\WindowsNoEditor\Engine.ini
```

Remove the line:

```shell
net.AllowEncryption=False
```

Or change it to:

```shell
net.AllowEncryption=True
```

##### Option 2: Use the provided .bat file

```shell
clientNetEnableEncryption.bat
```



#### Linux Clients

Make sure you use the latest proton version or try the latest proton-ge-custom build: [Releases · GloriousEggroll/proton-ge-custom · GitHub](https://github.com/GloriousEggroll/proton-ge-custom/releases)



You can still disable encryption via `ASTRO_SERVER_DISABLE_ENCRYPTION` env variable but be aware that encryption must be disabled on all clients in this case.



#### Unable to connect after update

First check the server status [https://astroservercheck.joejoetv.de/](https://astroservercheck.joejoetv.de/)



Check if the latest version of the server is installed. If not try to remove the existing volumes and restart the container. 

See the **Troubleshooting** section at the end of this Readme



## 



## System requirements

| Component   | Minimum Requirement                                    |
| ----------- | ------------------------------------------------------ |
| **CPU**     | 2 cores                                                |
| **RAM**     | 4 GB total system RAM (≈2–3 GB free for the container) |
| **Storage** | 10–15 GB free                                          |

## 

## 

## Router / Firewall

Make sure you configured your router to forward the configured port (default 8777) to your server machine.

Also open this port on your firewall if you have one.

There is no general way to do this as it varies depending on the router / firewall used.

## 

## 

## Configuration

The following configuration values are currently available

| VAR                             | Required | Default Value | Description                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------- | -------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ASTRO_SERVER_NAME               | Yes      |               | The name or your server.                                                                                                                                                                                                                                                                                                                                                                                                  |
| ASTRO_SERVER_PORT               | No       | 8777          | Custom server port                                                                                                                                                                                                                                                                                                                                                                                                        |
| ASTRO_SERVER_PUBLIC_IP          | No       |               | The public ip address (v4) of your server. If left empty, https://api.ipify.org/ will be used to determine your current ip address (recommended).                                                                                                                                                                                                                                                                         |
| ASTRO_SERVER_DOMAIN_NAME        | No       |               | Optional domain name to resolve the ip for the server. <br/>Only use this if the IP address returned from https://api.ipify.org/ is not correct and your host has a domain name that can be resolved.<br/>Be aware that you can't connect to the server with this domain name, it's just a helper to determine the ip address of your server. You will still have to connect to the server with `<<IP_ADDRESS>>:<<PORT>>` |
| ASTRO_SERVER_OWNER_NAME         | Yes      |               | Name or the server owner (Steam username)                                                                                                                                                                                                                                                                                                                                                                                 |
| ASTRO_SERVER_PASSWORD           | Yes      |               | Server password                                                                                                                                                                                                                                                                                                                                                                                                           |
| ASTRO_SERVER_DISABLE_ENCRYPTION | No       | false         | Disable server encryption (Legacy mode)                                                                                                                                                                                                                                                                                                                                                                                   |

## 

## 

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

## 

## 

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

## 

## 

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
docker compose create

# Get the container id
docker ps -a

# Copy the backup file
# Adjust the file name to your current active save game name (if you did not create a new save game via UI the default is SAVE_1)
docker cp SAVE_1.savegame <<CONTAINER_ID>>:/backup/restore/SAVE_1

# Start the server
docker compose up -d
```

### 

## 

## Encryption Support

Astroneer’s dedicated server now fully supports encrypted network traffic when running under modern Proton/Wine versions. **Encryption is enabled by default** in this container to ensure secure communication between clients and the server.

Most users should keep encryption enabled, as it improves compatibility with current Astroneer clients and aligns with the game’s intended network behavior.

### Disable Encryption (Optional)

For advanced or troubleshooting scenarios, you can explicitly disable server‑side encryption by setting the environment variable:

```shell
ASTRO_SERVER_DISABLE_ENCRYPTION=true
```

When this flag is set:

- The server starts with encryption turned **off**

- Clients must also disable encryption in their `Engine.ini` to connect

- This mode is intended only for legacy setups, debugging, or environments where Proton/Wine encryption support is unavailable

### Client‑side change required

If you disable encryption on the server, clients must add the following to:

```shell
%LocalAppData%\Astro\Saved\Config\WindowsNoEditor\Engine.ini
```

```ini
[SystemSettings]
net.AllowEncryption=False
```

OR run the disable encryption bat

```shell
clientNetDisableEncryption.bat
```

Without this matching setting, clients will fail to connect.

## 



## Troubleshooting

### Cannot connect to the server

Check if your server ip / port is correct. Currently only IP v4 adresses are supported. It is not possible to join the server via domain name or IP v6.

Also make sure that you are using your pubic IP address. Connecting via local ip address does not work! You can get the full server uri in the server log.

Example: `123.456.7.89:8777`

Use the server checker provided by @JoeJoeTV to check if your server shows online [[https://astroservercheck.joejoetv.de/](https://astroservercheck.joejoetv.de/)

If it is online

- Check if other people (not in your LAN) can join the server. If so, this indicates an issue with NAT Loopback.
  
  Your router must support NAT Loopback (Hairpinning) which lets clients 
  from inside your Network connect to the server via its public IP 
  address. Some routers don't support this at all, on some you'll have to 
  enable it first. Check your router manual.

If it is not online or has issues

- Check your router configuration / port forwarding. The server port 
  (default 8777) must point to the machine the container is running on.

- Make sure the port is not blocked by a firewall





### SteamCMD Does Not Update the Server When Using Existing Volumes

In previous versions, the Astroneer server files stored in your Docker volume could cause **SteamCMD to skip updates**, even though the container runs `app_update` on every startup. This happened because SteamCMD relies on metadata inside the game directory (such as the `appmanifest_728470.acf` file) to determine whether an update is needed. When this metadata becomes stale or mismatched, SteamCMD incorrectly reports that the server is already up to date.

Starting with this release, **you must ensure your existing Astroneer data volume is refreshed** so SteamCMD can correctly detect and install updates.

#### What You Need to Do

**1. Stop the container**

```shell
docker compose stop
```

**2. Backup your save game**

Make sure you manually backed up your save game before performing these steps (Copy the save game to the host)!



Check the **Restore a backup** section above for detailed instructions



**3. Remove your existing Astroneer volume**

```shell
docker volume rm docker-astroneer-server_astroneer
docker volume rm docker-astroneer-server_steamcmd
```

This will delete the astroneer server files as well as the steam cmd files.

 

**4. Start the container**

```shell
docker compose up -d
```

### 



### Discord

You can join the official Astroneer Discord server: [ASTRONEER](https://discord.com/invite/astroneer).

Check the pinned messages in the self-hosted-talk channel as many common issues already have been solved there.



**Support Note**

Please **do not ask questions about this server image in the official Astroneer Discord**.
I’m not active there, and the community members and moderators are not familiar with this image, so they won’t be able to help with issues related to it.

If you run into problems or have questions, please use the issue tracker or discussion section of this repository instead
