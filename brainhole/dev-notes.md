# middleware and vue plugins
* remember to rejester the plugins and middleware in nuxt.config.js

# Folder struct of brainhole
```
For the backend:
  server-src:
    code for the backend
  server:
    generated from server-src by babel
    the entry point for the backend is
      ./server/index.js
  common and common-src:
    code for both the frontend (vue) and the backend (express)
    common is generated from common-src
  middleware:
    middleware for the backend
For the frontend:
  layouts:
    Application layouts
  assets:
    un-compiled assets such as LESS, SASS, or JavaScript
  static:
    each file inside this directory is mapped to `/`
  pages:
    vue pages
    also construct the frontend route struct
  store:
    vuex-store
```

# About the route
Note that both vue and the express have their route struct
if you
* directly entry a url
* refresh the browser under a url
* use the window.location.href = url
You are navigated by the backend (backend return you the page)

but if you
* use the 'to' command, (e.g `<Button to="/login/">`) syntax
You are navigated by the frontend, you will get the page in the same location of the 'pages' folder
* if there is no such page, you will get a "This page could not be found" Error

#### The Right way to visit page of frontend and data of backend
* Navigate to another vue page using `<div to="url">` or `this.$router.push('url')`
* Visiting the backend using `window.location.href = url`
