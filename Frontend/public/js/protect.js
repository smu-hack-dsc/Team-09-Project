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
    console.log("document.cookie", document.cookie)
    axios
        .get('MeetnGo/access', { withCredentials: true })
        .then(res => {
            const accessToken = res.data;
            console.log('accessToken', accessToken)
            if (accessToken) {
                console.log('Logged in with token:', accessToken);
            } else {
                window.location.href = 'meet-n-go';
            }
        })
        .catch(error => {
            console.error('Error checking access token:', error);
            window.location.href = 'meet-n-go'; // Redirect on error
        });
}

function logout() {
    removeAccessToken();
    window.location.href = 'meet-n-go';
}


// General Script ------------------------
const accessToken = getAccessToken();
if (accessToken) {
    setAccessToken(accessToken);
    console.log('Logged in with token:', accessToken);
}

isLoggedIn();