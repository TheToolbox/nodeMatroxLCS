# Matrox LCS Node API

Currently a work in progress.


Example:
```js
const LCS = require('MatroxLCS').MatroxLCS; 

const myDevice = new LCS('10.2.32.0', 'admin','password');

myDevice.getStatus()
    .then(result => console.log(result))
    .catch(err => console.log(err));

```