const mysql = require('mysql');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'product_hunt',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const connection = mysql.createPool(dbConfig);

async function connectToDatabase() {
  return new Promise(async (resolve, reject) => {
    await checkAndCreateProductTable();
    connection.getConnection((err, conn) => {
      if (err) {
        console.error('\n MySQL bağlantı hatası: ' + err.stack);
        reject(err);
        return;
      }

      console.log('\n ------- MySQL veritabanına bağlandı ------- \n');
      resolve(conn);
    });
  });
}

function closeDatabaseConnection(conn) {
  conn.release();
  console.log('\n ------- MySQL veritabanı bağlantısı kapatıldı ------- \n');
}

function addProduct(product) {
  return connectToDatabase()
    .then((conn) => {
      const query = 'INSERT INTO products (name, price, oldPrice, categories, url, image) VALUES (?, ?, ?, ?, ?, ?)';

      return new Promise((resolve, reject) => {
        conn.query(query, [product.name, product.price, product.price, JSON.stringify(product.categories), product.url, product.image], (error, results, fields) => {
          closeDatabaseConnection(conn);

          if (error) {
            console.log('\nHATA: ', error);
            reject(error); // Hata oluştuğunda reject çağrılmalı
          } else {
            console.log('\nÜrün başarıyla kaydedildi. 22');
            resolve(results);
          }
        });
      });
    })
    .catch((error) => {
      console.error('\nDatabase connection error:', error);
      throw error;
    });
}


function deleteProductById(productId) {
  return new Promise((resolve, reject) => {
    connection.query('DELETE FROM products WHERE id = ?', [productId], (error, results, fields) => {
      if (error) {
        console.error('Ürün silme hatası: ' + error);
        reject(error);
        return;
      }

      console.log('Ürün başarıyla silindi.');
      resolve();
    });
  });
}

function getAllProducts() {
  return connectToDatabase()
    .then((conn) => {
      const query = 'SELECT * FROM products';

      return new Promise((resolve, reject) => {
        conn.query(query, (error, results, fields) => {
          closeDatabaseConnection(conn);

          if (error) {
            console.log('\nHATA1: ', error);
            reject(error);
          } else {
            console.log('\nTüm ürünler başarıyla alındı.');
            resolve(results);
          }
        });
      });
    })
    .catch((error) => {
      console.error('\n1Database connection error:', error);
      throw error;
    });
}

function checkAndCreateProductTable() {
  return new Promise((resolve, reject) => {
    connection.query('SHOW TABLES LIKE "products"', (error, results, fields) => {
      if (error) {
        console.error('Tablo sorgulama hatası: ' + error);
        reject(error);
        return;
      }

      if (results.length === 0) {
        // "products" tablosu henüz yok, oluştur
        createProductTable()
          .then(() => resolve())
          .catch(reject);
      } else {
        resolve();
      }
    });
  });
}

function createProductTable() {
  return new Promise((resolve, reject) => {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255),
        price DECIMAL(10, 2),
        oldPrice DECIMAL(10, 2),
        categories JSON,
        image VARCHAR(255),
        url VARCHAR(255)
      )
    `;

    connection.query(createTableSQL, (error, results, fields) => {
      if (error) {
        console.error('Tablo oluşturma hatası: ' + error);
        reject(error);
        return;
      }

      console.log('"products" tablosu başarıyla oluşturuldu.');
      resolve();
    });
  });
}

module.exports = {
  addProduct,
  deleteProductById,
  getAllProducts,
  checkAndCreateProductTable,
};
