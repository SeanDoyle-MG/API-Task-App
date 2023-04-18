const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3');
const app = express();
const port = process.env.PORT || 3000;

app.use(
    cors({
        origin: "*",
    })
);
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    next();
});

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

    //db.run(`
    //DROP TABLE Tasks`);

    db.run(`
      CREATE TABLE IF NOT EXISTS Tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    taskName    TEXT,
    duration    TEXT,
    priority    TEXT,
    day         TEXT,
    isCompleted BOOLEAN,
    createdAt   INTEGER,
    updatedAt   INTEGER
    );
    `);

    if (doInsert) {
        db.run(`
      INSERT INTO Tasks (taskName, duration, priority, day, isCompleted, createdAt, updatedAt)
      VALUES ("Learning React", "2 hours", "High", "Monday", false, 1675904343555, 1675904343555), 
    ("Leetcode exercise in Python", "30 minutes", "Medium", "Wednesday", false, 1675904412722, 1675904412722),
    ("React project state management", "4 hours", "Low", "Thursday", false, 1675904412725, 1675904412725),
    ("Experiment with Styled Components", "1 hour", "Low", "Thursday", true, 1675904412729, 1675904412729);
    `);
    }
};

const listenCallback = () => {
    console.log(`Server is listening on port ${port}.`);
    db = new sqlite3.Database("tasks.db");
    dbSetup(true);
};

app.listen(port, listenCallback);

const renderMainPage = (req, res) => {
    res.send({ status: true });
};
app.get("/", renderMainPage);

/********************************RETRIEVE ALL TASKS*************************************/
app.get("/api/tasks", (req, res) => {
    db.all("SELECT * FROM Tasks", (error, rows) => {
        if (error) {
            res.send({ error });
        } else {
            res.send(rows);
        }
    });
});

/********************************RETRIEVE A TASK BY ID***********************************/
app.get("/api/tasks/:id", (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    db.all(`SELECT * FROM Tasks WHERE id = ?;`, [id],
        (error, rows) => {
            if (error) {
                res.send({ error });
            } else {
                res.send(rows);
            }
        }
    );
});

/********************************CREATE A NEW TASK***************************************/
app.post("/api/tasks/new", (req, res) => {
    db.run(`
        INSERT INTO Tasks(taskName, duration, priority, 
                          day, isCompleted, createdAt, updatedAt)
        VALUES( ? , ? , ? , ? , ? , ?, ?);
    `, [req.body.taskName, req.body.duration, req.body.priority,
        req.body.day, req.body.isCompleted, req.body.createdAt, req.body.updatedAt
    ]);
    res.send({ status: true });
});

/********************************UPDATE AN EXISTING TASK BY ID****************************/
app.put('/api/tasks/:id', (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    const { taskName, duration, priority, day, isCompleted, createdAt, updatedAt } = req.body;
    db.run(`
        UPDATE Tasks SET taskName=?, duration=?, priority=?, day=?, isCompleted=?, createdAt=?, updatedAt=?
        WHERE id=?
    `, [taskName, duration, priority, day, isCompleted, createdAt, updatedAt, id]);
    res.send({ status: true });
});

/********************************DELETE A TASK BY ID***************************************/
app.delete("/api/tasks/:id", (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    db.run(`DELETE FROM Tasks WHERE id = ?;`, [id]);
    res.send({ status: true });
});