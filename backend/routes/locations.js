const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

let citiesCache = [];
let districtsCache = {};

const loadData = () => {
  if (citiesCache.length > 0) return;

  try {
    const csvPath = path.join(__dirname, '..', 'data', 'il_ilce.csv');
    const data = fs.readFileSync(csvPath, 'utf8');
    const lines = data.split('\n');
    
    // Skip header
    const rows = lines.slice(1).filter(line => line.trim() !== '');
    
    const tempDistricts = {};
    const tempCities = new Set();

    rows.forEach(row => {
      // Handle potential carriage returns
      const [city, district] = row.replace('\r', '').split(',');
      if (city && district) {
        tempCities.add(city);
        if (!tempDistricts[city]) {
          tempDistricts[city] = [];
        }
        tempDistricts[city].push(district);
      }
    });

    citiesCache = Array.from(tempCities);
    districtsCache = tempDistricts;
  } catch (error) {
    console.error('Error loading location data:', error);
  }
};

// Load data on startup
loadData();

router.get('/', (req, res) => {
  res.json({
    cities: citiesCache,
    districts: districtsCache
  });
});

module.exports = router;
