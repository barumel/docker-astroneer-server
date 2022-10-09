#!/bin/bash

# Run wineboot on startup to make sure the WINEPREFIX directory is not empty.
# This would normally be done when starting the application the first time
# but as it required user interaction, the startup process hangs
echo "RUN WINEBOOT TO ENSURE NECESSARY FILES"
DISPLAY= wineboot -u
echo "DONE..."

# Remove the Xvfb lock file if it exists
echo "REMOVE XVFB LOCK FILE IF IT EXISTS"
rm -rf /tmp/.X99-lock
echo "DONE..."

echo "START BACKUP"
node /srv/backup.js &

# Start the servier
echo "RUN THE SERVER"
node /srv/server.js





echo "ENTRYPOINT SCRIPT DONE..."

# Keep the container alive
tail -f /dev/null







# OLD STUFF
# start Xvfb
# xvfb_display=0
# rm -rf /tmp/.X$xvfb_display-lock
# Xvfb :$xvfb_display -screen 0, 640x480x24:32 -nolisten tcp &
#export DISPLAY=:$xvfb_display

# ./steamcmd.sh +runscript /tmp/install.txt

# ./steamcmd.sh +@sSteamCmdForcePlatformType windows +login anonymous +force_install_dir /astroneer +app_update 728470 validate +quit

# wine ${STEAMAPPDIR}/AstroServer.exe -nosteamclient -game -server -log -nosteamclient -game -server -log
