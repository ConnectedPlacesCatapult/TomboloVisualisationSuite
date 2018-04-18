City Data Explorer
==================

Prerequisites
-------------

- node v8.9.1+
- yarn v1.5.1+
- PostgreSQL 9.5+
- Angular CLI (yarn global add @angular/cli)
- Build tools for native npm modules (e.g. XCode for MacOS or build-essential for Ubuntu)

Preparation of the Database
---------------------------
The backend server requires connection to a PostGIS/PostgreSQL9.5+ database. Create the tombolo database using
your PostgreSQL client of choice, add a user for use by the app and add the following two extensions to the database:

```psql
create extension "postgis";
create extension "uuid-ossp";
```

Installation of Basemap Tiles 
-----------------------------
The backend server requires an OpenStreetMap extract covering your area of support (e.g. UK/Planet-wide).
Download the desired extract as an `mbtiles` file from [OpenMapTiles](https://openmaptiles.com/downloads/planet/]).
OSM extracts from OpenMapTiles are free for non-commercial use. Please read the Terms and Conditions thoroughly before using.

Place the file in a directory accessible to your backend server. 

Configuration
-------------
[node-config](https://github.com/lorenwest/node-config) is used for app configuration. The base configuration
can be found in `config/default.toml`. To change configuration parameters, you can edit this file or override
the default configuration by:
 
 - setting environment variables as specified in `custom-environment-variables.toml`
 - create a local override file `conifg/local.toml`. This is excluded from git commits in `.gitignore`
 
 We strongly advise using environment variables or `local.toml` to specify passwords
for DB connection and SMTP configuration rather than commiting passwords to GitHub.

#### Essential Configuration Parameters

DB and SMTP connection parameters *must* be set before the app will run. An example `local.toml` file is shown below:

```toml
# Set public URL of host server
[server]
baseUrl = "https://mypublicfacing.dataexplorer.com"

# Configure DB connection
[db]
host = "mydbhost"
port = 5432
username = "tombolo"
password = "tombolo"
database = "tombolo_dev"

# Configure SMTP server
[smtp]
host = 'mysmtpserver.com'
port = 587
secure = false

#Configure SMTP auth credentials
[smtp.auth]
user = 'mySMTPusername'
pass ='mySMTPpassword'

```

Development
-----------

A local development instance of the app can be run using the following commands.

```bash
# Run backend server
yarn install
yarn run dev

#Run frontend client
cd client
yarn install
yarn start
```

In development mode, all source files are watched and any changes made will trigger a rebuild.


Preparation of the default map
------------------------------
On running the backed server for the first time, required database tables are created. 

After running for the first time, shut down the server and import the basemap styles and palettes using the following psql command:

```bash
psql -h [host] -U [username] [dbname] < ./db/basemaps_palettes.sql
```

Once this has been done, the default map (which is shown when the app is started) must currently be created by hand. To create
the default dataset that is used for basemaps add the following row to the `datasets` table in the database.

```sql
INSERT INTO public.datasets (id, name, description, "sourceType", source,  "minZoom", "maxZoom", extent, headers, "createdAt", "updatedAt", "is_private") 
  VALUES (
  '38080fa1-e5c3-487d-8347-3532d071c8a6', 
  'openmaptiles_uk', 
  'OSM UK extract from OpenMapTiles', 
  'tilelive', 
  'mbtiles:///data/mbtiles/2017-07-03_europe_great-britain.mbtiles', 
  0, 
  14, 
  '{-180.00000000000000000,-90.00000000000000000,180.00000000000000000,90.00000000000000000}', 
  '{"Cache-Control":"public, max-age=86400"}', 
  '2017-01-01 00:00:00.000000 +00:00', 
  '2017-01-01 00:00:00.000000 +00:00',
  FALSE);
```
Replace the source value with the path to you mbtiles file (e.g. `mbtiles:///data/mytiles.mbtiles`);

To create the default map, add the following row to the `maps` table in the database.

```sql
INSERT INTO public.maps (id, name, "createdAt", "updatedAt", basemap_id, zoom, center, is_private) 
VALUES (
'950db2c7-1a3b-448d-9b21-444a0ec7b5e0', 
'Default Map',
'2018-03-07 09:48:09.137000 +00:00',
'2018-03-08 11:33:47.099000 +00:00',
'fjord', 
4.6, 
'{-0.58455999995931050,54.91938000004640000}',
FALSE);
```

Production
----------

Running this web app in production is beyond the scope of this README. However, we have provided
a `Dockerfile` and example Docker compose files for deploying the app as a Docker container.
You can follow the steps in the file `bitbucket-pipelines.yml` to build a Docker image of
the complete app.

The backend server is generally stateless and can be deployed as a load-balanced cluster of instances.
Stateful sessions are used only for holding login information and session content is persisted in the
backend database.

Documentation
-------------
Documentation is generated with [TypeDoc][1]. Use `/** .. **/`-style doc comments for classes,
function and methods.

To generate documentation:
```bash
npm run gen-doc
```

To view documentationn:
```bash
npm run view-gen
```





[1]: http://typedoc.org/
