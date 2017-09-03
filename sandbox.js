const {Service, Failure, Success, fetch} = require('pico')


let port = process.env.PORT || 8080;

let deployService = new Service({})


deployService.get({uri:`/yo`, f: (request, response) => {

  response.sendHtml(`hello`)

  


}})

deployService.start({port: port}, res => {
  res.when({
    Failure: error => console.log("😡 Houston? We have a problem!", error),
    Success: port => {
      console.log(`🌍 hop deploy service is listening on ${port}`)
    }
  })
})