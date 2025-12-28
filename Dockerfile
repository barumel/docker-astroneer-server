FROM amd64/debian:trixie

ENV DEBIAN_FRONTEND="noninteractive"
ENV GE_PROTON_VERSION="10-27"
ENV STEAMCMD_PATH="/steamcmd"
ENV STEAM_COMPAT_CLIENT_INSTALL_PATH="/steamcmd"
ENV STEAM_COMPAT_DATA_PATH="/steamcmd/steamapps/compatdata/728470"
ENV PROTON_LOG="1 %command%"
ENV PROTON_LOG_DIR="/steamcmd"

# Add user and create necessary directories
RUN set -ex; \
  useradd --home-dir /home/steam --create-home steam; \
  mkdir -p $STEAM_COMPAT_DATA_PATH; \
  mkdir -p /geproton; \
  mkdir -p /astroneer; \
  mkdir -p /backup; \
  mkdir -p /backup/daily; \
  mkdir -p /backup/restore;

# Update and install packages
RUN set -ex; \
  dpkg --add-architecture i386; \
  apt-get update; \
  apt-get install -y \
  apt-transport-https \
  ca-certificates \
  wget \
  vim \
  xvfb \
  ca-certificates \
  lib32gcc-s1 \
  winbind \
  curl \
  locales \
  gnupg \
  tzdata;

# Update locales
RUN set -ex; \
  echo "en_US.UTF-8 UTF-8" > /etc/locale.gen; \
  locale-gen en_US.UTF-8; \
  dpkg-reconfigure locales; \
  /usr/sbin/update-locale LANG=en_US.UTF-8;

# Install nodejs
RUN set -ex; \
  mkdir -p /etc/apt/keyrings; \
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg; \
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" > /etc/apt/sources.list.d/nodesource.list; \
  apt-get update; \
  apt-get -y install --no-install-recommends nodejs

# Download steamcmd
RUN set -ex; \
  cd /steamcmd; \
  wget -qO- 'https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz' | tar zxf -; \
  chmod +x /steamcmd/steamcmd.sh

# Download and extract proton
RUN curl -sqL "https://github.com/GloriousEggroll/proton-ge-custom/releases/download/GE-Proton${GE_PROTON_VERSION}/GE-Proton${GE_PROTON_VERSION}.tar.gz" | tar zxvf - -C "/geproton" --strip-components=1

# Copy files and install node modules
COPY ./files/ ./
RUN rm -rf /srv/node_modules
RUN set -ex; \
  cd /srv; \
  npm install

# Adjust permissions to make sure the steam user can execute stuff
RUN set -ex; \
  chmod +x /usr/bin/entrypoint.sh; \
  chown -R steam:root /steamcmd; \
  chown -R steam:root /geproton; \
  chown -R steam:root /astroneer; \
  chown -R steam:root /backup; \
  chown -R steam:root /tmp

WORKDIR /steamcmd

USER steam

# ENTRYPOINT ["tail", "-f", "/dev/null"]

ENTRYPOINT ["/usr/bin/entrypoint.sh"]

EXPOSE 8777
