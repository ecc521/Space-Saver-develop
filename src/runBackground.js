//This does not allow for nodejs API's to be accessed.



//code is the function (or stringified function) to be run. 
//options can contain the following properties:
    //parameters - Used to pass parameters to the function that is being run.
    //await - true if the function that is being called is asynchronus, and should be awaited.

//Has lots of browser support issues
    
function runBackground(code, options) {

    let text;
    let obj = {}
    
    
    let parameters = options.parameters || [];
    
    //Allow the user to pass just a single parameter
    if (parameters.length === undefined || typeof parameters === "string") {
        parameters = [parameters]
    }
    
    console.log(parameters)
    
    text = `
self.onmessage = function(parameters) {
    parameters = parameters.data
    let result = ${options.await ? "await ":""}(${code})(...parameters);
    postMessage({
        type:"message", 
        finished:true, 
        content:result
    })
}`
    console.log(text)
    
 
    
    let blob = new Blob([text])
    let url = URL.createObjectURL(blob)
    
    
    //obj.onmessage and obj.onerror should be used instead of obj.worker.onmessage
    
    obj.worker = new Worker(url)
    
    //The worker doesn't actually activate until obj.init() is called.
    obj.result = new Promise(function(resolve,reject){
                       
        //Handle messages from worker
        obj.worker.onmessage = function(message) {
                
            message = message.data
            
            if (message.finished) {
                //Return the final value
                resolve(message.content)
            }
            else if (obj.onmessage) {
             obj.onmessage(message)
            }    
                
        }
          
        //Force people to use obj.onmessage instead of obj.worker.onmessage
        //We don't want them overwriting our listeners

        Object.defineProperty(obj.worker, "onmessage", {
            configurable:false,
            writable: false,
            value: obj.worker.onmessage //If I inlined the function here, it wasnt working
        })
        
    })
    
    obj.init = function() {
        obj.worker.postMessage(parameters)
        delete obj.init;
        return obj; //Allow chaining
    }
        
   
    return obj;
}


module.exports = {
    runBackground
}