const express = require("express");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const db = new sqlite3.Database("dados.db");

// Criar tabela se não existir
db.run("CREATE TABLE IF NOT EXISTS mensagens (texto TEXT)");

// Página principal
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

// Quando clicar no botão
app.get("/salvar", (req, res) => {
    db.run("INSERT INTO mensagens VALUES ('Olá Felipe')");
    res.send("Mensagem salva no banco!");
});

// Iniciar servidor
app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});
