#!/usr/bin/env bash
# First-time setup of one Ubuntu 24.04 server, following the server guide (sections 5-2 to 5-5):
# packages, automatic security updates, swap, an "app" account, SSH hardening, firewall, fail2ban.
# Run once as the default user:   sudo bash setup-server.sh
# Safe to run again. Output is in English because the Lightsail web terminal garbles Korean.
set -euo pipefail
[ "$(id -u)" = 0 ] || { echo "Run with sudo."; exit 1; }
step() { echo; echo "==== $* ===="; }

step "1/7 packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y -q
apt-get -y -q upgrade
# docker-buildx is needed: the image build checks the game archive's checksum, which the old builder cannot do.
apt-get install -y -q ufw fail2ban unattended-upgrades docker.io docker-compose-v2 docker-buildx git curl unzip
systemctl enable --now docker
# The AWS command line tool (for backups and alerts) is no longer an apt package on Ubuntu 24.04.
command -v aws >/dev/null || snap install aws-cli --classic || echo "aws-cli was not installed; backups need it (sudo snap install aws-cli --classic)"

step "2/7 automatic security updates"
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'CONF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
CONF

step "3/7 swap (2 GB safety net)"
if [ "$(swapon --noheadings | wc -l)" = 0 ]; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap -q /swapfile && swapon /swapfile
  grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
else echo "swap already on"; fi

step "4/7 app account"
id app >/dev/null 2>&1 || adduser --disabled-password --gecos "" app
usermod -aG docker app
# The app account accepts the same SSH keys as the account you logged in with, so deploys can use it.
SOURCE_HOME="$(getent passwd "${SUDO_USER:-ubuntu}" | cut -d: -f6)"
if [ -f "$SOURCE_HOME/.ssh/authorized_keys" ]; then
  install -d -m 700 -o app -g app /home/app/.ssh
  install -m 600 -o app -g app "$SOURCE_HOME/.ssh/authorized_keys" /home/app/.ssh/authorized_keys
fi

step "5/7 SSH: keys only, no root"
cat > /etc/ssh/sshd_config.d/60-nebula.conf <<'CONF'
PasswordAuthentication no
PermitRootLogin no
PubkeyAuthentication yes
MaxAuthTries 3
CONF
# The new settings are checked before the service is restarted, so a mistake cannot lock you out.
if sshd -t; then systemctl restart ssh; echo "SSH hardened: key-only, no root"; else rm -f /etc/ssh/sshd_config.d/60-nebula.conf; echo "SSH settings were rejected and removed"; fi

step "6/7 firewall"
# SSH stays open here on purpose: who may reach port 22 is decided in the Lightsail firewall, where
# "my IP only" can be combined with the browser terminal. Closing it here as well would lock out the browser terminal.
ufw default deny incoming >/dev/null
ufw default allow outgoing >/dev/null
ufw limit 22/tcp >/dev/null
ufw allow 80/tcp >/dev/null
ufw allow 443/tcp >/dev/null
ufw --force enable >/dev/null
ufw status verbose | sed -n 1,12p

step "7/7 fail2ban"
cat > /etc/fail2ban/jail.local <<'CONF'
[sshd]
enabled = true
maxretry = 3
bantime = 1h
findtime = 10m
CONF
systemctl enable --now fail2ban >/dev/null 2>&1 || true
systemctl restart fail2ban || true

echo
echo "Done. Next: sudo -iu app, clone the repository, fill in server/.env, then docker compose up -d."
