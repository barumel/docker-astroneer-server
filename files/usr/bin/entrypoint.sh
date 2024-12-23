#!/bin/bash
set -e

# https://github.com/lloesche/valheim-server-docker/blob/main/valheim-updater#L140
# This works around the `Unable to determine CPU Frequency. Try defining CPU_MHZ.` steamcmd issue (#184).
verify_cpu_mhz() {
    local float_regex
    local cpu_mhz
    float_regex="^([0-9]+\\.?[0-9]*)\$"
    cpu_mhz=$(grep "^cpu MHz" /proc/cpuinfo | head -1 | cut -d : -f 2 | xargs)
    if [ -n "$cpu_mhz" ] && [[ "$cpu_mhz" =~ $float_regex ]] && [ "${cpu_mhz%.*}" -gt 0 ]; then
        echo "Found CPU with $cpu_mhz MHz"
        unset CPU_MHZ
    else
        echo "Unable to determine CPU Frequency - setting a default of 1.5 GHz so steamcmd won't complain"
        export CPU_MHZ="1500.000"
    fi
}

# Remove the Xvfb lock file if it exists
echo "REMOVE XVFB LOCK FILE IF IT EXISTS"
rm -rf /tmp/.X99-lock
echo "DONE..."

verify_cpu_mhz

echo "UPDATE STEAM CMD"
bash /steamcmd/steamcmd.sh +quit

echo "UPDATE ASTRO SERVER"
bash /steamcmd/steamcmd.sh +runscript /tmp/install.txt

# Check for first run
if [ ! -f /astroneer/initialized ]; then
  echo "Server seems to run the first time!"
  echo "Start the server once to make sure all config files were created..."

  /geproton/proton run /astroneer/Astro/Binaries/Win64/AstroServer-Win64-Shipping.exe
  touch /astroneer/initialized
  mkdir -p /astroneer/Astro/Saved/SaveGames

  echo "Init done... continue"
fi

# Check if we have to restore a backup
if [ ! -n "$(find "/backup/restore" -prune -empty)" ]; then
  node /srv/src/restore.js
fi

node /srv/src/initConfig.js

# https://unix.stackexchange.com/questions/336411/how-can-i-run-two-commands-in-parallel-and-terminate-them-if-one-of-them-termina
/geproton/proton run /astroneer/Astro/Binaries/Win64/AstroServer-Win64-Shipping.exe & p1=$!
node /srv/src/initBackupAndHealtCheck.js & p2=$!

wait -n
[ "$?" -ge 0 ] || kill "$p1" "$p2"
wait

echo "D'oh"
