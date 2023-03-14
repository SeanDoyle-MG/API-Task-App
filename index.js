const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3');
const app = express();
const port = 8080;
// const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let db = null;

const getAllRows = (error, rows) => {
    if (error) {
        return {
            error,
        };
    } else {
        return rows;
    }
};

const dbSetup = (doInsert) => {
    if (db === null) {
        return;
    }

    db.run(`
      CREATE TABLE IF NOT EXISTS Tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        taskName TEXT NOT NULL,
        duration TEXT NOT NULL,
        priority TEXT NOT NULL,
        day      TEXT NOT NULL
      );
    `);

    if (doInsert) {
        db.run(`
          INSERT INTO Tasks (taskName, duration, priority, day)
          VALUES ("Learning React", "2 hours", "High", "Monday"), 
                ("Leetcode exercise in Python", "30 minutes", "Medium", "Wednesday"),
                ("React project state management", "4 hours", "Low", "Thursday"),
                ("Experiment with Styled Components", "1 hour", "Low", "Thursday");
        `);
    }
};

const listenCallback = () => {
    console.log(`Server is listening on port ${port}.`);
    db = new sqlite3.Database("tasks.db");
    dbSetup(false);
};

app.listen(port, listenCallback);

const renderMainPage = (req, res) => {
    res.send({ status: true });
};
app.get("/", renderMainPage);

app.get("/api/tasks", (req, res) => {
    db.all("SELECT * FROM Tasks", (error, rows) => {
        if (error) {
            res.send({ error });
        } else {
            res.send(rows);
        }
    });
});

app.get("/api/tasks/:id", (req, res) => {
    const id = Number.parseInt(req.params.id, 10);

    db.all(
        `
      SELECT *
      FROM Tasks
      WHERE id = ?
    `, [id],
        (error, rows) => {
            if (error) {
                res.send({ error });
            } else {
                res.send(rows);
            }
        }
    );
});

app.delete("/api/tasks/:id", (req, res) => {
    const id = Number.parseInt(req.params.id, 10);

    db.run(
        `
      DELETE FROM Tasks
      WHERE id = ?
    `, [id]
    );
    res.send({ status: true });
});

app.put('/api/tasks/:id', (req, res) => {
    const id = req.params.id;
    const { taskName, duration, priority, day } = req.body;
    if (typeof taskName === 'string' && taskName.length > 0 &&
        typeof duration === 'string' && duration.length > 0 &&
        typeof priority === 'string' && priority.length > 0 &&
        typeof day === 'string' && day.length > 0) {
        db.run(` 
            UPDATE Tasks 
            SET taskName=?, 
                duration=?, 
                priority=?,
                day=? 
            WHERE id=? 
        `, [taskName, duration, priority, day, id],
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

app.post("/api/tasks/new", (req, res) => {
    db.run(
        `
      INSERT INTO Tasks (taskName, duration, priority, day)
      VALUES (?, ?, ? ?);
    `, [req.body.taskName, req.body.duration, req.body.priority, req.body.day]
    );
    res.send({ status: true });
});