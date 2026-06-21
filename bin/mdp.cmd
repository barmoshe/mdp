@echo off
rem mdp: run the bundled MDP engine on Windows. Resolves this script's folder so
rem it works wherever the plugin is installed. Arguments pass through to build.mjs.
node "%~dp0..\packages\core\build.mjs" %*
