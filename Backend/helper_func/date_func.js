// format date
function formatDate(originalDate) {
    // Step 1: Parse the original date string to obtain the date object
    const dateObj = new Date(originalDate);
  
    // Step 2: Extract the year, month, and day from the date object
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // Months are zero-based, so we add 1
    const day = String(dateObj.getDate()).padStart(2, '0');
  
    // Step 3: Format the year, month, and day as per the desired format
    const formattedDate = `${year}-${month}-${day}`;
  
    // Step 4: Return the final formatted date string
    return formattedDate;
  }

function process_date(date_str) {
    const res = [];
    const date_lst = date_str.split(',');
    date_lst.forEach(date => {
        date = date.trim();
        const formatted = formatDate(date);
        res.push(formatted);
    });
    
    return res;
}

module.exports = {process_date};