FROM amd64/debian:bullseye

ENV WINEPREFIX=/wine
ENV WINEARCH=win64
# ENV WINEDEBUG=+all

RUN set -ex; \
  useradd --home-dir /home/steam --create-home steam; \
  mkdir -p /steamcmd; \
  mkdir -p /astroneer; \
  mkdir -p /backup; \
  mkdir -p /wine

RUN set -ex; \
  dpkg --add-architecture i386; \
  apt-get update; \
  apt-get install -y \
    apt-transport-https \
    ca-certificates \
    software-properties-common \
    wget \
    vim \
    xvfb \
    ca-certificates \
    lib32gcc-s1 \
    dnsmasq \
    winbind \
    curl \
    gnupg2;

RUN DEBIAN_FRONTEND=noninteractive apt-get install -y tzdata

RUN set -ex; \
  wget https://download.opensuse.org/repositories/Emulators:/Wine:/Debian/Debian_10/Release.key; \
  apt-key add Release.key; \
  echo "deb https://download.opensuse.org/repositories/Emulators:/Wine:/Debian/Debian_11 ./" >> /etc/apt/sources.list; \
  apt-get update; \
  apt-get install -y libfaudio0;

RUN set -ex; \
  wget https://dl.winehq.org/wine-builds/winehq.key; \
  apt-key add winehq.key; \
  apt-add-repository 'https://dl.winehq.org/wine-builds/debian/'; \
  apt-get update; \
  apt install -y --install-recommends winehq-stable; \
  apt-get clean;

# Install node
RUN curl -sL https://deb.nodesource.com/setup_18.x | bash -

RUN set -ex; \
  apt-get update; \
  apt-get install -y nodejs

# https://steamcommunity.com/app/221410/discussions/2/616189106498372437/?ctp=10
# https://hub.docker.com/r/chenhw2/dnsmasq/dockerfile
RUN set -ex; \
  apt-get remove --purge -y dnsmasq; \
  apt-get update; \
  apt-get install dnsmasq; \
  echo 'conf-dir=/etc/dnsmasq.d/,*.conf' > /etc/dnsmasq.conf; \
  echo "user=root" >> /etc/dnsmasq.conf

COPY ./files/ ./

RUN rm -rf /srv/node_modules

RUN ls -al /srv

RUN set -ex; \
  cd /srv; \
  npm install

RUN set -ex; \
  cd /steamcmd; \
  wget -qO- 'https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz' | tar zxf -; \
  chmod +x /steamcmd/steamcmd.sh

RUN chmod +x /usr/bin/entrypoint.sh

# Adjust permissions to make sure the steam user can execute stuff
RUN set -ex; \
  chown -R steam:root /steamcmd; \
  chown -R steam:root /astroneer; \
  chown -R steam:root /backup; \
  chown -R steam:root /wine; \
  chown -R steam:root /tmp

WORKDIR /steamcmd

USER steam

ENTRYPOINT ["/usr/bin/entrypoint.sh"]

EXPOSE 8777
