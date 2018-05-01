Production Notes For AWS Deployment
===================================

Building the Docker image
-------------------------

This procedure is based on the automated CI script from bitbucket-pipelines.yml and is designed
to be run using MacOS 10.13.1 (High Sierra) but can be modified for building on Linux.

#### Prerequisites
* Docker v18.03+ ([Docker for Mac](https://www.docker.com/docker-mac))
* Node v8.11.1
* yarn v1.6.0
* Angular CLI 1.7.4
* Build tools for native node modules (e.g. XCode for macOS or build-essential for Ubuntu)

```bash
# Clone a *clean* copy of the GitHub repo
git clone https://github.com/FutureCitiesCatapult/TomboloVisualisationSuite.git cde
cd cde
```

Build the backend server:
```bash
# Server build
yarn
npm run version
npm run build
```

Build the frontend client:
```bash
# Client build
cd client
yarn
npm run build
```

Build the Docker image:
```bash
# Build the docker image
cd ..
docker build -t citydataexplorer .
```

Tag the image and push to DockerHub:

```bash
docker tag citydataexplorer [organization]/citydataexplorer
docker push [organization]/citydataexplorer
```

Set up AWS Aurora PostgreSQL DB
-------------------------------

The production DB is an AWS Aurora PostgresSQL DB. From the AWS console, navigate to Amazon RDS.
Launch a new Aurora DB instance and select the 'PostgreSQL-compatible' edition. The smallest instance type
(db.r4.large) should be sufficient. You may wish to create a replica in a different availability zone although
this is not necessary for a non-critical demo instance.

Enter a name for the DB and choose a master username and password.

The 'advanced settings' may be left at their default values. By default the DB will be accessible via
a public IP address. This facilitates setup of the DB but you may sibsequently want to restrict access to the DB
once setup is complete.

Follow the setup procedure outlined in create_db.sh to create the default user, database, add required
extensions and restore the database dump.

To target the remote AWS database use the -h (host) and -U (user) options. e.g.:

```bash
createuser -h [remote host] -U [master username] -d -P tombolo_cde
createdb -h [remotedb] -U tombolo_cde tombolo_cde -E UTF8
psql -h [remotedb] -U [master username] -d tombolo_cde -c "CREATE EXTENSION postgis;"
psql -h [remotedb] -U [master username] -d tombolo_cde -c "CREATE EXTENSION \"uuid-ossp\";"

# Restore db dump
pg_restore -h [remotedb] -U tombolo_cde --username=tombolo_cde --no-privileges --dbname=tombolo_cde --no-owner -v ./db/db.dump
```

Set up EC2 Instance and install Docker
--------------------------------------
Ubuntu Server 16.04 LTS (HVM), SSD Volume Type - ami-f90a4880
t2.medium
16GB SSD storage
Key pair

Verify you can SSH:
```
# SSH into EC2 instance
ssh -i ~/.ssh/[key].pem ubuntu@ec2-54-171-208-71.eu-west-1.compute.amazonaws.com
```

Install Docker:
```bash
# Install Docker using get.docker.com script
curl -fsSL get.docker.com -o get-docker.sh
ubuntu@ip-172-31-38-106:~$ sudo sh get-docker.sh
sudo usermod -aG docker ubuntu
docker --version
```

Exit and reconnect SSH for the group membership to take effect.

Install Docker Compose:

```bash
sudo curl -L https://github.com/docker/compose/releases/download/1.21.0/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version
```
