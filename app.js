const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//API1

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);

  const getUserQuery = `
    SELECT * 
    FROM user
    WHERE username='${username}';`;
  const dbUser = await db.get(getUserQuery);

  if (dbUser === undefined) {
    let lengthOfPassword = password.length;
    if (lengthOfPassword < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const createRegisterQuery = `
        INSERT INTO 
        user(username,name,password,gender,location)
        VALUES(
            '${username}',
            '${name}',
            '${hashedPassword}',
            '${gender}',
            '${location}');`;
      const dbResponse = await db.run(createRegisterQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//API 2
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const getUserQuery = `
    SELECT * 
    FROM user
    WHERE username='${username}';`;
  const dbUser = await db.get(getUserQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const comparePassword = await bcrypt.compare(password, dbUser.password);
    if (comparePassword === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});
//API 3

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;

  const getUserPassword = `
    SELECT * 
    FROM user
    WHERE username='${username}';`;
  const dbUser = await db.get(getUserPassword);

  if (dbUser === undefined) {
    response.status(400);
    response.send("User not Registered");
  } else {
    isValidPassword = await bcrypt.compare(oldPassword, dbUser.password);
    if (isValidPassword === true) {
      const lengthOfNewPassword = newPassword.length;
      if (lengthOfNewPassword < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const encryptedPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `
              UPDATE user
              SET 
              password = '${encryptedPassword}'
              WHERE username = '${username}';`;
        await db.run(updatePasswordQuery);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
