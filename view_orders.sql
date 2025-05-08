USE HighEndFruit;
GO

SELECT 
  O.OrderID,
  FORMAT(O.OrderDate, 'yyyy-MM-dd hh:mm tt') AS OrderedAt,
  O.FirstName + ' ' + O.LastName AS Customer,
  O.Email,
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
  I.Quantity,
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
ORDER BY O.OrderID DESC, ProductName;
