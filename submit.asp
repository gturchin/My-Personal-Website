<%
' Collect customer info
firstName = Request.Form("first_name")
lastName = Request.Form("last_name")
email = Request.Form("email")

' Collect quantities
products = Array("white", "apple", "pear", "melon", "watermelon", "mango", "pineapple")
quantities = Array(Request.Form("qty_white"), Request.Form("qty_apple"), Request.Form("qty_pear"), _
                   Request.Form("qty_melon"), Request.Form("qty_watermelon"), Request.Form("qty_mango"), Request.Form("qty_pineapple"))

' Connect to SQL Server
Set conn = Server.CreateObject("ADODB.Connection")
conn.Open "Provider=SQLOLEDB;Data Source=localhost,1433;Initial Catalog=HighEndFruit;User ID=sa;Password=Grantclark#1;"

' Insert into Orders table
sqlInsertOrder = "INSERT INTO Orders (FirstName, LastName, Email) VALUES (?, ?, ?)"
Set cmd = Server.CreateObject("ADODB.Command")
Set cmd.ActiveConnection = conn
cmd.CommandText = sqlInsertOrder
cmd.CommandType = 1 ' adCmdText

cmd.Parameters.Append cmd.CreateParameter("@FirstName", 200, 1, 50, firstName)
cmd.Parameters.Append cmd.CreateParameter("@LastName", 200, 1, 50, lastName)
cmd.Parameters.Append cmd.CreateParameter("@Email", 200, 1, 100, email)
cmd.Execute

' Get the last inserted OrderID
Set rs = conn.Execute("SELECT SCOPE_IDENTITY()")
orderID = rs(0)

' Insert each item with quantity > 0
For i = 0 To UBound(products)
  If IsNumeric(quantities(i)) And quantities(i) > 0 Then
    sqlItem = "INSERT INTO OrderItems (OrderID, ProductID, Quantity) VALUES (?, ?, ?)"
    Set cmd = Server.CreateObject("ADODB.Command")
    Set cmd.ActiveConnection = conn
    cmd.CommandText = sqlItem
    cmd.CommandType = 1

    cmd.Parameters.Append cmd.CreateParameter("@OrderID", 3, 1, , orderID)
    cmd.Parameters.Append cmd.CreateParameter("@ProductID", 200, 1, 50, products(i))
    cmd.Parameters.Append cmd.CreateParameter("@Quantity", 3, 1, , quantities(i))
    cmd.Execute
  End If
Next

conn.Close

Response.Write "<h2>Thank you, your order has been submitted!</h2>"
%>
