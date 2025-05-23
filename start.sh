#!/bin/zsh

cd ~/portfolio-alfie

if ! lsof -i :4321 >/dev/null 2>&1; then
echo "🚀 Iniciando Astro..."
open http://localhost:4321 &
npm run dev
else
echo "⚠️ Astro ya está ejecutándose."
open http://localhost:4321
fi
