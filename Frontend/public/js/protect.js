// Helper Functions ------------------------
function getAccessToken() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('accessToken');
}

function setAccessToken(accessToken) {
    sessionStorage.setItem('accessToken', accessToken);
}

function removeAccessToken() {
    sessionStorage.removeItem('accessToken');
}


// Main Functions ------------------------
function isLoggedIn() {
    const accessToken = sessionStorage.getItem('accessToken');
    if (accessToken) {
        console.log('Logged in with token:', accessToken);
    }
     else {
        window.location.href = 'http://localhost:3001';
     }
}

function logout() {
    removeAccessToken();
    window.location.href = 'http://localhost:3001';
}


// General Script ------------------------
const accessToken = getAccessToken();
if (accessToken) {
    setAccessToken(accessToken);
    console.log('Logged in with token:', accessToken);
}

isLoggedIn();
