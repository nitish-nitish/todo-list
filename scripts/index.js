const uid = localStorage.getItem("uid");

window.onload = () => {
    if (uid) {
        window.location.href =  '/pages/index.html'
    } else {
        window.location.href =  '/pages/login.html'
    }
    handleLocation();
}

window.onpopstate = handleLocation;
window.route = route;

function route(event) {
    event = event || window.event;
    event.preventDefault();
    const href = event.currentTarget.getAttribute('href');
    window.history.pushState({}, '', href);
    handleLocation()
};

const routes = {
    404: "/pages/404.html",
    "/": "/pages/index.html",
    "/list": "/pages/list.html",
    "/login": "/pages/login.html",
    "/signup": "/pages/signup.html"
}

async function handleLocation() {
    const path = window.location.pathname;
    const route = routes[path] || routes[404];
    const html = await fetch(route).then(data => data.text())
    document.getElementById("main-page").innerHTML = html;
}
handleLocation();