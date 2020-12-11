const express = require('express');
const app = express();
const port = 5000;
const path = require('path');
const hbs = require('hbs');
const axios = require('axios');
let countryCodeList = [];
require('dotenv').config();

//get the folder directory
const viewsPath = path.join(__dirname, '/views');
const publicDirectory = path.join(__dirname, '/public');

// set the path for the inc files (partials)
const partialPath = path.join(__dirname, '/views/inc');
hbs.registerPartials(partialPath);

//set express to use the static files
app.use(express.static(publicDirectory));

//set the view engine to hbs
app.set('view engine', 'hbs');

//setting the views from hbs to come from our views path variable
app.set('views', viewsPath);

//body parser?
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

//set express to use the static files
app.use(express.static(publicDirectory));

//set the view engine to hbs
app.set('view engine', 'hbs');

//setting the views from hbs to come from our views path variable
app.set('views', viewsPath);

app.get("/", async (req, res) => {
    const countryCode = await axios.get("https://restcountries.eu/rest/v2/all");
    countryCodeList = countryCode.data.map(country => {
        return (
            { name: country.name, alpha: country.alpha3Code }
        )
    });
    res.render("index", { list: countryCodeList })
});

app.post("/", async (req, res) => {
    const city = req.body.location;
    const country = req.body.countryCode;
    try {
        //add country code
        const myApi = await axios.get(`http://api.openweathermap.org/data/2.5/weather?q=${city},${country}&units=metric&appid=${process.env.API_KEY}`);
        const lat = myApi.data.coord.lat;
        const lon = myApi.data.coord.lon;
        const weatherIcon = myApi.data.weather[0].icon;
        const weatherAlt = myApi.data.weather[0].main.toLowerCase();
        const desc = myApi.data.weather[0].description;
        
        let test = await axios.get(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=hourly,minutely&units=metric&appid=${process.env.API_KEY}`);
        test.data.daily.forEach((day, index) => {
            let date = new Date(day.dt * 1000);
            let dayString = date.toString().split(' ')[0];
            let month = date.toString().split(' ')[1];
            let daynum = date.toString().split(' ')[2];
            let year = date.toString().split(' ')[3];
            test.data.daily[index].dt = `${dayString} ${month} ${daynum} ${year}`;
            test.data.daily[index].icon = test.data.daily[index].weather[0].icon;
        });
        res.render("index", { temp: myApi.data.main.temp + "°", place: "Location:" + myApi.data.name, daily: test.data.daily, list: countryCodeList, icon:weatherIcon, desc:desc, alt:weatherAlt })
    }
    catch (error) {
        res.render("index", {error: "The Location you are looking for does not exist!", list: countryCodeList})
    }
});

app.get('*', function (req, res) {
    res.render("pagenotfound");
});

app.listen(port, () => {
    console.log(`Listening to port ${port}`);
});