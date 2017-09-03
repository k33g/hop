#!/bin/bash

json=$(cat  << EOF
{
  "organization":"wey-yu", 
  "applicationName":"hop-demo", 
  "domainName":"hop-demo-app", 
  "applicationType":"node", 
  "repository":"https://github.com/k33g/pico-hello-service.git", 
  "branch":"wip-yo"
}
EOF
)

curl \
-H "Content-Type: application/json" \
-H "Token: bobmorane" \
-X POST -d "$json" http://hop.cleverapps.io/api/deploy/repository
