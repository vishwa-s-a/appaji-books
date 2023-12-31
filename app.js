const express = require('express')
const mysql = require('mysql')
const bodyParser = require('body-parser')
const { bcrypt, bcryptVerify } = require('hash-wasm');
const crypto = require('crypto');
const session = require('express-session')

require("dotenv").config();

const PORT = process.env.PORT || 3000

const app = express()

const connection = mysql.createConnection({
    host: process.env.SERVER,
    user: process.env.NAME,
    password: process.env.PASSWORD,
    database: process.env.NAME,
})
connection.connect((err) => {
    if (err) {
        console.log("Error connecting to database")

    }
    else {
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


// const createTableQuery = `
//         CREATE TABLE IF NOT EXISTS users (
//             id INT AUTO_INCREMENT PRIMARY KEY,
//             email VARCHAR(255) NOT NULL UNIQUE,
//             hashed_password VARCHAR(255) NOT NULL
//         )
//     `;

// // Execute the query to create the table
// connection.query(createTableQuery, (err, results) => {
//     if (err) {
//         console.error('Error creating table:', err);
//     } else {
//         if (results.warningStatus === 0)
//             console.log('Table created successfully');
//         else
//             console.log('Table already exits')
//     }

// });
// ****************************** creating tables so run once after that comment it out********************

app.use(session({
    secret: 'session4AppajiPassbook', // Use a strong secret for session encryption
    resave: false,
    saveUninitialized: true
}));
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware to check if the user is authenticated
const isAuthenticated = (req, res, next) => {
    // Check if the 'user' session variable is set
    if (req.session.user) {
        next(); // User is authenticated, proceed to the next middleware/route handler
    } else {
        res.redirect('/login'); // Redirect to login if user is not logged in
    }
};
//**************************************************************all get requests ************************************************
app.get('/', isAuthenticated,(req, res) => {
    res.sendFile(__dirname + '/views/index.html')
})
    .get('/deposit',isAuthenticated, (req, res) => {
        res.sendFile(__dirname + '/views/deposited.html')
    })
    .get('/withdraw',isAuthenticated, (req, res) => {
        res.sendFile(__dirname + '/views/withdrawn.html')
    })
    .get('/passbook',isAuthenticated, (req, res) => {
        res.sendFile(__dirname + '/views/passbook.html')
    })
    .get('/balance',isAuthenticated, (req, res) => {
        let balance = '0.0'
        let date = 'null'
        let time = 'null'
        let updateBalance = connection.query("SELECT *, DATE_FORMAT(date, '%Y-%m-%d') AS formattedDate FROM history ORDER BY id DESC LIMIT 1", (error, results, fields) => {
            if (error) {
                console.error('Error retrieving last entry:', error);
                throw error;
            }

            // 'results' contains the last entry fetched from the table
            if (results.length > 0) {
                const lastEntry = results[0];
                balance = lastEntry.balance
                date = lastEntry.formattedDate
                time = lastEntry.time
                //   console.log(balance,date,time)
                res.status(200).json({ balance, date, time });
            }
        });

    })
    .get('/update',isAuthenticated,(req, res) => {
        let id
        let balance = 0.0
        let date
        let time
        let flag = false
        let updateBalance = connection.query('SELECT * FROM history ORDER BY id DESC LIMIT 1', (error, results, fields) => {
            if (error) {
                console.error('Error retrieving last entry:', error);
                throw error;
            }

            // 'results' contains the last entry fetched from the table
            if (results.length > 0) {
                const lastEntry = results[0];
                let last_id = lastEntry.id;
                balance = lastEntry.balance;
                let settingBalance = connection.query("SELECT *, DATE_FORMAT(date, '%Y-%m-%d') AS formattedDate FROM passbook", (error, results, fields) => {
                    if (error) {
                        console.error('Error retrieving last entry:', error);
                        throw error;
                    }
                    else {
                        results.forEach(element => {
                            id = element.id
                            amount = element.amount
                            // date=new Date(element.date).toISOString().split('T')[0];
                            date = element.formattedDate
                            time = element.time
                            type = element.type
                            if (id > last_id) {
                                flag = true
                                if (type == 'credit') {
                                    balance += amount;
                                }
                                else if (type == 'debit') {
                                    balance -= amount;
                                }
                            }

                        });
                        if (flag) {
                            const dataToInsertInHistory = {
                                id: id,
                                date: date, // Date in 'YYYY-MM-DD' format
                                time: time, // Time in 'HH:MM:SS' format
                                balance: balance, // Numeric value for the amount
                            };

                            let insert = connection.query('INSERT INTO history SET ?', dataToInsertInHistory, (error, results, fields) => {
                                if (error) {
                                    console.error('Error inserting data:', error);
                                    res.redirect('/error');
                                }
                                else {
                                    console.log('Data inserted successfully');
                                }
                            });
                        }

                    }

                });


                // Use lastEntry as needed
            }
            else {
                // console.log("No entry in history")
                let settingBalance = connection.query("SELECT *, DATE_FORMAT(date, '%Y-%m-%d') AS formattedDate FROM passbook", (error, results, fields) => {
                    if (error) {
                        console.error('Error retrieving entries:', error);
                        throw error;
                    }
                    else {
                        results.forEach(element => {
                            id = element.id
                            amount = element.amount
                            // date=new Date(element.date).toISOString().split('T')[0];
                            date = element.formattedDate
                            time = element.time
                            type = element.type
                            if (type == 'credit') {
                                balance += amount;
                            }
                            else if (type == 'debit') {
                                balance -= amount;
                            }
                            // console.log(id,date,amount,balance)

                        });
                        const dataToInsertInHistory = {
                            id: id,
                            date: date, // Date in 'YYYY-MM-DD' format
                            time: time, // Time in 'HH:MM:SS' format
                            balance: balance, // Numeric value for the amount
                        };

                        let insert = connection.query('INSERT INTO history SET ?', dataToInsertInHistory, (error, results, fields) => {
                            if (error) {
                                console.error('Error inserting data:', error);
                                res.redirect('/error');
                            }
                            else {
                                console.log('Data inserted successfully');
                            }
                        });

                    }

                });
            }
        });

        res.status(200).json({ balance });

    })
    .get('/lastTransaction',isAuthenticated, (req, res) => {
        let lastId
        let dataToSend = ""
        // we try to get the last entry in the passbook
        let getLastId = connection.query("SELECT id FROM passbook ORDER BY id DESC LIMIT 1", (error, results, fields) => {
            if (error) {
                console.error('Error retrieving last id:', error);
                throw error;
            }

            // 'results' contains the last entry fetched from the table
            if (results.length > 0) {
                const lastEntry = results[0];
                lastId = lastEntry.id;
            }
            else {
                res.status(200).json({ dataToSend })
            }
        });
        // console.log(lastId)
        let getAllId = connection.query("SELECT *, DATE_FORMAT(date, '%Y-%m-%d') AS formattedDate FROM passbook", (error, results, fields) => {
            if (error) {
                console.error('Error retrieving entries:', error);
                throw error;
            }

            let j = 5
            let NumberOfEntries = results.length
            results.reverse();
            for (const obj of results) {
                if (j > 0) {
                    // console.log(obj.id)
                    dataToSend += `
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
            res.status(200).json({ dataToSend })
        });
    })
    .get('/profile',isAuthenticated, (req, res) => {
        res.sendFile(__dirname + '/views/profile.html')
    })
    .get('/login', (req, res) => {
        res.sendFile(__dirname + '/views/login.html')
    })
    .get('/sign-up',isAuthenticated, (req, res) => {
        res.sendFile(__dirname + '/views/sign-up.html')
    })
// Logout route
app.get('/logout', (req, res) => {
    // Destroy the session and redirect to login page on logout
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/login');
    });
})
    .get('/error', (req, res) => {
        res.sendFile(__dirname + "/views/error.html")
    });


// ********************************************************all post requests**************************************************
app.post('/deposit',isAuthenticated, (req, res) => {
    const person = req.body.person
    const date = req.body.date
    const time = req.body.time + ':00'
    const cause = req.body.cause
    const amount = parseFloat(req.body.amount)

    const dataToInsert = {
        date: date, // Date in 'YYYY-MM-DD' format
        time: time, // Time in 'HH:MM:SS' format
        person: person,
        info: cause,
        amount: amount, // Numeric value for the amount
        type: 'credit',
    };

    let insert1 = connection.query('INSERT INTO passbook SET ?', dataToInsert, (error, results, fields) => {
        if (error) {
            console.error('Error inserting data:', error);
            res.redirect('/error');
        }
        else {
            console.log('Data inserted successfully');
            res.redirect('/')
        }
    });
    // console.log(insert1.sql);

})
    .post('/withdraw',isAuthenticated, (req, res) => {
        const person = req.body.person
        const date = req.body.date
        const time = req.body.time + ':00'
        const cause = req.body.cause
        const amount = parseFloat(req.body.amount)

        const dataToInsert = {
            date: date, // Date in 'YYYY-MM-DD' format
            time: time, // Time in 'HH:MM:SS' format
            person: person,
            info: cause,
            amount: amount, // Numeric value for the amount
            type: 'debit',
        };

        let insert1 = connection.query('INSERT INTO passbook SET ?', dataToInsert, (error, results, fields) => {
            if (error) {
                console.error('Error inserting data:', error);
                res.redirect('/error');
            }
            else {
                console.log('Data inserted successfully');
                res.redirect('/')
            }
        });
    })
    .post('/passbook',isAuthenticated, (req, res) => {
        let dataToSend = ''
        const param1 = req.body.param1;
        const param2 = req.body.param2;

        // console.log(param1,param2)
        let searchQuery
        if (param1 == 'person') {
            searchQuery = "SELECT *, DATE_FORMAT(date, '%Y-%m-%d') AS formattedDate FROM passbook WHERE `person` = ?"
            let getRequiredId = connection.query(searchQuery, [`${param2}`], (error, results, fields) => {
                if (error) {
                    console.error('Error retrieving entries:', error);
                    throw error;
                }
                // let NumberOfEntries=results.length
                results.reverse();
                for (const obj of results) {
                    // console.log(obj.id)
                    dataToSend += `
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
        else {
            let temp = param2.split(",")
            if (temp[0] == 'month') {
                searchQuery = `SELECT *, DATE_FORMAT(date, '%Y-%m-%d') AS formattedDate FROM passbook WHERE date >= DATE_SUB(NOW(), INTERVAL ${temp[1]} MONTH)`

            }
            else {
                searchQuery = "SELECT *, DATE_FORMAT(date, '%Y-%m-%d') AS formattedDate FROM passbook WHERE date >= DATE_SUB(NOW(), INTERVAL 1 year)"
            }
            let getRequiredId = connection.query(searchQuery, (error, results, fields) => {
                if (error) {
                    console.error('Error retrieving entries:', error);
                    throw error;
                }
                // let NumberOfEntries=results.length
                results.reverse();
                for (const obj of results) {
                    // console.log(obj.id)
                    dataToSend += `
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
    .post('/sign-up', isAuthenticated,(req, res) => {
        const email = req.body.email;
        const password = req.body.password;

        let searchQuery = "SELECT * FROM users WHERE `email` = ?"
        let getRequiredId = connection.query(searchQuery, [`${email}`], (error, results, fields) => {
            if (error) {
                console.error('Error retrieving entries:', error);
                throw error;
            }
            else {
                if (results.length > 0) {
                    res.send("<script>alert('User already exists, Change the email');window.location.href = 'http://localhost:3000/sign-up';</script>")
                }
                else if (results.length == 0) {
                    async function run() {
                        const salt = new Uint8Array(16);
                        crypto.getRandomValues(salt);

                        const key = await bcrypt({
                            password: password,
                            salt: salt, // salt is a buffer containing 16 random bytes
                            costFactor: 11,
                            outputType: 'encoded', // return standard encoded string containing parameters needed to verify the key
                        });

                        // console.log('Derived key:', key);

                        const usersToAdd = {
                            email: email,
                            hashed_password: key,
                        };
                        // SQL query to insert data into the 'users' table
                        let insert = connection.query('INSERT INTO users SET ?', usersToAdd, (err, results, fields) => {
                            if (err) {
                                console.error('Error inserting data:', err);
                                res.redirect("/error");
                            } else {
                                // console.log('Data inserted successfully:');
                                res.redirect("/profile");
                            }
                        });
                    }
                    run();
                }
            }
        });
    })
    .post('/profile',isAuthenticated, (req, res) => {

        const email = req.body.email;
        const password = req.body.password;
        const newPassword = req.body.Newpassword;
        let searchQuery = "SELECT * FROM users WHERE `email` = ?"
        let getRequiredId = connection.query(searchQuery, [`${email}`], (error, results, fields) => {
            if (error) {
                console.error('Error retrieving entries:', error);
                throw error;
            }
            else {
                if (results.length > 0) {
                    for (const obj of results) {

                        (async () => {
                            const isValid = await bcryptVerify({
                                password: password,
                                hash: obj.hashed_password,
                            });

                            if (isValid) {
                                async function run() {
                                    const salt = new Uint8Array(16);
                                    crypto.getRandomValues(salt);
            
                                    const key = await bcrypt({
                                        password: newPassword,
                                        salt: salt, // salt is a buffer containing 16 random bytes
                                        costFactor: 11,
                                        outputType: 'encoded', // return standard encoded string containing parameters needed to verify the key
                                    });
                                    let updateQuery = "UPDATE users SET `hashed_password` = ? WHERE `email` = ?";
                                    connection.query(updateQuery, [key, email], (updateError, updateResults) => {
                                        if (updateError) {
                                            console.error('Error updating password:', updateError);
                                            throw updateError;
                                        }
                                        else{
                                            res.send("<script>alert('Successfully updated your password');window.location.href = 'http://localhost:3000/profile';</script>")
                                        }
                                    });
                                }
                                run()
                            }
                            else
                                res.send("<script>alert('Failed to reset the password,Type your current password correctly');window.location.href = 'http://localhost:3000/profile';</script>")
                        })()
                    }

                }
                else {
                    res.send("<script>alert('Failed to reset the password,Type your username correctly');window.location.href = 'http://localhost:3000/profile';</script>")
                }
            }
        });
    })
    .post('/login', (req, res) => {
        const email = req.body.email;
        const password = req.body.password;
        let searchQuery = "SELECT * FROM users WHERE `email` = ?"
        let getRequiredId = connection.query(searchQuery, [`${email}`], (error, results, fields) => {
            if (error) {
                console.error('Error retrieving entries:', error);
                throw error;
            }
            else {
                if (results.length > 0) {
                    for (const obj of results) {

                        (async () => {
                            const isValid = await bcryptVerify({
                                password: password,
                                hash: obj.hashed_password,
                            });

                            if (isValid) {
                                req.session.user = {
                                    username: email,
                                };

                                res.redirect('/')
                            }
                            else
                                res.send("<script>alert('Failed to login,Check your credentials');window.location.href = 'http://localhost:3000/login';</script>")
                        })()
                    }

                }
                else {
                    res.send("<script>alert('Failed to login,Check your credentials');window.location.href = 'http://localhost:3000/login';</script>")
                }
            }
        });
    });


app.listen(PORT, () => {
    console.log("Server is running on", PORT)
})