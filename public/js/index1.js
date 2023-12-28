// this file is meant for passbook.html

const today = new Date();

const year = today.getFullYear(); // Get the year (YYYY)
let month = today.getMonth() + 1;

sort.addEventListener('change',()=>{
    let ans=sort.value
    let result=''
    if(ans=='person')
    {
        result+=`
        <option selected>Choose...</option>
        <option value="C.B.Appaji">C.B.Appaji</option>
        <option value="S.B.Appaji">S.B.Appaji</option>
        `
    }
    else{
        result+=`
        <option selected>Choose...</option>
        <option value="month,1">last 1 month</option>
        <option value="month,3">last 3 month</option>
        <option value="month,6">last 6 month</option>
        <option value="year,${year}">last 1 year</option>
        `
    }
    option.innerHTML=result

})
// option.addEventListener('change',()=>{
//     // console.log(option.value)
//     let selection=''
//     if(option.value=='month1')
//     {
//         selection='Transactions of 1 month'
//     }
//     else if(option.value=='month3')
//     {
//         selection='Transactions of 3 month'
//     }
//     else if(option.value=='month6')
//     {
//         selection='Transactions of 6 month'
//     }
//     else if(option.value=='last1')
//     {
//         selection='Transactions of 1 year'
//     }
//     else{
//         selection='Transactions by '+option.value
//     }

//     searchbar.innerHTML=selection
// })
