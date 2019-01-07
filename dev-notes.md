# dev environment
We use chrome://inspect to debug both the frontend and backend
here we record the way to init the dev enviroment
use
`make initDevEnvironment`

# Folder struct
```
dev-tools:
  scripts and files for development and debug
database:
  default place to store the mongodb database
tools:
  js functions or packages that can be separated from our main project. These files may become idependentn npm package later.
brainhole:
  the project folder for the brainhole backend
```

# Folder struct of brainhole
```
for the backend:
  server-src:
    code for the backend
  server:
    generated from server-src by babel
    the entry point for the backend is
      ./server/index.js
  middleware:
    middleware for the backend
for the frontend:
  layouts:
    Application layouts
  assets:
    un-compiled assets such as LESS, SASS, or JavaScript
  static:
    each file inside this directory is mapped to `/`
  pages:
    vue pages
  store:
    vuex-store
```
