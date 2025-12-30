@echo off
where node >nul 2>&1 && node .vscode/eslint || echo ''
