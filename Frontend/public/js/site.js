//Name: Lynette Jean Tay
//admin num: p1922561
//class: 1B/04

function logout() {
    localStorage.removeItem('accessToken')
    window.location.assign('/index.html')
}