const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const DB_PATH = path.join(__dirname, '../../database.json');

if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ historico: [] }, null, 2));
    console.log(chalk.yellow("[Storage] Banco de dados criado."));
}

function salvarSentimento(dados) {
    try {
        const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        
        const novoRegistro = {
            data: new Date().toISOString(),
            topico: dados.topico.toLowerCase(),
            pontuacao: dados.pontuacao,
            sentimento: dados.sentimento
        };

        db.historico.push(novoRegistro);

        if (db.historico.length > 500) {
            db.historico.shift();
        }

        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
        console.log(chalk.green(`[Storage] Dados de sentimento salvos para: ${dados.topico}`));
    } catch (err) {
        console.error(chalk.red("[Storage] Erro ao salvar dados:"), err);
    }
}

function buscarHistorico(topico) {
    try {
        const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        return db.historico.filter(h => h.topico === topico.toLowerCase());
    } catch (err) {
        console.error(chalk.red("[Storage] Erro ao buscar dados:"), err);
        return [];
    }
}

module.exports = { salvarSentimento, buscarHistorico };
