const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3');
const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let db = null;

function dbSetup() {
    if (db === null) {
        return;
    }

    // https://www.sqlite.org/datatype3.html  
    db.run(` 
        CREATE TABLE IF NOT EXISTS Features ( 
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            feature TEXT NOT NULL, 
            version TEXT NOT NULL, 
            year INTEGER NOT NULL  
        );      
    `, createDoneCallback);

    function createDoneCallback(error) {
        if (error === null) {
            db.all(`SELECT COUNT(*) AS cnt FROM Features;`, (error, rows) => {
                if (error) return;
                if (rows[0].cnt === 0) {
                    db.run(` 
                        INSERT INTO Features (feature, version, year)  
                        VALUES   
                            ('Spread operator', 'ES6', 2015),  
                            ('Array destructuring', 'ES6', 2015);  
                    `);
                }
            });
        }
    }
}

function appStartedCallback() {
    console.log("App is listening.");
    db = new sqlite3.Database("tasks.db");
    dbSetup();
}

app.listen(port, appStartedCallback);

function rootVisitedCallback(req, res) {
    res.send({ status: 200, message: 'OK' });
}

app.get("/", rootVisitedCallback);

app.get('/api/features', (req, res) => {
    db.all('SELECT * FROM Features;', (error, rows) => {
        if (error) {
            res.send({ message: error.message });
        } else {
            res.send(rows);
        }
    });
});

app.get('/api/features/:id', (req, res) => {
    const id = req.params.id;
    db.all('SELECT * FROM Features WHERE id = ?;', [id], (error, rows) => {
        if (error) {
            res.send({ message: error.message });
        } else {
            res.send(rows);
        }
    });
});

app.delete('/api/features/:id', (req, res) => {
    const id = req.params.id;
    db.run(`DELETE FROM Features WHERE id = ?;`, [id], (error) => {
        if (error) {
            res.send({ message: error.message });
        } else {
            res.send({ status: 200, message: 'OK' });
        }
    });
});

app.put('/api/features/:id', (req, res) => {
    const id = req.params.id;
    const { feature, version, year } = req.body;
    if (typeof feature === 'string' && feature.length > 0 &&
        typeof version === 'string' && version.length > 0 &&
        typeof year === 'number') {
        db.run(` 
            UPDATE Features 
            SET feature=?, 
                version=?, 
                year=? 
            WHERE id=? 
        `, [feature, version, year, id],
            (error) => {
                if (error) {
                    res.send({ status: 500, error: error.message });
                } else {
                    res.send({ status: 200, message: 'OK' });
                }
            });
    } else {
        res.send({ status: 404, message: 'Invalid request.' });
    }
});

app.post("/api/features/new", (req, res) => {
    db.run(` 
        INSERT INTO Features (feature, version, year) 
        VALUES (?, ?, ?); 
    `, [req.body.feature, req.body.version, req.body.year], callback);

    function callback(error) {
        if (error) {
            res.send({ status: 500, error: error.message });
        } else {
            res.send({ status: 200, message: 'OK' });
        }
    }
});

app.get("/form", (req, res) => {
    res.send(`<html> 
      <body> 
        <form action="/api/features/new" method="POST"> 
          <input type="text" name="feature" placeholder="Feature" /> 
          <input type="text" name="version" placeholder="Version" /> 
          <input type="number" name="year" placeholder="Year" /> 
          <button type="submit">Submit</button> 
        </form> 
      </body> 
    </html>`);
});