var express = require('express');
var csvFilePath ='./db/shipments.csv';
var csv = require('csvtojson');
var app = express();

var shipmentData ='./db/shipments.csv';
var companyData ='./db/companies.csv';
var productData ='./db/products.csv';
var shipmentProductsData ='./db/shipment_products.csv';

app.get('/api/v1/shipments', (req,res)=>{
  // read from csv and make json

  if(!req.query.company_id){
    res.status(422).json({
      errors: ["company_id is required"]
    });
    res.send("LOLOLOLOL");
  }

  var shipments = [];
  var companies = [];
  var products = [];
  var shipmentProducts = [];
  var company_id = req.query.company_id;
  var sort = req.query.sort;
  var direction = req.query.direction;
  var mode = req.query.international_transportation_mode;

  //Get shipment Data
  csv().fromFile(shipmentData).on('json',(ship) => {
    shipments.push(ship);
  }).on('done',(error)=>{
    //Get company Data
    csv().fromFile(companyData).on('json',(com) => {
      companies.push(com);
    }).on('done',(error)=>{
      //Get product Data
      csv().fromFile(productData).on('json',(produ) => {
        products.push(produ);
      }).on('done',(error)=>{
        //Get shipmentProduct Information
        csv().fromFile(shipmentProductsData).on('json',(jsonObj) => {
          shipmentProducts.push(jsonObj);
        }).on('done',(error)=>{
          //Test case 1
          var recordsArray = [];
          for(var i = 0; i < shipments.length; i++){
            if(shipments[i].company_id === company_id){
              shipments[i].products = [];
              recordsArray.push(shipments[i])
            }
          }

          var shipPro = [];
          for(var j = 0; j < recordsArray.length; j++){
            for(var k = 0; k < shipmentProducts.length; k++){
              if(recordsArray[j].id === shipmentProducts[k].shipment_id){
                shipPro.push(shipmentProducts[k]);
              }
            };
          };

          // console.log(shipPro);

          var myProds = [];
          for(var l = 0; l < shipPro.length; l++){
            for(var m = 0; m < products.length; m++){
              if(shipPro[l].product_id === products[m].id){
                products[m].quantity = shipPro[l].quantity;
                products[m].shipment_id = shipPro[l].shipment_id;
                myProds.push(Object.assign({}, products[m]));
              }
            }
          }

          //set active shipment count
          // var fml = [];
          for(var p = 0; p < myProds.length; p++){
            myProds[p].active_shipment_count = 0;
            for(var q = 0; q < myProds.length; q++){
              if(myProds[p].id === myProds[q].id){
                myProds[p].active_shipment_count++;
              }
            }
            // fml.push(myProds[p])
            // fml.push(Object.assign({}, myProds[p]));
          }

          //For each time a product appears increment active count
          for(var n = 0; n < myProds.length; n++){
            for(var o = 0; o < recordsArray.length; o++){
              if(myProds[n].shipment_id === recordsArray[o].id){
                recordsArray[o].products.push(myProds[n]);
              }
            }
          }

          //Make Id into integers

          for(var lo = 0; lo < recordsArray.length; lo++){
            recordsArray[lo].id = parseInt(recordsArray[lo].id);
          }
          recordsArray.sort((a,b)=>{
            return a.id > b.id;
          });

          if(sort === 'international_departure_date'){
            if(direction === 'asc'){
              recordsArray.sort(function(a,b){
                return Date.parse(a.international_department_date)>Date.parse(b.international_department_date)
              });
            }else{
              recordsArray.sort(function(a,b){
                return Date.parse(a.international_department_date)<Date.parse(b.international_department_date)
              });
            }
          }

          if(mode === 'ocean'){
            recordsArray = recordsArray.filter((item) => {
              return item.international_transportation_mode === 'ocean'
            })
          }else if(mode === 'truck'){
            recordsArray = recordsArray.filter((item) => {
              return item.international_transportation_mode === 'truck'
            })
          }


          var solution = []
          if(!req.query.page){
            solution = recordsArray.slice(0,4);
          }else{
            if(req.query.per){
              solution = renderPagination(recordsArray,parseInt(req.query.page),parseInt(req.query.per));
            }else{
              solution = renderPagination(recordsArray,parseInt(req.query.page),4);
            }
          }



          // console.log(myProds);
          //console.log(shipPro.length);
          // console.log(recordsArray);
          res.json({
            records: solution
          });

        });
      });
    });
  });
});

function renderPagination(temp,pageno, max_num) {
    return temp.slice( (pageno - 1) * max_num, pageno * max_num );
}


//TEST CASE 1 PASSES
// app.get('/api/v1/shipments', (req,res)=>{
//   // read from csv and make json
//   var myResults = [];
//   var compArray = [];
//   var company_id = req.query.company_id;
//
//   csv().fromFile(csvFilePath).on('json',(jsonObj) => {
//     myResults.push(jsonObj);
//   }).on('done',(error)=>{
//     for(var i = 0; i < myResults.length; i++){
//       if(company_id === myResults[i].company_id){
//         compArray.push(myResults[i])
//       }
//     }
//     console.log(compArray);
//     res.json({
//       records: compArray
//     });
//   });
// });

app.listen(3000);
