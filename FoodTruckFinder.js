#!/usr/bin/env node
var request = require('request');
var Table = require('cli-table');
var _APIURL = 'http://data.sfgov.org/resource/bbb8-hzi6.json';
  
// instantiating a table object for displaying result set
var table = new Table({
  head: ['NAME', 'ADDRESS','Time']
  , colWidths: [70, 40,20]
});

FoodTruckFinder(_APIURL);

function FoodTruckFinder(url){
  request(url, function (error, response, body) {
    var result = [];
    if(response.statusCode == 200){
      //get current time and day
      var currentTime = getPST();
      var currHours = currentTime.getUTCHours();
      var currDay = currentTime.getUTCDay();

      //traverse the list from response
      var count=1;
      JSON.parse(body).forEach(function(element) {
  
      //filter the items based on start & end time, which fall in the user time
      //check for day && hours
      if(parseInt(element["dayorder"])==currDay && 
        (currHours >= parseInt(element['start24']) && currHours < parseInt(element['end24']))){
          result.push([element["applicant"],element["location"],element['start24']+"-"+element['end24']]);
        }
      });
      result.sort(function(a,b){
        if(a[0] > b[0])
          return 1;
        if(a[0] < b[0])
          return -1;
        return 0;
      });
    }
    else{
      console.log("Error in retrieving data.Status code:"+response.statusCode);
      console.log("Error:"+error);
      console.log("Body:"+body);
      result = -1;
    }
    printResult(result);
  });
}


function printResult(arr,defaultSet=10){
  if(arr.length == 0){
    console.log("No food trucks found at this time.");
    process.exit();
  }
  if(arr == -1){
    console.log("Something went wrong. We are notified and we will get back to you soon.");
    process.exit();
  }
  var count;
  var resultCount = arr.length;
  for(count = 0;count<(resultCount>=defaultSet?defaultSet:resultCount);count++)
    table.push(arr[count]);
  console.log(table.toString());
  if(resultCount>defaultSet){
    process.stdout.write("Do you want more results Y/N?:");
    process.stdin.on("data",function(data){
      data = data.toString().trim();
      if(data=="y" || data=="Y"){
        var j = (count+defaultSet)>resultCount?resultCount:count+defaultSet;
        for(count;count<j;count++)
          table[count%defaultSet] = arr[count];
        for(count;count%defaultSet!=0;count++)
          table.pop();
        console.log(table.toString());
        if(count <= resultCount)
          process.stdout.write("Do you want more results Y/N?:");
        else
          process.exit();
      }
      else if(data=="n" || data=="N"){
        process.exit();
      }
      else
        console.log("Please try again.");
    });
  }
}

//function which return current user's time in PST
function getPST(){
  //get pst offset
  var pstOffset = 420*60*1000;
  
  //get user time in UTC
  var userTime = new Date();

  //get delta from offset
  var offsetDelta = userTime - pstOffset;

  //return UTC date obj with that delta
  return new Date(offsetDelta);
}

// to run locally, first install node and npm. then:
// $ npm install request && node FoodTruckFinder.js