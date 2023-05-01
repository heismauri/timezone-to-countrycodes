import fetch from 'node-fetch';
import fs from 'fs';
import express from 'express';

const cacheFile = 'public/countries.json';
const cacheMaxAge = 12 * 60 * 60 * 1000;

const getCountriesDataUpstream = async () => {
  const data = await fetch('https://raw.githubusercontent.com/moment/moment-timezone/develop/data/meta/latest.json')
    .then((response) => response.json());
  const timeZoneToCountry = {};
  Object.entries(data.zones).forEach(([zone, { countries: [country] }]) => {
    timeZoneToCountry[zone] = country;
  });
  const sortedTimeZoneByCountry = Object.fromEntries(
    Object.entries(timeZoneToCountry).sort(([a, countryA], [b, countryB]) => {
      return countryA.localeCompare(countryB);
    })
  );

  fs.writeFileSync(cacheFile, JSON.stringify(sortedTimeZoneByCountry));
  return sortedTimeZoneByCountry;
};

const getCountriesData = async () => {
  let data;
  try {
    data = fs.readFileSync(cacheFile, 'utf8');
    const cacheAge = Date.now() - data.timestamp;
    if (cacheAge < cacheMaxAge) {
      throw new Error('Cache has expired');
    }
    data = JSON.parse(data);
  } catch (error) {
    data = await getCountriesDataUpstream();
  }
  return data;
};

const app = express();
const port = process.env.PORT || 3000;

app.get('/', async (_, res) => {
  res.json(await getCountriesData());
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
