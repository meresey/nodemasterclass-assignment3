console.log('Hello World')


// delcare object to hold client side code
var app = {}

app.config = {
  sessionkey: null
}
app.client = {}

// AJAX Request method
app.client.request = function(headers,path,method,queryStringObject,payload,callback){

  // Set defaults
  headers = typeof(headers) == 'object' && headers !== null ? headers : {};
  path = typeof(path) == 'string' ? path : '/';
  method = typeof(method) == 'string' && ['POST','GET','PUT','DELETE'].indexOf(method.toUpperCase()) > -1 ? method.toUpperCase() : 'GET';
  queryStringObject = typeof(queryStringObject) == 'object' && queryStringObject !== null ? queryStringObject : {};
  payload = typeof(payload) == 'object' && payload !== null ? payload : {};
  callback = typeof(callback) == 'function' ? callback : false;

  // For each query string parameter sent, add it to the path
  var requestUrl = path+'?';
  var counter = 0;
  for(var queryKey in queryStringObject){
     if(queryStringObject.hasOwnProperty(queryKey)){
       counter++;
       // If at least one query string parameter has already been added, preprend new ones with an ampersand
       if(counter > 1){
         requestUrl+='&';
       }
       // Add the key and value
       requestUrl+=queryKey+'='+queryStringObject[queryKey];
     }
  }

  // Form the http request as a JSON type
  var xhr = new XMLHttpRequest();
  xhr.open(method, requestUrl, true);
  xhr.setRequestHeader("Content-type", "application/json");

  // For each header sent, add it to the request
  for(var headerKey in headers){
     if(headers.hasOwnProperty(headerKey)){
       xhr.setRequestHeader(headerKey, headers[headerKey]);
     }
  }

  // If there is a current session token set, add that as a header
  if(app.config.sessionkey){
    xhr.setRequestHeader("id", app.getToken());
  }

  // When the request comes back, handle the response
  xhr.onreadystatechange = function() {
      if(xhr.readyState == XMLHttpRequest.DONE) {
        var statusCode = xhr.status;
        var responseReturned = xhr.responseText;

        // Callback if requested
        if(callback){
          try{
            var parsedResponse = JSON.parse(responseReturned);
            callback(statusCode,parsedResponse);
          } catch(e){
            callback(statusCode,false);
          }

        }
      }
  }

  // Send the payload as JSON
  var payloadString = JSON.stringify(payload);
  xhr.send(payloadString);

};

//bindforms
app.bindforms = function () {
  if (document.querySelector('form')) {
    var allForms = document.querySelectorAll('form')
    for (var i = 0; i < allForms.length; i++) {
      allForms[i].addEventListener("submit", function (e) {
        e.preventDefault();
        var action = this.action;
        var method = this.method.toUpperCase();
        var id = this.id;
        // declare variable to hold payload
        var payload = {}
        // Gather form fields into an object
        var elements = this.elements
        for (var i=0; i < elements.length; i++) {
          if (elements[i].type !== 'input') {
            payload[elements[i].name] = elements[i].value
          }
        }

        // If the method is DELETE, the payload should be a queryStringObject instead
        var queryStringObject = method == 'DELETE' ? payload : {};
        // call api
        app.client.request(undefined,action,method,queryStringObject,payload,function(statusCode,responsePayload){
          if (statusCode !== 200) {
            document.querySelector('#formerror').innerHTML = responsePayload.Error
            document.querySelector('#formerror').className = "formerror"
          } else {
            // Notify user of successfull signup
            document.querySelector('#formerror').innerHTML = 'User created successfully'
            document.querySelector('#formerror').className = "formsuccess"
            

            // declare object to hold payload for singing in
            var loginData = {
              email: payload.email,
              password: payload.password
            }
            // Login user 
            app.client.request(undefined,'/api/login','POST',queryStringObject,loginData,function(statusCode,responsePayload){
              if (statusCode == 200) {
                // call function to persist token in local storage
                app.saveToken(responsePayload)
                // redirect to menu page
                window.location = "/menu"
                // var headers = {

                // }
                // app.client.request(headers,'/menu','GET',undefined,undefined,function(statusCode,responsePayload){
                  
                // })
               
              } else {
                console.log(responsePayload)
              } 
            })
          } 
        })

      }) // end of addevent listener function
    }
  }
}

app.validate = function (element,value) {
  switch (element) {
    case 'email':
      if (value.length === 0) return false
      if (value.includes('@')) return true;
      return true;
    case 'name':
      if (value.length === 0) return false
      return true
    case 'address':
      if (value.length === 0) return false
      return true
    case 'password':
      if (value.length === 0 || value !== document.querySelector('').value) return false
      return true
    default:
      return true
  }
}

// function to save token
app.saveToken = function(token) {
  app.config.sessionkey = token
  localStorage.setItem('id',token)
}

//function to retrieve token
app.getToken = function() {
  return localStorage.getItem('id')
}

window.onload = function () {
  console.log('loading')
  app.bindforms()
}