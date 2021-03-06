# hop
Some ☁️ experiments


```
# create a fs bucket for this application
# Link the bucket to the application
CC_FS_BUCKET=/storage:bucket-...-fsbucket.services.clever-cloud.com

# Get the Clever CLI secret and token (from ~/.config/clever-cloud)
CC_SECRET=...
CC_TOKEN=...

# Generate a ssh keys pair and copy the 2 keys to the bucket (with no password)
# Don't forget to register the public key on Clever Cloud
CC_SSH_PRIVATE=/app/storage/buster
CC_SSH_PUB=/app/storage/buster.pub

# define a git user with the same email used for the ssh keys generation
CC_USER=busterbunny69
CC_USERMAIL=buster.bunny.69@gmail.com

# give a token (a little security trick)
DEPLOY_TOKEN=...

# Clever Cloud applications must listen on 8080
PORT=8080
```

## Create a nodejs application with shell

```bash
curl -H "Content-Type: application/json" -H "Token: hophophop" -X POST -d \
'{"shell": "clever create -t node mykillerapp -o wey-yu -a mykillerapp"}' \
http://hop.cleverapps.io/api/deploy/shell
```

## Deploy from a git repository

```bash
curl -H "Content-Type: application/json" -H "Token: bobmorane" -X POST -d \
'{"organization":"wey-yu", "applicationName":"myapp", "domainName":"myapp", "applicationType":"node", "repository":"https://github.com/k33g/pico-hello-service.git"}, "branch":"master"}' \
http://hop.cleverapps.io/api/deploy/repository
```

```bash
curl -H "Content-Type: application/json" -H "Token: bobmorane" -X POST -d \
'{"organization":"wey-yu", "applicationName":"myapp2", "domainName":"my_app_2", "applicationType":"node", "repository":"https://github.com/k33g/pico-hello-service.git", "branch":"wip-yo"}' \
http://hop.cleverapps.io/api/deploy/repository
```

## Deploy a gitbucket instance

```
curl -H "Content-Type: application/json" -H "Token: hophophop" -X POST -d \
'{"organization":"wey-yu", "applicationName":"gbhop", "domainName":"gbhop"}' \
http://hop.cleverapps.io/api/deploy/gitbucket
```

## Deploy a jenkins instance

```
curl -H "Content-Type: application/json" -H "Token: hophophop" -X POST -d \
'{"organization":"wey-yu", "applicationName":"jhop", "domainName":"jhop"}' \
http://hop.cleverapps.io/api/deploy/jenkins

```