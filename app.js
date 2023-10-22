const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const db = require('./db'); // db.js modülünü içe aktarın
const app = express();
const port = 3000;


app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Replace with the actual origin of your client app
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.get('/api/stores', async (req, res) => {
    const storeList = ["trendyol", "amazon", "hepsiburada"];

    res.send(storeList);
}); 

app.get('/api/getAllProducts', async (req, res) => {
    try {
        const products = await db.getAllProducts();
        res.json(products);
    } catch (error) {
        console.log("ERROR1: ", error);
        res.status(500).send('Ürünler alınırken bir hata oluştu');
    }
});

app.get('/api/addProduct', async (req, res) => {
    const product = {}

    product.name = req.query.name;
    product.price = req.query.price;
    product.categories = req.query.categories;
    product.url = req.query.url;
    product.image = req.query.image;

    console.log("XXXXXX : ", product);

    try {
        const result = await db.addProduct(product);
        res.json(result);
    } catch (error) {
        console.log("ERROR1: ", error);
        res.status(500).send('Ürünler alınırken bir hata oluştu');
    }
});



app.get('/api/store/getProduct', async (req, res) => {
    const storeName = req.query.storeName;
    const productLink = req.query.productLink;

    console.log("STORE NAME : ", storeName);
    console.log("PRODUCT LINK : ", productLink);

    try {
        const response = await axios.get(productLink);
        const html = response.data;
        const resultProduct = await getProductDataFromHtml(html, storeName, productLink)

        res.json(resultProduct);
    } catch (error) {
        console.error("ERROR: ", error);

        res.status(500).send('Bir hata oluştu');
    }
});

async function getProductDataFromHtml(html, storeName, url) {
    const $ = cheerio.load(html);

    const product = {}
    const categories = [];

    if (storeName == "trendyol") {
        // store a özel console kodu --------------------------------------
        product.name = $('h1.pr-new-br').text().trim() || "";
        product.price = parseFloat(($('span.prc-dsc').text().trim().replace(",", ".").split(" ") || []) [0]) || 0;
        product.oldPrice = product.price;
        product.image = await getImageDataFromHtml(url, '.base-product-image img');

        $('.product-detail-breadcrumb a').each(function (i, element) {
            const categoryTitle = $(element).attr('title');

            if (categoryTitle && categories.indexOf(categoryTitle) === -1) {
                categories.push(categoryTitle);
            }
        });
        // -----------------------------------------------------------------
    } 

    product.url = url;
    product.store = storeName;
    product.categories = categories;

    console.log("PRODUCT: ", product);

    return product;
}

async function getImageDataFromHtml(url, selector) {
    return new Promise(async (resolve) => {
      try {
        const browser = await puppeteer.launch({ headless: "new" });

        const page = await browser.newPage();
        await page.goto(url);
        await page.waitForSelector(selector);
  
        const imageSrc = await page.$eval(selector, (img) => img.src);
  
        console.log(imageSrc);
  
        await browser.close();
  
        resolve(imageSrc);
      } catch (error) {
        console.log("ERROR FOR IMAGE : ", error);
        resolve(""); // Resolve with an empty string in case of an error
      }
    });
}

app.listen(port, () => {
    console.log(`Server çalışıyor: http://localhost:${port}`);
});


