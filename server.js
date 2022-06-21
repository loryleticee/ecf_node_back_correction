//#region constants
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const prismaErrors = require("./prisma.errors.json");
const bcrypt = require("bcrypt");
const htmlspecialchars = require("htmlspecialchars");
const striptags = require("striptags");

const express = require("express");
const cors = require("cors");
var bodyParser = require("body-parser");

var app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const port = process.env.PORT;

//#region Multer setting
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const { connect } = require("http2");
var custom_upload_file_name;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = file.mimetype.split("/").pop();
    custom_upload_file_name =
      "image_" + new Date().getMilliseconds() + "_" + uuidv4();
    custom_upload_file_name = `${custom_upload_file_name}.${uniqueSuffix}`;
    cb(null, custom_upload_file_name);
  },
});
const upload = multer({ storage: storage });
//#endregion Multer setting

//#endregion constants

//#region SUBSCRIBE

app.post("/subscribe", upload.single("image"), async (req, res) => {
  var image;
  var response;
  const ROLES = ["USER", "ADMIN"];

  try {
    var { email, password, username, role } = req.body;
    role = ROLES.includes(role.toUpperCase()) ? role : "";
  } catch (error) {
    res.status(400).send("Some args are required");
  }

  try {
    image = req.file.filename && custom_upload_file_name;
  } catch (error) {
    image = "";
  }

  try {
    email = htmlspecialchars(striptags(email?.trim())).toLowerCase();
    password = htmlspecialchars(striptags(password?.trim()));

    const hasFinallyAnEmptyString = [email, password].includes("");

    if (hasFinallyAnEmptyString) {
      throw "Some arg is wrong formated";
    }
  } catch (error) {
    res.status(401).send(error);
  }

  bcrypt.hash(password, 4, async function (err, hash) {
    try {
      response = await prisma.user.create({
        data: {
          email,
          name: username,
          password: hash,
          image: image,
          role: role,
        },
      });
    } catch (error) {
      const fileErrorKey = error.code ?? Object.keys(error);
      return res.status(400).json({
        message: prismaErrors[fileErrorKey],
      });
    }

    delete response.password;
    res.status(201).json({ response: response });
  });
});
//#endregion SUBSCRIBE

//#region READ
app.get("/users", async (req, res) => {
  var users;

  try {
    users = await prisma.user.findMany();
    if (!users instanceof Array) {
      res.status(403).send("An error occured, please conctact your webmaster");
    }

    users.map((u) => {
      delete u.password;
      if (u.image.trim() != "") {
        u.image = fs.readFileSync(`uploads/${u.image}`, "base64");
      }
    });

    res.send(users);
  } catch (error) {
    res.status(403).send(`${error}`);
  }
});

app.post("/users", async (req, res) => {
  let error_message = "OK";
  let status = 200;
  let user;

  try {
    var search_content = req?.body?.data;
    if (!search_content) {
      throw "params required";
    }
  } catch (error) {
    error_message = error;
    status = 400;
  }

  try {
    search_content = htmlspecialchars(striptags(search_content)).trim();
    if (search_content === "") {
      throw "Chaine de caractère no valide";
    }
  } catch (error) {
    error_message = error;
    status = 400;
  }

  try {
    user = await prisma.user.findMany({
      where: {
        OR: [
          {
            name: {
              contains: search_content,
            },
          },
          {
            email: {
              contains: search_content,
            },
          },
        ],
      },
    });
  } catch (error) {
    error_message = error;
    status = 400;
  }

  user?.forEach((u) => {
    delete u.password;
  });

  res
    .status(status)
    .send(JSON.stringify({ message: error_message, users: user }));
});

app.get("/users/:search", async (req, res) => {
  let error_message = "OK";
  let status = 200;
  let user;

  try {
    var search_content = req?.params?.search;
    if (!search_content) {
      throw "params required";
    }
  } catch (error) {
    error_message = error;
    status = 400;
  }

  try {
    search_content = htmlspecialchars(striptags(search_content)).trim();
    if (search_content === "") {
      throw "Chaine de caractère no valide";
    }
  } catch (error) {
    error_message = error;
    status = 400;
  }

  try {
    user = await prisma.user.findMany({
      where: {
        OR: [
          {
            name: {
              contains: search_content,
            },
          },
          {
            email: {
              contains: search_content,
            },
          },
        ],
      },
    });
  } catch (error) {
    error_message = error;
    status = 400;
  }

  user?.forEach((u) => {
    delete u.password;
  });

  res
    .status(status)
    .send(JSON.stringify({ message: error_message, users: user }));
});

//#endregion READ

app.listen(port, () => {
  console.log("server running on port " + port);
});
