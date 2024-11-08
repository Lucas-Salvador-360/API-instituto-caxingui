require("dotenv").config()
const express = require ('express');
const server = express ();
const manuais = require('./src/data/manuais.json')
const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

//configurar o json
server.use(express.json())

//models
const User = require("./src/models/User")

server.get('/', (req,res) => {
    res.status(200).json({msg: "Benvindo ao nosso API"})
});

server.get('/auth/login/home/manuais', (req,res) => {
    return res.json(manuais)
});

//Privete route
server.get("/auth/:id", checkToken, async (req, res) => {
    const id = req.params.id

    //check if user exists
    const user = await User.findById(id, "-password")

    if(!user) {
        return res.status(404).json({msg: "Usuario não encontrado!"})
    }

    res.status(200).json({user})
})

function checkToken(req, res, next) {
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1]

    if(!token) {
        return res.status(401).json({msg: "Acesso negado!"})
    }

    try {
        const secret = process.env.SECRET

        jwt.verify(token, secret)

        next()
    } catch(error) {
        res.status(400).json({msg: "token invalido!"})
    }
}

//Register user
server.post("/auth/register", async(req, res) => {

    const {name, email, password, confirmpassword} = req.body
    //validetion
    if(!name) {
        return res.status(422).json({msg: "Nome é obrigatorio!"})
    }

    if(!email) {
        return res.status(422).json({msg: "E-mail é obrigatorio!"})
    }

    if(!password) {
        return res.status(422).json({msg: "Senha é obrigatorio!"})
    }

    if(password !== confirmpassword) {
        return res.status(422).json({msg: "As senhas não conferem!"})
    }

    //check if the users exists
    const userExists = await User.findOne({email: email})

    if(userExists) {
        return res.status(422).json({msg: "O e-mail já existe!"})
    }

    //create password
    const salt = await bcrypt.genSalt(12)
    const passwordHash = await bcrypt.hash(password, salt)

    //create users
    const user = new User({
        name,
        email,
        password: passwordHash
    })

    try {
        await user.save()
        res.status(201).json({msg: "Usuário criado com sucesso!"})
    } catch(error) {
        console.log(error)

        res
        .status(500)
        .json({msg: "Aconteceu um erro no servidor, tente novamente mais tarde!"})
    }
})

//Login user
server.post("/auth/login", async (req, res) => {
    const {email, password} = req.body

    //validetion
    if(!email) {
        return res.status(422).json({msg: "E-mail é obrigatorio!"})
    }

    if(!password) {
        return res.status(422).json({msg: "Senha é obrigatorio!"})
    }

    //check if the users exists
    const user = await User.findOne({email: email})

    if(!user) {
        return res.status(404).json({msg: "Usuario não encontrado!"})
    }

    //check if password match
    const checkPassword = await bcrypt.compare(password, user.password)

    if(!checkPassword) {
        return res.status(422).json({msg: "Senha invalida!"})
    }

    try {
        const secret = process.env.SECRET
        const token = jwt.sign(
            {
                id: user._id,
        },
        secret,
    )
    res.status(200).json({msg: "Autenticação realizada com sucesso!", token})
    } catch (err) {
        console.log(error)

        res
        .status(500)
        .json({msg: "Aconteceu um erro no servidor, tente novamente mais tarde!"})
    }
})

//credenciais
const dbUser = process.env.DB_USER
const dbPassword = process.env.DB_PASS

mongoose
    .connect(`mongodb+srv://${dbUser}:${dbPassword}@institutocaxingui.qipu1.mongodb.net/?retryWrites=true&w=majority&appName=institutocaxingui`)
    .then(() => {
    server.listen(3000)
    console.log("Servidor em funcionamento")
}).catch((err) => console.log(err))

