#!/bin/bash
while true; do
    node dist/index.js
    echo "Backend crashed at $(date), restarting..."
    sleep 2
done
