const {applications, addons, AddOn, Application, provision} = require('casti')
const {Service, Failure, Success, fetch} = require('pico')

// generate Clever Cloud file
provision.shell(`
  #mkdir ~/.config/;
  cat > ~/.config/clever-cloud << EOF
  {"token":"${process.env.CC_TOKEN}","secret":"${process.env.CC_SECRET}"}
  EOF  
`).when({
  Failure: error => console.log(`😡 clever-cloud config`, error),
  Success: out => console.log(`😃 clever-cloud config`, out)
})

// copy SSH key from bucket
// you must copy it on Clever Cloud admin too
console.log("private key:", process.env.CC_SSH_PRIVATE)
console.log("public key:", process.env.CC_SSH_PUB)

provision.shell(`
  cp ${process.env.CC_SSH_PRIVATE}  ~/.ssh/id_rsa
  cp ${process.env.CC_SSH_PUB} ~/.ssh/id_rsa.pub
  chmod 600 ~/.ssh/id_rsa
  chmod 600 ~/.ssh/id_rsa.pub
`).when({
  Failure: error => console.log(`😡 ssh keys`, error),
  Success: out => console.log(`😃 ssh keys`, out)
})

provision.shell(`
  git config --global user.name "${process.env.CC_USER}"
  git config --global user.email "${process.env.CC_USERMAIL}"
  git config --global credential.helper "cache --timeout=3600"
`).when({
  Failure: error => console.log(`😡 git config`, error),
  Success: out => console.log(`😃 git config`, out)
})

let port = process.env.PORT || 8080;

let deployService = new Service({})

let checkToken = token => 
  token == process.env.DEPLOY_TOKEN
  ? Success.of(token)
  : Failure.of("😡 Bad token")

/* === SHELL === */
/*  
  curl -H "Content-Type: application/json" -H "Token: hophophop" -X POST -d \
  '{"shell": "clever create -t node mykillerapp -o wey-yu -a mykillerapp"}' \
  http://hop.cleverapps.io/api/deploy/shell
*/
deployService.post({uri:`/api/deploy/shell`, f: (request, response) => {
  let data = request.body
  let token = request.headers['token']

  checkToken(token).when({
    Failure: err => response.sendJson({message: "😡", error: err}),
    Success: () => {
      shell(data.shell).when({
        Failure: err => response.sendJson({message: "😡", error: err}),
        Success: res => response.sendJson({message: "😃", result: res})
      })
    }
  })
}})

/* === FROM GIT CLONE === */

/** TODO
 * - add environment variables
 * - change the size of the VM
 * - try with private repository
 * - fix pico line 161 when error ...
 */

/*  
  curl -H "Content-Type: application/json" -H "Token: bobmorane" -X POST -d '{"organization":"wey-yu", "applicationName":"myapp", "domainName":"myapp", "applicationType":"node", "repository":"https://github.com/k33g/pico-hello-service.git"}' http://hop.cleverapps.io/api/deploy/repository
*/

deployService.post({uri:`/api/deploy/repository`, f: (request, response) => {
  let data = request.body
  let token = request.headers['token']

  let organization = data.organization
  let applicationName = data.applicationName
  let domainName = data.domainName
  let applicationType = data.applicationType // eg: node
  let repository = data.repository

  console.log("👋 ===== repository =====")
  console.log("organization", organization)
  console.log("applicationName", applicationName)
  console.log("domainName", domainName)
  console.log("applicationType", applicationType)
  console.log("repository", repository)

  checkToken(token).when({
    Failure: err => response.sendJson({message: "😡", error: err}),
    Success: () => {
      /*=== deploy an application ===*/

      // === define the application ===
      let rawApp = Application.of({
        type: applicationType,
        localPath: `${process.cwd()}/applications`, 
        name: `${applicationName}`,
        displayName: `${applicationName}`,
        domain: `${domainName}`,
        organization: organization,
        region: applications.Regions.PARIS,
        scale: applications.Scales.MEDIUM, // 👈 TODO 
        addonsNames: [""],
        environmentVariables: ["PORT=8080"] // 👈 TODO      
      })
      // === end of define the application ===

      provision.gitClone(
        `${repository}`, 
        `${process.cwd()}/applications/${applicationName}`
      )

      // === create the application on Clever ☁️ ===
      rawApp.create({directoryExists:true}).when({ // directoryExists equals true because created with previous git clone command
        Failure: error => {
          console.log(`😡 Huston? We had a problem when creating application`, error)
          response.sendJson({message: "😡", error: err})
        },
        Success: services => { // {applications, addons}
              
          /*
            rawApp.addEnvironmentVariable(
              {name:`MY_VARIABLE`, value: "something"}
            )
          */

          rawApp.initializeGitRepository()
          rawApp.pushToClever()

          response.sendJson({application:rawApp})
        }      
      })    
      // === end of create the application on Clever ☁️ ===


    } // end of Success token
  }) // end of checking token
}}) // end od POST

/* === CASTI SCRIPT === */
/**
 * load the script from a repository ?
 * load the script from the fs bucket
 */
deployService.post({uri:`/api/deploy/casti`, f: (request, response) => {
  let data = request.body
  let token = request.headers['token']

  let organization = data.organization
  let applicationName = data.applicationName
  let domainName = data.domainName

  checkToken(token).when({
    Failure: err => response.sendJson({message: "😡", error: err}),
    Success: () => {
      /*=== deploy from casti script ===*/

      // 🚧

    } // end of Success token
  }) // end of checking token
}}) // end od POST

/* === GITBUCKET === */
/* SAMPLE
  curl -H "Content-Type: application/json" -H "Token: bobmorane" -X POST -d \
  '{"organization":"wey-yu", "applicationName":"gbhop", "domainName":"gbhop"}' \
  http://hop.cleverapps.io/api/deploy/gitbucket
*/
deployService.post({uri:`/api/deploy/gitbucket`, f: (request, response) => {
  let data = request.body
  let token = request.headers['token']

  let organization = data.organization
  let applicationName = data.applicationName
  let domainName = data.domainName

  checkToken(token).when({
    Failure: err => response.sendJson({message: "😡", error: err}),
    Success: () => {
      /*=== deploy gitbucket ===*/

      /*--- FSbucket definition ---*/
      let fsBucketAddOn = AddOn.of({
        type: addons.Types.FSBUCKET,
        name: `fs-bucket-${applicationName}`,
        organization: organization,
        plan: addons.Plans.FSBUCKET.SMALL,
        region: addons.Regions.EU
      })

      /*--- FSbucket creation, then Application creation ---*/

      fsBucketAddOn.create().when({
        Failure: error => console.log(`😡 Huston? We had a problem when creating addon`, error),
        Success: result => {
          console.log(`😃  ${result.addon.type.name} AddOn ${result.addon.name} is ok`)
          
          // === define the application ===
          let gitBucketApplication = Application.of({
            type: applications.Types.WAR,
            localPath: `${process.cwd()}/applications`, 
            name: `${applicationName}`,
            displayName: `${applicationName}`,
            domain: `${domainName}`,
            organization: organization,
            region: applications.Regions.PARIS,
            scale: applications.Scales.MEDIUM,
            addonsNames: [result.addon.name],
            environmentVariables: ["JAVA_VERSION=8", "GITBUCKET_HOME=/app/storage/.gitbucket", "PORT=8080"]
          })
      
          // === create the application locally and on Clever ☁️ ===
          gitBucketApplication.create({directoryExists:false}).when({ 
            Failure: error => console.log(`😡 Huston? We had a problem when creating application`, error),
            Success: services => { // {applications, addons}
              
              // define the main folder
              gitBucketApplication.createFSBucketFolder({path:"storage"})
              // download the war file to local repository
              gitBucketApplication.downloadAssets({
                from: "https://github.com/gitbucket/gitbucket/releases/download/4.15.0/gitbucket.war",
                targetName: "gitbucket.war"
              })
              
              // create clever configuration file, then deploy
              gitBucketApplication.createJsonJarFile({jarName:"gitbucket.war"})
              gitBucketApplication.initializeGitRepository()
              // deploy
              gitBucketApplication.pushToClever()

              //response.sendJson({services})
              response.sendJson({application:gitBucketApplication})
            } 
          })
      
        }
      }) // end of creation

    } // end of Success token
  }) // end of checking token
}}) // end od POST

/* === JENKINS === */
/* SAMPLE
  curl -H "Content-Type: application/json" -H "Token: bobmorane" -X POST -d \
  '{"organization":"wey-yu", "applicationName":"jenkinshop", "domainName":"jenkinshop"}' \
  http://hop.cleverapps.io/api/deploy/jenkins
*/
deployService.post({uri:`/api/deploy/jenkins`, f: (request, response) => {
  let data = request.body
  let token = request.headers['token']

  let organization = data.organization
  let applicationName = data.applicationName
  let domainName = data.domainName

  checkToken(token).when({
    Failure: err => response.sendJson({message: "😡", error: err}),
    Success: () => {
      /*=== deploy jenkins ===*/
      /*--- FSbucket definition ---*/
      let fsBucketAddOn = AddOn.of({
        type: addons.Types.FSBUCKET,
        name: `fs-bucket-${applicationName}`,
        organization: organization,
        plan: addons.Plans.FSBUCKET.SMALL,
        region: addons.Regions.EU
      })

      fsBucketAddOn.create().when({
        Failure: error => console.log(`😡 Huston? We had a problem when creating addon`, error),
        Success: result => {
          console.log(`😃  ${result.addon.type.name} AddOn ${result.addon.name} is ok`)
          
          // === define the application ===
          let jenkinsApplication = Application.of({
            type: applications.Types.WAR,
            localPath: `${process.cwd()}/applications`, 
            name: `${applicationName}`,
            displayName: `${applicationName}`,
            domain: `${domainName}`,
            organization: organization,
            region: applications.Regions.PARIS,
            scale: applications.Scales.MEDIUM,
            addonsNames: [result.addon.name],
            environmentVariables: ["JAVA_VERSION=8", "JENKINS_HOME=/app/storage/.jenkins", "PORT=8080"]
          })
      
          // === create the application locally and on Clever ☁️ ===
          jenkinsApplication.create({directoryExists:false})
          jenkinsApplication.createFSBucketFolder({path:"storage"})
      
          jenkinsApplication.downloadAssets({
            from:"http://mirrors.jenkins.io/war/latest/jenkins.war", targetName:"jenkins.war"
          })
      
          jenkinsApplication.createJsonJarFile({jarName:"jenkins.war"})
          jenkinsApplication.initializeGitRepository()
          // deploy 
          jenkinsApplication.pushToClever()
          
          response.sendJson({application:jenkinsApplication})
        }
      })      

    } // end of Success token
  }) // end of checking token
}}) // end od POST

/* === HUBOT === */
deployService.post({uri:`/api/deploy/hubot`, f: (request, response) => {
  let data = request.body
  let token = request.headers['token']

  let organization = data.organization
  let applicationName = data.applicationName
  let domainName = data.domainName

  checkToken(token).when({
    Failure: err => response.sendJson({message: "😡", error: err}),
    Success: () => {
      /*=== deploy hubot ===*/

      // 🚧

    } // end of Success token
  }) // end of checking token
}}) // end od POST

/* === LETSCHAT === */
deployService.post({uri:`/api/deploy/letschat`, f: (request, response) => {
  let data = request.body
  let token = request.headers['token']

  let organization = data.organization
  let applicationName = data.applicationName
  let domainName = data.domainName

  checkToken(token).when({
    Failure: err => response.sendJson({message: "😡", error: err}),
    Success: () => {
      /*=== deploy letschat ===*/

      // 🚧

    } // end of Success token
  }) // end of checking token
}}) // end od POST



deployService.get({uri:`/`, f: (request, response) => {
  response.sendHtml(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta http-equiv="x-ua-compatible" content="ie=edge">
        <title>Hop Services</title>
        <meta name="description" content="">
        <meta name="viewport" content="width=device-width, initial-scale=1">
    
        <style>
        .container
        {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          text-align: center;
        }
        .title
        {
          font-family: "Source Sans Pro", "Helvetica Neue", Arial, sans-serif;
          display: block;
          font-weight: 300;
          font-size: 100px;
          color: #35495e;
          letter-spacing: 1px;
        }
        .subtitle
        {
          font-family: "Source Sans Pro", "Helvetica Neue", Arial, sans-serif;
          font-weight: 300;
          font-size: 42px;
          color: #526488;
          word-spacing: 5px;
          padding-bottom: 15px;
        }
        .littlesubtitle
        {
          font-family: "Source Sans Pro", "Helvetica Neue", Arial, sans-serif;
          font-weight: 300;
          font-size: 28px;
          color: #526488;
          word-spacing: 5px;
          padding-bottom: 15px;
        }    
        .links
        {
          padding-top: 15px;
        }
        .nolink , .nolink:visited, .nolink:hover, .nolink:active
        {
          text-decoration: none;
          color: inherit;
        }
        </style>
      </head>
      <body>
        <section class="container">
          <div>
            <h1 class="title">
              HOP will be soon alive 🚀
            </h1>
            <h2 class="subtitle">
              👷 work in progress with 💕 & 🤖 by @k33g_org
            </h2>
            <h3 class="littlesubtitle">
              <a class="nolink" href="">Deploy GitBucket</a><br>
              <a class="nolink" href="">Deploy Jenkins</a><br>
              <a class="nolink" href="">Deploy what you want from Jenkinsfile</a><br>
              <a class="nolink" href="">Deploy ...</a>
            </h3>
          </div>
        </section>
      </body>
    </html>
  `)
}})

deployService.start({port: port}, res => {
  res.when({
    Failure: error => console.log("😡 Houston? We have a problem!", error),
    Success: port => {
      console.log(`🌍 hop deploy service is listening on ${port}`)
      provision.shell(`
        clever --version
      `)
    }
  })
})