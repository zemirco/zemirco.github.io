---
layout: post
description:

title: Secure CouchDB by using SSL/HTTPS
---

Over the holidays I spent some time making CouchDB work over SSL/HTTPS. The official docs are awesome but it still requires some effort. [How Do I Configure SSL (HTTPS) in CouchDB?](https://cwiki.apache.org/confluence/pages/viewpage.action?pageId=48203146) helped me a lot! The most important part comes at the end. Make sure you **don't use Ubuntu 14.04 LTS**. It cost me one day to find out. I'm using **Ubuntu 14.10** and now everything works fine.

## Create SSL Private Key and Certificate Signing Request

Start by creating a private key and a certificate signing request. Obviously you should have [OpenSSL](https://www.openssl.org/) installed.

```bash
openssl req -new -nodes -keyout server_key.pem -out server_csr.pem -newkey rsa:2048
```

`-nodes` (_no DES_) tells openssl to create a private key that is not encrypted. No worries! Not encrypted doesn't mean something is wrong or your SSL connection won't be secure. It simply means a password is not required to access the key file. As CouchDB needs to have access to this file a password is usually not used. If you have to use a password leave out `-nodes` and add the [password](http://docs.couchdb.org/en/latest/config/http.html#ssl/password) to CouchDB's `local.ini`.

```ini
[ssl]
password = somepassword
```

You'll be asked a couple of questions. Here's how I answered them.

- Country Name (2 letter code) []: **DE**
- State or Province Name (full name) []: **Hessen**
- Locality Name (eg, city) []: **Darmstadt**
- Organization Name (eg, company) []: **MyDomain.com**
- Organizational Unit Name (eg, section) []: **IT**
- Common Name (e.g. server FQDN or YOUR name) []: __*.mydomain.com__
- Email Address []: **admin@mydomain.com**

- Please enter the following 'extra' attributes
to be sent with your certificate request
  - A challenge password []:
  - An optional company name []:

When you're done you should have two new files. `server_key.pem` is your private key and should be kept private at all times.

```
-----BEGIN RSA PRIVATE KEY-----
qowihqd987qOIH...
-----END RSA PRIVATE KEY-----
```

`server_csr.pem` is your certificate signing request. Send it to your SSL provider and you'll get back a valid certificate and maybe additional intermediate certificates.

```
-----BEGIN CERTIFICATE REQUEST-----
qwpdojpj981IOH...
-----END CERTIFICATE REQUEST-----
```

I purchased a wildcard certificate from RapidSSL to secure my database and my domain. Your common name should look something like this `*.mydomain.com`. This certificate can be used for as many subdomains as you like. For example one subdomain for CouchDB `https://couchdb.mydomain.com:6984` and another one for the actual app `https://www.mydomain.com` or `https://mydomain.com`.

The answer from your SSL provider includes the final certificate for your CouchDB and very often so-called [intermediate certificates](http://en.wikipedia.org/wiki/Intermediate_certificate_authorities). They are either included as attachments or you have to copy&paste them from the email body. Create a new file `server_cert.pem` and paste the certificate. Make sure you don't include any blank lines by accident.

```
-----BEGIN CERTIFICATE-----
WDOIHwdnoiq897wd...
-----END CERTIFICATE-----
```

Create another new file `intermediate.pem` and copy&paste the other certificates from the email. This is the only file that has multiple certificates with multiple `-----BEGIN CERTIFICATE-----` and `-----END CERTIFICATE-----`.

```
-----BEGIN CERTIFICATE-----
POJOPJWDPOJD...
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
qwdqwdOHIHOIH..
-----END CERTIFICATE-----
```

Again make sure all certificates don't contain any blank lines at the beginning or at the end.

## Install CouchDB

I'm hosting my CouchDB at [Digital Ocean](https://www.digitalocean.com/?refcode=77a9b70b9c31) (referral link). At first I used AWS EC2 but the t2.micro
and t2.small instances were noticeable slower. If you really want to stick with
EC2 use a high storage instance like i2.xlarge. Those are much more expensive than
Digital Ocean though.

Installing CouchDB is pretty straightforward. Take a look at the docs for some extra explanation.

```bash
# secure server
sudo apt-get update -y
sudo apt-get upgrade -y
sudo apt-get install fail2ban -y

# install dependencies
sudo apt-get install -y \
  build-essential \
  erlang-base-hipe \
  erlang-dev \
  erlang-manpages \
  erlang-eunit \
  erlang-nox \
  libicu-dev \
  libmozjs185-dev \
  libcurl4-openssl-dev

# install couchdb 1.6.1
wget http://apache.mirror.iphh.net/couchdb/source/1.6.1/apache-couchdb-1.6.1.tar.gz
tar -xvzf apache-couchdb-*
cd apache-couchdb-*
./configure
make && sudo make install

# create couchdb user
sudo adduser --disabled-login --disabled-password --no-create-home --gecos "" couchdb

# uncomplicated firewall
sudo apt-get install ufw -y
# allow ssh
ufw allow 22
# allow CouchDB HTTP port
ufw allow 5984
# allow CouchDB HTTPS port
ufw allow 6984
# activate firewall
ufw enable

# change ownership of couchdb directories
sudo chown -R couchdb:couchdb /usr/local/var/lib/couchdb
sudo chown -R couchdb:couchdb /usr/local/var/log/couchdb
sudo chown -R couchdb:couchdb /usr/local/var/run/couchdb
sudo chown -R couchdb:couchdb /usr/local/etc/couchdb

# change permission of couchdb directories
sudo chmod 0770 /usr/local/var/lib/couchdb
sudo chmod 0770 /usr/local/var/log/couchdb
sudo chmod 0770 /usr/local/var/run/couchdb
sudo chmod 0770 /usr/local/etc/couchdb/*.ini
sudo chmod 0770 /usr/local/etc/couchdb/*.d

# setup logrotate and autostart
sudo ln -s /usr/local/etc/logrotate.d/couchdb /etc/logrotate.d/couchdb
sudo ln -s /usr/local/etc/init.d/couchdb /etc/init.d
```

Now the important part to enable SSL and HTTPS.

```bash
# create directory for ssl certificates
sudo mkdir /usr/local/etc/couchdb/certs
sudo touch /usr/local/etc/couchdb/certs/server_cert.pem
sudo touch /usr/local/etc/couchdb/certs/server_key.pem
sudo touch /usr/local/etc/couchdb/certs/intermediate.pem

# change ownership
sudo chown -R couchdb:couchdb /usr/local/etc/couchdb/certs/
```

Copy&Paste your key and certificates to your server into the corresponding files. Then start your CouchDB.

```bash
# install couchdb as a service and allow it to start on boot
sudo update-rc.d couchdb defaults

# go
sudo /etc/init.d/couchdb start
```

## Add Logging

I use [papertrail](https://papertrailapp.com/?thank=86d6ae) (referral link) for logging. If you use something else or don't want to configure logging right now you can simple skip this section. Here is how to send your CouchDB logs to papertrail.

Create a config file for [remote syslog](https://github.com/papertrail/remote_syslog2) `/etc/log_files.yml`.

```yaml
files:
  - /usr/local/var/log/couchdb/couch.log
  destination:
    host: logs.papertrailapp.com
    port: 12345   # NOTE: change to your Papertrail port
```

Use papertrail for server and CouchDB logs.

```bash
# send server logs with rsyslog - NOTE: change to your Papertrail port
sudo /bin/su -c "echo '*.* @logs.papertrailapp.com:12345' >> /etc/rsyslog.conf"

# activate changes
sudo service rsyslog restart

# install remote_syslog
cd ~
wget https://github.com/papertrail/remote_syslog2/releases/download/v0.13/remote_syslog_linux_amd64.tar.gz
tar -xvzf remote_syslog_*

# add executable to bin
cd remote_syslog
sudo cp ./remote_syslog /usr/local/bin

# start remote_syslog
sudo remote_syslog

# auto starting at boot
sudo touch /etc/init.d/remote_syslog
# IMPORTANT! paste contentes from https://github.com/papertrail/remote_syslog2/blob/master/examples/remote_syslog.init.d
sudo chmod 755 /etc/init.d/remote_syslog
sudo update-rc.d remote_syslog defaults
```

## Configure CouchDB

Open your CouchDB URL and create an admin user by clicking "Fix this" in the bottom right corner. Then open your CouchDB `local.ini` at `/usr/local/etc/couchdb` and edit/uncomment the following lines. Or click on "Configuration" in your CouchDB admin panel in your browser.

```ini
[httpd]
bind_address = 0.0.0.0

[couch_httpd_auth]
require_valid_user = true

[daemons]
httpsd = {couch_httpd, start_link, [https]}

[ssl]
cert_file = /usr/local/etc/couchdb/certs/server_cert.pem
key_file = /usr/local/etc/couchdb/certs/server_key.pem
cacert_file = /usr/local/etc/couchdb/certs/intermediate.pem
```

Now restart CouchDB and everything should work fine.

```bash
sudo /etc/init.d/couchdb restart
```

## Test Installation and Configuration

To make sure you've got everything working correctly use an SSL validator.
[SSL Checker](https://www.sslshopper.com/ssl-checker.html) from SSLShopper is quite nice as it supports ports other than 443. If everything went well you should see
something like my result.

![CouchDB SSL check](https://s3.amazonaws.com/mircozeiss.com/couchdb-ssl.png)

## Done

Congratulations, you're done. I hope you liked this walkthrough. Merry Christmas and a Happy New Year!
