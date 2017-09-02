const {applications, addons, AddOn, Application, provision} = require('casti')
const {Service, Failure, Success, fetch} = require('pico')

// generate Clever Cloud file
provision.shell(`
  #mkdir ~/.config/;
  cat > ~/.config/clever-cloud << EOF
  {"token":"${process.env.CC_TOKEN}","secret":"${process.env.CC_SECRET}"}
  EOF  
`)

// generate SSH key
// you must copy it on Clever Cloud admin too

provision.shell(`
  cp buster ~/.ssh/buster;
  cp buster.pub ~/.ssh/buster.pub
`)

provision.shell(`
  git config --global user.name "${process.env.CC_USER}"
  git config --global user.email "${process.env.CC_USERMAIL}"
  git config --global credential.helper "cache --timeout=3600"
`)

let port = process.env.PORT || 8080;

let deployService = new Service({})

let checkToken = token => 
  token == process.env.DEPLOY_TOKEN
  ? Success.of(token)
  : Failure.of("😡 Bad token")


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
            localPath: `${process.cwd()}/applications`, // process.cwd(): current directory, to run this sample you must add a sub directory `application`
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

              response.sendJson({services})
            } 
          })
      
        }
      }) // end of creation

    } // end of Success token
  }) // end of checking token
}}) // end od POST


deployService.get({uri:`/`, f: (request, response) => {
  response.sendHtml(`
    <h1>Hop Server</h1>
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