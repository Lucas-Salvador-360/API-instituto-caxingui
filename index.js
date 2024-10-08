const express = require ('express');
const sever = express ();
const manuais = require('./src/data/manuais.json')

sever.get('/login/home/manuais', (req,res) => {
    return res.json(manuais)
});

sever.listen(3000, () => {
    console.log('servidor esta funcionando')
});