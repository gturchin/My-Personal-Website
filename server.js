const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const sql = require('mssql');
const cors = require('cors');

const app = express();
const port = 3000;
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const dbConfig = {
  user: 'sa',
  password: 'Grantclark1', // 🔒 Make sure this matches your Docker password
  server: 'localhost',
  port: 1433,
  database: 'HighEndFruit',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

const productCatalog = {
  white: {
    name: "White Jewel Strawberry",
    price: 10,
    image: "https://hips.hearstapps.com/hmg-prod/images/white-strawberries-royalty-free-image-1679935500.jpg"
  },
  apple: {
    name: "Sekai-Ichi Apple",
    price: 20,
    image: "https://hips.hearstapps.com/hmg-prod/images/fruit-shot-of-aomori-sekaiichi-apple-at-citys-super-in-news-photo-1679935534.jpg"
  },
  pear: {
    name: "Buddha-Shaped Pear",
    price: 8,
    image: "https://hips.hearstapps.com/hmg-prod/images/buddha-shaped-pears-grow-on-the-trees-at-an-orchard-in-news-photo-1679935567.jpg"
  },
  melon: {
    name: "Yubari King Melon",
    price: 200,
    image: "https://hips.hearstapps.com/hmg-prod/images/sweet-orange-melon-grown-in-yuubari-city-japan-royalty-free-image-1679935588.jpg"
  },
  watermelon: {
    name: "Square Watermelon",
    price: 100,
    image: "https://hips.hearstapps.com/hmg-prod/images/watermelon-day-royalty-free-image-1679935653.jpg"
  },
  mango: {
    name: "Taiyo No Tamago Mango",
    price: 3600,
    image: "https://hips.hearstapps.com/hmg-prod/images/japanese-farmer-tsutomu-takemori-displays-a-cluster-of-news-photo-1679935972.jpg"
  },
  pineapple: {
    name: "Cornwall’s Lost Gardens Pineapple",
    price: 15000,
    image: "https://example.com/pineapple.jpg"
  }
};

app.post('/submit', async (req, res) => {
  const { first_name, last_name, email } = req.body;
  const products = Object.keys(productCatalog);

  try {
    await sql.connect(dbConfig);

    // Insert into Orders table
    const result = await sql.query`
      INSERT INTO Orders (FirstName, LastName, Email)
      OUTPUT INSERTED.OrderID
      VALUES (${first_name}, ${last_name}, ${email});
    `;
    const orderID = result.recordset[0].OrderID;

    // Insert each ordered item
    for (let id of products) {
      const qty = parseInt(req.body[`qty_${id}`]);
      if (qty && qty > 0) {
        await sql.query`
          INSERT INTO OrderItems (OrderID, ProductID, Quantity)
          VALUES (${orderID}, ${id}, ${qty});
        `;
      }
    }

    // Get full order history by email
    const orderHistory = await sql.query(`
      SELECT O.OrderDate, I.ProductID, I.Quantity
      FROM Orders O
      JOIN OrderItems I ON O.OrderID = I.OrderID
      WHERE O.Email = '${email}'
      ORDER BY O.OrderDate DESC;
    `);

    // Build confirmation HTML
    let total = 0;
    let rows = '';
    for (const item of orderHistory.recordset) {
      const product = productCatalog[item.ProductID];
      const subtotal = item.Quantity * product.price;
      total += subtotal;

      rows += `
        <tr>
          <td><img src="${product.image}" style="width:60px; border-radius:8px;"></td>
          <td>${product.name}</td>
          <td>${item.Quantity}</td>
          <td>$${product.price.toLocaleString()}</td>
          <td>$${subtotal.toLocaleString()}</td>
        </tr>
      `;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order Confirmation</title>
        <style>
          body {
            font-family: 'Open Sans', sans-serif;
            background: #fdf8f2;
            color: #333;
            padding: 30px;
          }
          h1 {
            font-family: 'Playfair Display', serif;
            color: #3e2a26;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 30px;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          th {
            background: #f0e6dd;
          }
          .total {
            text-align: right;
            margin-top: 20px;
            font-size: 1.2em;
            color: #a65f3a;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <h1>Thank you, ${first_name}!</h1>
        <p>Here’s a summary of your premium fruit orders:</p>

        <table>
          <thead>
            <tr>
              <th>Image</th>
              <th>Product</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <div class="total">Total Spent: $${total.toLocaleString()}</div>
      </body>
      </html>
    `;

    res.send(html);
  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).send("Error processing your order: " + err.message);
  }
});
app.get('/orders', async (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).send([]);

  try {
    await sql.connect(dbConfig);
    const orderData = await sql.query(`
      SELECT 
        O.OrderID,
        FORMAT(O.OrderDate, 'yyyy-MM-dd hh:mm tt') AS OrderedAt,
        O.Email,
        I.ProductID,
        I.Quantity,
        CASE I.ProductID
          WHEN 'white' THEN 'White Jewel Strawberry'
          WHEN 'apple' THEN 'Sekai-Ichi Apple'
          WHEN 'pear' THEN 'Buddha-Shaped Pear'
          WHEN 'melon' THEN 'Yubari King Melon'
          WHEN 'watermelon' THEN 'Square Watermelon'
          WHEN 'mango' THEN 'Taiyo No Tamago Mango'
          WHEN 'pineapple' THEN 'Cornwall’s Lost Gardens Pineapple'
          ELSE I.ProductID
        END AS ProductName,
        CASE I.ProductID
          WHEN 'white' THEN 10
          WHEN 'apple' THEN 20
          WHEN 'pear' THEN 8
          WHEN 'melon' THEN 200
          WHEN 'watermelon' THEN 100
          WHEN 'mango' THEN 3600
          WHEN 'pineapple' THEN 15000
          ELSE 0
        END AS PriceEach,
        I.Quantity *
          CASE I.ProductID
            WHEN 'white' THEN 10
            WHEN 'apple' THEN 20
            WHEN 'pear' THEN 8
            WHEN 'melon' THEN 200
            WHEN 'watermelon' THEN 100
            WHEN 'mango' THEN 3600
            WHEN 'pineapple' THEN 15000
            ELSE 0
          END AS Subtotal
      FROM Orders O
      JOIN OrderItems I ON O.OrderID = I.OrderID
      WHERE LOWER(O.Email) = LOWER(@email)
      ORDER BY O.OrderID DESC, ProductName;
    `, { email });

    res.json(orderData.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Could not fetch orders.' });
  }
});

app.listen(port, () => {
  console.log(`🟢 Server running at http://localhost:${port}`);
});
