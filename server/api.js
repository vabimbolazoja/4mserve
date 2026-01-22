// server/api/index.js
import http from 'http';
import app from './index.js'; // This is already your Express app

const PORT = process.env.PORT || 5001;

const server = http.createServer(app);

server.listen(PORT, (err) => {
    if (!err) {
        console.log(`Serverddd started at port: ${PORT}`);
    } else {
        console.error(err);
    }
});
