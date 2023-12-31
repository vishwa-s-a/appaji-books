// this file is meant for index.html

const today = new Date();

const year = today.getFullYear(); // Get the year (YYYY)
let month = today.getMonth() + 1; // Get the month (MM)
let day = today.getDate(); // Get the day (DD)
const formattedDate = `${day}-${month}-${year}`;
currentDate.innerHTML="Date: "+formattedDate

//function to get current time
setInterval(() => {
    let date=new Date()
    let hours=date.getHours()
    let minutes=date.getMinutes()
    let seconds=date.getSeconds()
    const formattedTime = `${hours}:${minutes}:${seconds}`;
    const t1=currentTime.innerText;
    const recordedTime=t1.split(" ")[1];
    if(recordedTime != formattedTime)
    {
        currentTime.innerHTML="Time: "+formattedTime
    }


}, 1000);


let balance=""
// function to get the balance
let checkBalance=()=>{
    const fetchData = () => {
        fetch('https://appaji-books-nodejs1.onrender.com/balance')
        .then(response => {
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Handle the retrieved data from the backend
            // console.log(data)
            balance=data.balance;
            lastUpdated.innerHTML=`Last updated:${data.date},${data.time}`
            // Perform actions with the retrieved data
        })
        .catch(error => {
            // Handle errors that occurred during the fetch request
            console.error('There was a problem with the fetch operation:', error);
        });
    }
    fetchData();
}
checkBalance();

let getLastTransactions=()=>{
    const fetchLastEntries=()=>{
        fetch('https://appaji-books-nodejs1.onrender.com/lastTransaction')
        .then(response=>{
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data=>{
            let fetchedData=data.dataToSend;
            lastTransaction.innerHTML=fetchedData;
        })
        .catch(error => {
            // Handle errors that occurred during the fetch request
            console.error('There was a problem with the fetch operation:', error);
        });
    }
    fetchLastEntries();
}

getLastTransactions();

let updateBalanceFunc=()=>{
    const fetchData2 = () => {
        fetch('https://appaji-books-nodejs1.onrender.com/update')
        .then(response => {
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            
        })
        .catch(error => {
            // Handle errors that occurred during the fetch request
            console.error('There was a problem with the fetch operation:', error);
        });
    }
    fetchData2();
    getLastTransactions();
}

hideEye.addEventListener('click',()=>{
    if(hideEye.classList.contains('fa-eye-slash')){
        hideEye.classList.remove('fa-eye-slash')
        hideEye.classList.add('fa-eye')
        balanceDisplayed.innerHTML=`Available Balance: ${balance}`
    }
    else if(hideEye.classList.contains('fa-eye'))
    {
        hideEye.classList.remove('fa-eye')
        hideEye.classList.add('fa-eye-slash')
        balanceDisplayed.innerHTML="Available Balance: xxxxxx"

    }
    // console.log(hideEye.classList[1])

})

loader.addEventListener('click',()=>{
    if(loader.classList.contains('fa-rotate-180'))
    {
        loader.classList.remove('fa-rotate-180')
    }
    else{
        loader.classList.add('fa-rotate-180')
    }
    updateBalanceFunc()
    checkBalance();
   
})

