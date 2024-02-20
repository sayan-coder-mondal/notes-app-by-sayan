require("dotenv").config();
const express = require("express");
const app = express();
const hbs = require("hbs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const auth = require("./middleware/auth");
const database = require("./mongodb");
const PORT =8000;


const user = require("./schema/user");
const note = require("./schema/note");

const methodOverride = require('method-override');
const { read } = require("fs");
app.use(methodOverride('_method'));

//this line is also important even also for dynamic websites. It will load css files and images
// console.log(__dirname)
const staticPath = path.join(__dirname, "../public");
// console.log(staticPath);

//add viewsPath
const viewsPath = path.join(__dirname, "../views");

const partialPath = path.join(__dirname, "../partials");

app.use(express.json());
app.use(cookieParser());
app.set("view engine", "hbs");
app.set("views", viewsPath);
app.use(express.urlencoded({ extended: false }));

//this line is also important even also for dynamic websites. It will load css files and images
app.use(express.static(staticPath));

//to register partials
hbs.registerPartials(partialPath);


app.get("/", auth, async (req, res) => {
    try {
        if (req.authenticatedUser) {
            const all_notes = await note.find({ uid: req.authenticatedUser._id });
            res.render("home", {
                all_notes,
                nav: `<div id="nav">
                <a href="/logout">
                    <li>Log out</li>
                </a>
            </div>`
            });
        }
        else {
            res.render("home2", {
                nav: `<div id="nav">
                <a href="/login">
                    <li>Log in</li>
                </a>
            </div>`
            });
        }
    } catch (error) {
        res.send(error);
    }
});

app.get("/signup", async (req, res) => {
    try {
        res.render("signup");
    } catch (error) {
        res.send(error);
    }
});

app.get("/login", async (req, res) => {
    try {
        res.render("login");
    } catch (error) {
        res.send(error);
    }
});

app.post("/signup", async (req, res) => {
    try {
        const user_data = new user({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password
        });

        // console.log(user_data);
        // call token
        const token = await user_data.generateAuthToken();
        console.log("The token part:    " + token);

        // store token in cookie
        // res.cookie(name,value,{options})
        res.cookie("jwt_signup", token, {
            expires: new Date(Date.now() + 20000),
            httpOnly: true
        });
        if (req.body.password == req.body.confirm_password) {
            const registered = await user_data.save();
            // console.log(registered);
            // console.log(registered._id);

            res.redirect("login");
        }
        else {
            res.render("signup", {
                err: "Password and Confirm Password should be equal"
            });
        }
    } catch (error) {
        console.log(error);
        res.send("error");
    }
});


app.post("/login", async (req, res) => {
    try {
        const check = await user.findOne({ email: req.body.email });
        // compare hashed password and enter password
        const isMatch = await bcrypt.compare(req.body.password, check.password);
        console.log(`Compare hashed password and enter password: ${isMatch}`);

        const token = await check.generateAuthToken();
        console.log("The token part:    " + token);
        // const isMatch=true
        if (isMatch) {
            // username = check.name;
            // store token in cookie
            // res.cookie(name,value,{options})
            res.cookie("jwt_login", token, {
                // expires: new Date(Date.now() + 20000),
                httpOnly: true
            });

            res.redirect("/");
            console.log("this is home");
        }
        else {
            // res.send("Wrong password");
            res.render("login", {
                // err: "Wrong password"
                err: "Wrong details"
            });
        }
    }
    catch (e) {
        // res.send("Wrong details");
        res.render("login", {
            err: "Wrong details"
        });
        console.log(e);
    }
});


app.get("/logout", auth, async (req, res) => {
    // console.log(`Login token get    :   ${req.cookies.jwt_login}`);
    try {
        console.log(`Authenticated user is:      ${req.authenticatedUser}`);
        res.clearCookie("jwt_login");
        // await req.authenticatedUser.save();
        res.redirect("login");
    } catch (error) {
        res.status(500).send(error);
    }
});


app.get("/addnotes", auth, async (req, res) => {
    try {
        if (req.authenticatedUser) {
            res.render("addnotes", {
                nav: `<div id="nav">
                <a href="/">
                    <li>Home</li>
                </a>
                <a href="/logout">
                    <li>Log out</li>
                </a>
            </div>`
            });
        }
    } catch (error) {
        res.status(500).send(error);
    }
})


app.post("/addnotes", auth, async (req, res) => {
    try {
        const note_data = new note({
            uid: req.authenticatedUser._id,
            title: req.body.title,
            note: req.body.note
        });

        await note_data.save();

        res.redirect("/");
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})


app.get("/noteDetails/:x", auth, async (req, res) => {
    try {
        const a = req.params.x;
        const target_note = await note.findOne({ _id: a });
        res.render("noteDetails", {
            target_note,
            nav: `<div id="nav">
                <a href="/">
                    <li>Home</li>
                </a>
                <a href="/logout">
                    <li>Log out</li>
                </a>
            </div>`
        })
    } catch (error) {
        console.log(error);
        res.send(error);
    }
});


app.put("/update/:x", async (req, res) => {
    try {
        const a = req.params.x;
        const update = {
            title: req.body.title,
            note: req.body.note
        }
        const UpdatedNote = await note.updateOne({ _id: a }, update, { new: true, runValidators: true });
        res.redirect("/");
    } catch (error) {
        console.log(error);
        res.send(error);
    }
});


app.delete("/delete/:x", async (req, res) => {
    try {
        const a = req.params.x;
        const DeletedNote = await note.deleteOne({ _id: a });
        res.redirect("/");
    } catch (error) {
        console.log(error);
        res.send(error);
    }
});

app.listen(PORT, () => {
    console.log(`Server is running a port ${PORT}`);
})