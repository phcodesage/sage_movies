@echo off
echo Building Sage Movies application...

:: Create dist directory if it doesn't exist
if not exist dist mkdir dist
if not exist dist\public mkdir dist\public
if not exist dist\public\css mkdir dist\public\css
if not exist dist\public\js mkdir dist\public\js

:: Clean any existing files
echo Cleaning previous build...
if exist dist\server.js del /Q dist\server.js
if exist dist\package.json del /Q dist\package.json
if exist dist\functions\* del /Q dist\functions\*
if exist dist\public\* del /Q dist\public\*

:: Copy server files
echo Copying server files...
copy server.js dist\
copy package.json dist\
if exist functions\* xcopy /E /I /Y functions dist\functions

:: Copy client files
echo Copying client files...
if exist public\css\* xcopy /E /I /Y public\css dist\public\css
if exist public\js\* xcopy /E /I /Y public\js dist\public\js
copy public\index.html dist\public\
if exist public\favicon.ico copy public\favicon.ico dist\public\
if exist public\logo192.png copy public\logo192.png dist\public\
if exist public\manifest.json copy public\manifest.json dist\public\

echo Build completed successfully!
echo Build output is in the dist directory.
