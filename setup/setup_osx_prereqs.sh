#!/bin/bash
# Script assumes brew is already installed
#
# To run:
# 1. Clone the repo
# 2. In terminal type ./setup/setup_osx.sh

echo "---------------------------------------------------"
echo "Installing Tombolo City Data Explorer Prerequisites"
echo "---------------------------------------------------"

echo "----------------------------------"
echo "Installing node v8"
echo "----------------------------------"
brew install node@8
brew link --force node@8

echo "----------------------------------"
echo "Installing yarn"
echo "----------------------------------"
brew install yarn --without-node

echo "----------------------------------"
echo "Installing Angular CLI"
echo "----------------------------------"
npm install -g @angular/cli

echo "----------------------------------"
echo "Installing PostgreSQL"
echo "----------------------------------"
brew install postgresql

echo "----------------------------------"
echo "Installing PostGIS"
echo "----------------------------------"
brew install postgis

echo "----------------------------------"
echo "Verifying installation"
echo "----------------------------------"
echo node: `node -v`
echo yarn: `yarn -v`
echo postgresql: `psql --version`
echo GDAL: `ogr2ogr --version`
