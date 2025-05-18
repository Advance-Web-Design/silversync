import express from 'express';
import cors from 'cors';

// Set up the server
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:5173");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// set up routes


// Start the server
app.listen(PORT, (err) => {
    if (err) {
        console.error(err);
    } else {
        console.log(`Server is running on port ${PORT}`);
    }
    });