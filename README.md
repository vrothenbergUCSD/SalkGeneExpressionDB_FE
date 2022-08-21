# Salk Data Visualization

## Project Overview

Front end source code and public assets for the RBIO-P data sharing web app.

## Project setup 

```
npm install 
```

### Compiles and hot reloads for development

```
npm run dev 
```

### Compiles and minifies for production 

```
npm run build  
```

## Env files

Store environment variables in an .env file at the root level, i.e. in same folder as the README.
Create separate ```.env.development``` and ```.env.production``` files for customized URLs depending on the build mode.  Only variables beginning with the prefix VITE_ will be exposed to the client.  

The Firebase API key is not intended to be secret.  Access is controlled with security rules.  

### Development

```.env.development```

Update API details as needed.  

```
VITE_FIREBASE_API_KEY=AIzaSyBLbFrBx3Ii0LU4zqEeHYklK9G2msU2UkQ
VITE_AUTH_DOMAIN=rbio-p-datasharing.firebaseapp.com
VITE_PROJECT_ID=rbio-p-datasharing
VITE_STORAGE_BUCKET=rbio-p-datasharing.appspot.com
VITE_MESSAGING_SENDER_ID=1099500985223
VITE_APP_ID=1:1099500985223:web:7e039191b77421a17bd122
VITE_MEASUREMENT_ID=G-H3P87PHKBV
VITE_FASTAPI_URL=http://127.0.0.1:8000
VITE_VAR=devtest
```
### Production

```.env.production```

Update API details as needed.  

```
VITE_FIREBASE_API_KEY=AIzaSyAgI5OR349UnSDx47ru1gTTKtXoj3oYpvc
VITE_AUTH_DOMAIN=rbio-p-datasharing.firebaseapp.com
VITE_PROJECT_ID=rbio-p-datasharing
VITE_STORAGE_BUCKET=rbio-p-datasharing.appspot.com
VITE_MESSAGING_SENDER_ID=1099500985223
VITE_APP_ID=1:1099500985223:web:7e039191b77421a17bd122
VITE_MEASUREMENT_ID=G-H3P87PHKBV
VITE_FASTAPI_URL=https://geneexpressiondbbe-w5oumbwxcq-uw.a.run.app
VITE_VAR=prodtest
```