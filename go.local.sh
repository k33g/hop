#!/bin/bash

json=$(cat  << EOF
{
  "organization":"wey-yu", 
  "applicationName":"hop-demo-2", 
  "domainName":"hop-demo-2", 
  "applicationType":"node", 
  "repository":"https://github.com/k33g/pico-hello-service.git", 
  "branch":"wip-yo"
}
EOF
)

curl \
-H "Content-Type: application/json" \
-H "Token: bobmorane" \
-X POST -d "$json" http://localhost:8080/api/deploy/repository
