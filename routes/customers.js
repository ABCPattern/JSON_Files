const errors = require('restify-errors');
// const custom = require('../customer.json');
const {writeFile, readFileSync, readFile, appendFileSync, writeFileSync} = require('fs');
// console.log(custom.address);
const emailValidator = require('deep-email-validator');
const Joi = require('joi');

//Validation handling
const validationmiddleware = (req, res, next) => {
    const schema = Joi.object().keys({
        id: Joi.number().integer().required(),//id should be number 
        name: Joi.string().required().min(2),//name should have minimum 2 letters
        order_count: Joi.number().integer().required().min(0).max(100),//order count can be 0-100
        address: Joi.string().required(),
        Country: Joi.string().custom((value,msj)=>{
            if(value == "xyz"){
                return msj.message("Not allowed");
            }
            else{
                return true;
            }
        }).when('Indian', {is:'No', then:Joi.required(), otherwise:Joi.optional()}),

        Indian: Joi.string().required().valid("Yes", "No", "yes", "no"),
        Languages: Joi.array().required(),
        Fullname: Joi.object().keys({
            first:Joi.string().required(),
            middle:Joi.string().optional(),
            last: Joi.string().required()
        }).optional(),
        // firstname: Joi.string(),
        // lastname:Joi.string(),
        email: Joi.string().email({
            minDomainSegments:2, 
            tlds:{allow:["com", "in"]}
        }).required()
    })//.xor('firstname','lastname')
    .unknown(true);
    const {error} = schema.validate(req.body, {abortEarly:false});
    if(error){
        const {details} = error;
        res.status(200);
        res.json({details: details});
    }
    else{
        next();
    }
}


const data = readFileSync("./customer.json", 'utf-8', (err, data)=>{
    //Error handling while reading the file
    if(err){
        console.log(err);
        return;
    }
});


module.exports = server =>{
    //Print JSON file
    server.get('/customer', (req, res, next) => {
        const filedata = JSON.parse(data);
        // console.log(req.url.pathname);
        res.end(JSON.stringify(filedata));
        next();
    }) 
    
    //Add new customer info to file
    server.post('/customer', (req, res, next) =>{
        // res.send(req.body);

        if(data.length == 0){//if file is empty
            console.log("New file created");
            writeFileSync("./customer.json", JSON.stringify(req.body, null, 2));
            res.send(json);
        }
        else{//if file contains data then append
            const json = JSON.parse(data);
            //Checking datatype for id
            if(typeof req.body.id != "number"){
                console.log("ID should be an integer");
                res.end();
                next(); 
                return;
            }
            if(req.body.name.length < 2){
                console.log("Length of name should be greater than 2");
                res.end();
                next();
                return;
            }
            if(typeof req.body.order_count != "number"){
                console.log("order_count should be an integer");
                res.end();
                next();
                return;
            }
            if(!emailValidator.validate(req.body.email)){
                console.log("Please enter the valid email address");
                res.end();
                next();
                return;
            }
        
            //handling duplicate data
            for(let i = 0;i<json.length;i++){
                if(json[i].id == req.body.id){
                    console.log("Duplicate ID found");
                    res.end();
                    next();
                    return;
                }
            }

            json.push(req.body);
            // res.send(json);
            writeFileSync("./customer.json", JSON.stringify(json, null, 2));
            res.send(json);
        }
        res.end();
        next();
    })


    //Change customer info by id
    server.put('/customer/:id', (req, res, next) => {
        let id = req.params.id;
        let name= req.body.name;
        let order_count= req.body.order_count;
        let address= req.body.address;
        
        const json = JSON.parse(data);
        let index = -1;
        // console.log(parseInt(req.params.id));
        for(let i = 0; i<json.length;i++){
            if(json[i].id== parseInt(req.params.id)){
                console.log(json[i].id+1);
                index = i;
                // console.log(index);
            }
        }
        //if ID is not present
        if(index == -1){
            console.log("Given ID info is not present");
            res.end();
            next();
            return;
        }
        // console.log(index);
        if(index >= 0){
            const custom_info = json[index];
            custom_info.name = name;
            custom_info.order_count = order_count;
            custom_info.address = address;
            res.json(custom_info);
            writeFileSync("./customer.json", JSON.stringify(json, null, 2));
            res.send(json);
        }
        else{
            res.status(404);
        }
        res.end();
        next();
    })


    //Delete customer info by id
    server.del('/customer/:id', (req, res, next) => {
        let id = req.params.id;
        
        const json = JSON.parse(data);
        let index = -1;
        for(let i = 0; i<json.length;i++){
            if(json[i].id == id){
                index = i;
            }
        }
        //if ID not found
        if(index == -1){
            console.log("Given ID is not present");
            res.end();
            next();
            return;
        }
        if(index >= 0){
            const custom_info = json[index];
            json.splice(index, 1);
            res.json(custom_info);
            console.log(json)
        }
        else{
            res.status(404);
        }
        res.end();
        next();
    })

    server.post('/validation', validationmiddleware, (req, res, next) => {
        // let id = req.body.id;
        // let name = req.body.name;
        // let order_count = req.body.order_count;
        // let address = req.body.address;
        // let email = req.body.email;

        res.send(req.body);
        res.end();
    })
}