const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio'); // Cheerio kütüphanesini ekleyin
const app = express();
const port = 3000;

app.use(express.json());

app.get('/stores', async (req, res) => {
    const storeList = ["trendyol", "amazon", "hepsiburada"];

    res.send(storeList);
}); 

app.get('/productList', async (req, res) => {
    const storeName = req.query.storeName;

    const productList = [{"name": "kazak", "price": "150 tl", "oldPrice": "180 tl", "categories": ["erkek", "giyim"], "url": ""}, {}, {}];

    res.send(storeList);
});

app.get('/store/getProduct', async (req, res) => {
    const storeName = req.query.storeName;
    const productLink = req.query.productLink;

    console.log("STORE NAME : ", storeName);
    console.log("PRODUCT LINK : ", productLink);

    try {
        const response = await axios.get(productLink);
        const html = response.data;

        res.json(getProductDataFromHtml(html, storeName, productLink));
    } catch (error) {
        console.error("ERROR: ", error);

        res.status(500).send('Bir hata oluştu');
    }
});

function getProductDataFromHtml(html, storeName, url) {
    const $ = cheerio.load(html);

    // Ürün bilgilerini çıkarma
    const product = {}
    const categories = [];

    if (storeName == "trendyol") {
        // store a özel console kodu --------------------------------------
        product.name = $('h1.pr-new-br').text() || "";
        product.price = $('span.prc-dsc').text() || "";
        
        $('.product-detail-breadcrumb a').each(function (i, element) {
            const kategoriTitle = $(element).attr('title');

            if (kategoriTitle && categories.indexOf(kategoriTitle) === -1) {
                categories.push(kategoriTitle);
            }
        });
        // -----------------------------------------------------------------
    } 

    /*
    else if (storeName == "hepsiburada") {

    } else if (storeName == "amazon") {
    
    } else {
        console.log("UNDEFINED STORE..")
    }
    */

    product.url = url;
    product.store = storeName;
    product.categories = categories;

    console.log("PRODUCT: ", product);

    return product;
}

app.listen(port, () => {
    console.log(`Server çalışıyor: http://localhost:${port}`);
});


