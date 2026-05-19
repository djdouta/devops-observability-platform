#!/bin/bash

while true; do
  curl -s http://localhost:3000/orders > /dev/null &
  curl -s http://localhost:3000/login > /dev/null &
  curl -s http://localhost:3000/logout > /dev/null &
  curl -s http://localhost:3000/shop > /dev/null &
  curl -s http://localhost:3000/checkout > /dev/null &
  sleep 0.5
done
