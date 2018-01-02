const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const csv = require('fast-csv');

const baseURL = 'http://www.shirts4mike.com/';
const scrapeArray = [["Title", "Price", "ImageURL", "URL", "Time"]];

const currentDate = getCurrentDate();

// Initialize counter variable to keep track of scrapeArray index inside .each() loop

var i = 1;

// Get current date

function getCurrentDate() {
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth()+1; //January is 0!
  var yyyy = today.getFullYear();

  if(dd<10) {
      dd = '0'+dd
  } 

  if(mm<10) {
      mm = '0'+mm
  } 

  today = yyyy + '-' + mm + '-' + dd;

  return today;
}

// Get current time

function currentTime() {
  var str = "";

  var currentTime = new Date()
  var hours = currentTime.getHours()
  var minutes = currentTime.getMinutes()
  var seconds = currentTime.getSeconds()

  if (minutes < 10) {
      minutes = "0" + minutes
  }
  if (seconds < 10) {
      seconds = "0" + seconds
  }
  str += hours + ":" + minutes + ":" + seconds + " ";
  if(hours > 11){
      str += "PM"
  } else {
      str += "AM"
  }
  return str;
}

// Scrape website function

function scrapeSite() {

  // GET request for each link in the product list

  request('http://shirts4mike.com/shirts.php', function (error, response, body) {

    if (!error && response.statusCode == 200) {

      // Create data directory if it doesn't already exist

      const dataDir = './data';

      if (!fs.existsSync(dataDir)){
        
        fs.mkdirSync(dataDir);

      } 

      const ws = fs.createWriteStream(`./data/${currentDate}.csv`);

      const $ = cheerio.load(body);

      $('.products a').each(function() {

            const productLink = $(this).attr('href');
            const shirtURL = baseURL + productLink;

            // Scrape info from each product page

            getShirtInfo(shirtURL);

         }); // end .each

      // Use setTimeout() to ensure all data has been loaded into scrapeArray before writing to the .csv file

      setTimeout(function(){
        csv.write(scrapeArray, {headers:true}).pipe(ws);
      },2000);

    } else {

      console.log("There’s been a 404 error. Cannot connect to the to http://shirts4mike.com.");

      fs.appendFileSync('scraper-error.log', "There’s been a 404 error. Cannot connect to the to http://shirts4mike.com." + 
         " " + getCurrentDate() + " " + currentTime() + "\n");

    } // end if statement

  }); // end request

} // end scrapeSite


// Scrape info from each product page function

function getShirtInfo(shirtURL) {

  // GET request for each link in the product list

    request(shirtURL, function (error, response, body) {

      if (!error && response.statusCode == 200) {

        const $$ = cheerio.load(body);

        // Get title
        //OLD: $$('.shirt-details h1').contents().not($$('.price')).each(function(){
          $$('#content').each(function(){

          scrapeArray[i] = [];

          // scrapeArray[i].push($$(this).text());

          // Push shirt title to scrapeArray

          scrapeArray[i].push($$('.shirt-details h1').contents().not($$('.price')).text());

          // Push price to scrapeArray

          scrapeArray[i].push($$('.price').text());

          // Push image URL to scrapeArray

          scrapeArray[i].push(baseURL + $$('.shirt-picture span img').attr('src'));

          // Push URL to scrapeArray

          scrapeArray[i].push(shirtURL);

          // Push time to scrapeArray

          scrapeArray[i].push(currentTime());

          i++;

        });
        
        } else {

          console.log("There’s been a 404 error. Cannot connect to the to http://shirts4mike.com.");

        }

    }); // end request

} // end getShirtInfo

// Scrape website

scrapeSite();



