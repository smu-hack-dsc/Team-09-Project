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
    axios
        .get('https://meetngo.onrender.com/access', { withCredentials: true })
        .then(res => {
            const accessToken = res.data;
            if (accessToken) {
                console.log('Logged in with token:', accessToken);
            } else {
                window.location.href = 'http://localhost:3001';
            }
        })
        .catch(error => {
            console.error('Error checking access token:', error);
            window.location.href = 'http://localhost:3001'; // Redirect on error
        });
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