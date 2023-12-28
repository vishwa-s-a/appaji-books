const express=require('express')
const mysql=require('mysql')
const bodyParser=require('body-parser')

require("dotenv").config();

const PORT=process.env.PORT || 3000

const app=express()

const connection=mysql.createConnection({
    host:process.env.SERVER,
    user:process.env.NAME,
    password:process.env.PASSWORD,
    database:process.env.NAME,
})

connection.connect((err)=>{
    if(err){
        console.log("Error connecting to database")

    }
    else{
        console.log("Connected to MYSQL db")
    }
})

// ****************************** creating tables so run once after that comment it out********************
// const createTableQuery=`CREATE TABLE IF NOT EXISTS passbook (
//     id INT AUTO_INCREMENT PRIMARY KEY,
//     date DATE,
//     time TIME,
//     person VARCHAR(255),
//     info TEXT,
//     amount DECIMAL(10, 2),
//     type ENUM('credit', 'debit')
//   );`

// connection.query(createTableQuery,(err,result)=>{
//     if(err)
//     {
//         console.error('Error creating table ',err)
//     }
//     else{
//         if(result.warningStatus===0)
//         console.log('Table created successfully');
//         else
//         console.log('Table already exits')
//     }
// })

// const createTable1Query=`CREATE TABLE IF NOT EXISTS history(
//     id INT PRIMARY KEY,
//     date DATE,
//     time TIME,
//     balance DECIMAL(10,2)
// );`

// connection.query(createTable1Query,(err,result)=>{
//     if(err)
//     {
//         console.error('Error creating table ',err)
//     }
//     else{
//         if(result.warningStatus===0)
//         console.log('Table created successfully');
//         else
//         console.log('Table already exits')
//     }
// })
// ****************************** creating tables so run once after that comment it out********************

app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended:true}));

//**************************************************************all get requests ************************************************
app.get('/',(req,res)=>{
    res.sendFile(__dirname+'/views/index.html')
})
.get('/deposit',(req,res)=>{
    res.sendFile(__dirname+'/views/deposited.html')
})
.get('/withdraw',(req,res)=>{
    res.sendFile(__dirname+'/views/withdrawn.html')
})
.get('/passbook',(req,res)=>{
    res.sendFile(__dirname+'/views/passbook.html')
})
.get('/balance',(req,res)=>{
    let balance='0.0'
    let date='null'
    let time='null'
    let updateBalance=connection.query("SELECT *, DATE_FORMAT(date, '%Y-%m-%d') AS formattedDate FROM history ORDER BY id DESC LIMIT 1", (error, results, fields) => {
        if (error) {
          console.error('Error retrieving last entry:', error);
          throw error;
        }
      
        // 'results' contains the last entry fetched from the table
        if (results.length > 0) {
          const lastEntry = results[0];
          balance=lastEntry.balance
          date=lastEntry.formattedDate
          time=lastEntry.time
        //   console.log(balance,date,time)
          res.status(200).json({ balance, date,time });
        }
    });

})
.get('/update',(req,res)=>{
    let id
    let balance=0.0
    let date
    let time
    let flag=false
    let updateBalance=connection.query('SELECT * FROM history ORDER BY id DESC LIMIT 1', (error, results, fields) => {
        if (error) {
          console.error('Error retrieving last entry:', error);
          throw error;
        }
      
        // 'results' contains the last entry fetched from the table
        if (results.length > 0) {
          const lastEntry = results[0];
          let last_id=lastEntry.id;
          balance=lastEntry.balance;
          let settingBalance=connection.query("SELECT *, DATE_FORMAT(date, '%Y-%m-%d') AS formattedDate FROM passbook",(error,results,fields)=>{
            if (error) {
                console.error('Error retrieving last entry:', error);
                throw error;
            }
            else{
                results.forEach(element => {
                    id=element.id
                    amount=element.amount
                    // date=new Date(element.date).toISOString().split('T')[0];
                    date=element.formattedDate
                    time=element.time
                    type=element.type
                    if(id>last_id)
                    {
                        flag=true
                        if(type=='credit')
                        {
                            balance+=amount;
                        }
                        else if(type=='debit')
                        {
                            balance-=amount;
                        }
                    }
                    
                });
                if(flag)
                {
                    const dataToInsertInHistory = {
                        id:id,
                        date: date, // Date in 'YYYY-MM-DD' format
                        time: time, // Time in 'HH:MM:SS' format
                        balance: balance, // Numeric value for the amount
                    };
                
                    let insert=connection.query('INSERT INTO history SET ?', dataToInsertInHistory, (error, results, fields) => {
                        if (error) {
                          console.error('Error inserting data:', error);
                          res.redirect('/error');
                        }
                        else{
                        console.log('Data inserted successfully');
                        }
                    });
                }

            }

        });


          // Use lastEntry as needed
        } 
        else{
            // console.log("No entry in history")
            let settingBalance=connection.query("SELECT *, DATE_FORMAT(date, '%Y-%m-%d') AS formattedDate FROM passbook",(error,results,fields)=>{
                if (error) {
                    console.error('Error retrieving entries:', error);
                    throw error;
                }
                else{
                    results.forEach(element => {
                        id=element.id
                        amount=element.amount
                        // date=new Date(element.date).toISOString().split('T')[0];
                        date=element.formattedDate
                        time=element.time
                        type=element.type
                        if(type=='credit')
                        {
                            balance+=amount;
                        }
                        else if(type=='debit')
                        {
                            balance-=amount;
                        }
                        // console.log(id,date,amount,balance)

                    });
                    const dataToInsertInHistory = {
                        id:id,
                        date: date, // Date in 'YYYY-MM-DD' format
                        time: time, // Time in 'HH:MM:SS' format
                        balance: balance, // Numeric value for the amount
                    };
                
                    let insert=connection.query('INSERT INTO history SET ?', dataToInsertInHistory, (error, results, fields) => {
                        if (error) {
                          console.error('Error inserting data:', error);
                          res.redirect('/error');
                        }
                        else{
                        console.log('Data inserted successfully');
                        }
                    });

                }

            });
        }
    });

    res.status(200).json({balance});

})
.get('/lastTransaction',(req,res)=>{
    let lastId
    let dataToSend=""
    // we try to get the last entry in the passbook
    let getLastId=connection.query("SELECT id FROM passbook ORDER BY id DESC LIMIT 1", (error, results, fields) => {
        if (error) {
          console.error('Error retrieving last id:', error);
          throw error;
        }
      
        // 'results' contains the last entry fetched from the table
        if (results.length > 0) {
          const lastEntry = results[0];
          lastId=lastEntry.id;
        }
        else{
            res.status(200).json({dataToSend})
        }
    });
    // console.log(lastId)
    let getAllId=connection.query("SELECT *, DATE_FORMAT(date, '%Y-%m-%d') AS formattedDate FROM passbook",(error,results,fields)=>{
        if (error) {
            console.error('Error retrieving entries:', error);
            throw error;
        }
        
        let j=5
        let NumberOfEntries=results.length
        results.reverse();
        for(const obj of results)
        {
            if(j>0){
                // console.log(obj.id)
                dataToSend+=`
                    <div id="sections" class="shadow m-2 text-center">
                    <div class="row gx-4 p-2">
                        <div class="col">
                            <h6>${obj.person}</h6>
                        </div>
                        <div class="col">
                            <h6>${obj.formattedDate}<br>${obj.time}</h6>
                        </div>
                        <div class="col ${obj.type}">
                            <h6>${obj.type}<br>${obj.amount}</h6>
                        </div>
                    </div>
                    </div>
                `
                j--;
            }
        }
        res.status(200).json({dataToSend})
    });
})
.get('/error',(req,res)=>{
    res.sendFile(__dirname+"/views/error.html")
});


// ********************************************************all post requests**************************************************
app.post('/deposit',(req,res)=>{
    const person=req.body.person
    const date=req.body.date
    const time=req.body.time+':00'
    const cause=req.body.cause
    const amount=parseFloat(req.body.amount)

    const dataToInsert = {
        date: date, // Date in 'YYYY-MM-DD' format
        time: time, // Time in 'HH:MM:SS' format
        person: person,
        info: cause,
        amount: amount, // Numeric value for the amount
        type: 'credit',
    };

    let insert1=connection.query('INSERT INTO passbook SET ?', dataToInsert, (error, results, fields) => {
        if (error) {
          console.error('Error inserting data:', error);
          res.redirect('/error');
        }
        else{
        console.log('Data inserted successfully');
        res.redirect('/')
        }
    });
    // console.log(insert1.sql);

})
.post('/withdraw',(req,res)=>{
    const person=req.body.person
    const date=req.body.date
    const time=req.body.time+':00'
    const cause=req.body.cause
    const amount=parseFloat(req.body.amount)

    const dataToInsert = {
        date: date, // Date in 'YYYY-MM-DD' format
        time: time, // Time in 'HH:MM:SS' format
        person: person,
        info: cause,
        amount: amount, // Numeric value for the amount
        type: 'debit',
    };

    let insert1=connection.query('INSERT INTO passbook SET ?', dataToInsert, (error, results, fields) => {
        if (error) {
          console.error('Error inserting data:', error);
          res.redirect('/error');
        }
        else{
        console.log('Data inserted successfully');
        res.redirect('/')
        }
    });
})
.post('/passbook',(req,res)=>{
    let dataToSend=''
    const param1=req.body.param1;
    const param2=req.body.param2;

    // console.log(param1,param2)
    let searchQuery
    if(param1=='person')
    {
        searchQuery="SELECT *, DATE_FORMAT(date, '%Y-%m-%d') AS formattedDate FROM passbook WHERE `person` = ?"
        let getRequiredId=connection.query(searchQuery,[`${param2}`],(error,results,fields)=>{
        if (error) {
            console.error('Error retrieving entries:', error);
            throw error;
        }
        // let NumberOfEntries=results.length
        results.reverse();
        for(const obj of results)
        {
                // console.log(obj.id)
                dataToSend+=`
                    <div id="sections" class="shadow m-2 text-center">
                    <div class="row gx-4 p-2">
                        <div class="col">
                            <h6>${obj.person}</h6>
                        </div>
                        <div class="col">
                            <h6>${obj.formattedDate}<br>${obj.time}</h6>
                        </div>
                        <div class="col ${obj.type}">
                            <h6>${obj.type}<br>${obj.amount}</h6>
                        </div>
                    </div>
                    </div>
                `
        }
        res.send(`<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Home</title>
            <!-- bootstrap link -->
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.1/dist/css/bootstrap.min.css" rel="stylesheet"
                integrity="sha384-4bw+/aepP/YC94hEpVNVgiZdgIC5+VKNBQNGCHeKRQN+PtmoHDEXuppvnDJzQIu9" crossorigin="anonymous">
            <!-- custom stylesheet -->
            <link rel="stylesheet" href="/css/styles.css">
            <!-- fontawesome link -->
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css"
                integrity="sha512-z3gLpd7yknf1YoNbCzqRKc4qyor8gaKU1qmn+CShxbuBusANI9QpRohGBreCFkKxLhei6S9CQXFEbbKuqLg0DA=="
                crossorigin="anonymous" referrerpolicy="no-referrer" />
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Poppins&display=swap" rel="stylesheet">
        </head>
        <body>
        <div class="row gx-5 mt-3 text-center">
                <div class="col px-3">
                <a href="/passbook" class="btn btn-primary">Passbook</a>
                </div>
                <div class="col px-3" >
                    <a href="/" class="btn btn-primary">Home</a>
                </div>
        </div> 
        <div id="trans">
            ${dataToSend}
        </div><!-- bootstrap javascript link -->
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.1/dist/js/bootstrap.bundle.min.js"
            integrity="sha384-HwwvtgBNo3bZJJLYd8oVXjrBZt8cqVSpeBNS5n7C8IVInixGAoxmnlMuBnhbgrkm"
            crossorigin="anonymous"></script>
        <script src="/js/index1.js"></script>
        </body>
        </html>
        `)
        });
    }
    else{
        let temp=param2.split(",")
        if(temp[0]=='month')
        {
            searchQuery=`SELECT *, DATE_FORMAT(date, '%Y-%m-%d') AS formattedDate FROM passbook WHERE date >= DATE_SUB(NOW(), INTERVAL ${temp[1]} MONTH)`
            
        }
        else{
            searchQuery="SELECT *, DATE_FORMAT(date, '%Y-%m-%d') AS formattedDate FROM passbook WHERE date >= DATE_SUB(NOW(), INTERVAL 1 year)"
        }
        let getRequiredId=connection.query(searchQuery,(error,results,fields)=>{
            if (error) {
                console.error('Error retrieving entries:', error);
                throw error;
            }
            // let NumberOfEntries=results.length
            results.reverse();
            for(const obj of results)
            {
                    // console.log(obj.id)
                    dataToSend+=`
                        <div id="sections" class="shadow m-2 text-center">
                        <div class="row gx-4 p-2">
                            <div class="col">
                                <h6>${obj.person}</h6>
                            </div>
                            <div class="col">
                                <h6>${obj.formattedDate}<br>${obj.time}</h6>
                            </div>
                            <div class="col ${obj.type}">
                                <h6>${obj.type}<br>${obj.amount}</h6>
                            </div>
                        </div>
                        </div>
                    `
            }
            res.send(`<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Home</title>
            <!-- bootstrap link -->
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.1/dist/css/bootstrap.min.css" rel="stylesheet"
                integrity="sha384-4bw+/aepP/YC94hEpVNVgiZdgIC5+VKNBQNGCHeKRQN+PtmoHDEXuppvnDJzQIu9" crossorigin="anonymous">
            <!-- custom stylesheet -->
            <link rel="stylesheet" href="/css/styles.css">
            <!-- fontawesome link -->
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css"
                integrity="sha512-z3gLpd7yknf1YoNbCzqRKc4qyor8gaKU1qmn+CShxbuBusANI9QpRohGBreCFkKxLhei6S9CQXFEbbKuqLg0DA=="
                crossorigin="anonymous" referrerpolicy="no-referrer" />
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Poppins&display=swap" rel="stylesheet">
        </head>
        <body>
        <div class="row gx-4 mt-3 text-center">
                <div class="col px-3">
                <a href="/passbook" class="btn btn-primary">Passbook</a>
                </div>
                <div class="col px-3" >
                    <a href="/" class="btn btn-primary">Home</a>
                </div>
            </div> 
        <div id="trans">
            ${dataToSend}
        </div><!-- bootstrap javascript link -->
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.1/dist/js/bootstrap.bundle.min.js"
            integrity="sha384-HwwvtgBNo3bZJJLYd8oVXjrBZt8cqVSpeBNS5n7C8IVInixGAoxmnlMuBnhbgrkm"
            crossorigin="anonymous"></script>
        </body>
        </html>
        `)
        });
    }

})


app.listen(PORT,()=>{
    console.log("Server is running on",PORT)
})