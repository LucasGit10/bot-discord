require("dotenv").config();
const chalk = require("chalk");
const boxen = require("boxen");
const ora = require("ora");
const { exec } = require("child_process");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits, ActivityType, Events } = require("discord.js");
const noticiasCommand = require("./commands/news");
const chartCommand = require("./commands/chart");

const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  const url = req.url;

  if (url === '/terms') {
    const filePath = path.join(__dirname, '../public/terms.html');
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end("Erro: Arquivo não encontrado."); return; }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else if (url === '/privacy') {
    const filePath = path.join(__dirname, '../public/privacy.html');
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end("Erro: Arquivo não encontrado."); return; }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bot de Notícias Elite está online! Use /noticias ou /grafico no Discord.');
  }
}).listen(PORT, () => {
  console.log(`[Render] Servidor institucional rodando na porta ${PORT}`);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once(Events.ClientReady, () => {
  console.log(boxen(
    chalk.green.bold(`✅ Bot Conectado!\n`) +
    chalk.white(`Tag: ${client.user.tag}\n`) +
    chalk.white(`Servidores: ${client.guilds.cache.size}`),
    { padding: 1, borderColor: 'green', borderStyle: 'round' }
  ));
  client.user.setActivity("notícias", { type: ActivityType.Watching });
});

client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;

  if (msg.content.startsWith("!noticias")) {
    console.log(chalk.gray(`[Legado] !noticias recebido de ${msg.author.tag}`));
    noticiasCommand.execute(msg);
  }

  if (msg.content.startsWith("!grafico")) {
    console.log(chalk.gray(`[Legado] !grafico recebido de ${msg.author.tag}`));
    chartCommand.execute(msg);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand() && !interaction.isStringSelectMenu()) return;

  // Resposta imediata para evitar o erro 10062 no Render
  if (interaction.isChatInputCommand() && !interaction.deferred && !interaction.replied) {
    try {
      await interaction.deferReply();
    } catch (e) {
      console.error("[Index] Erro ao dar deferReply:", e);
    }
  }

  if (interaction.commandName === "noticias" || interaction.customId === "select_topico") {
    console.log(chalk.gray(`[Slash] /noticias ou interação recebida de ${interaction.user.tag}`));
    noticiasCommand.execute(interaction);
  }

  if (interaction.commandName === "grafico") {
    console.log(chalk.gray(`[Slash] /grafico recebido de ${interaction.user.tag}`));
    chartCommand.execute(interaction);
  }
});

const showBanner = () => {
  const banner = boxen(
    chalk.bold.cyan("🚀 BOT DE NOTÍCIAS AI\n") +
    chalk.gray("Monitoramento e Resumos Inteligentes"),
    { padding: 1, margin: 1, borderStyle: 'double', borderColor: 'cyan', textAlign: 'center' }
  );
  console.clear();
  console.log(banner);
};

const runHealthChecks = () => {
  const spinner = ora("Rodando testes de integridade (Health Checks)...").start();
  
  exec("npm test", (error) => {
    if (error) {
      spinner.fail(chalk.red("Os testes falharam! Verifique os módulos."));
      console.log(chalk.gray("\nPara ver detalhes do erro, execute: ") + chalk.white("npm test\n"));
    } else {
      spinner.succeed(chalk.green("Testes concluídos com sucesso! Sistema saudável."));
    }
  });
};

(async () => {
  showBanner();
  
  try {
    const loginSpinner = ora("Conectando ao Discord...").start();
    await client.login(process.env.DISCORD_TOKEN);
    loginSpinner.succeed(chalk.green("Bot online e pronto!"));
    
    // Testes desativados no boot de produção para máxima velocidade
    // runHealthChecks(); 
  } catch (error) {
    console.error(chalk.red("Erro crítico na inicialização:"), error);
    process.exit(1);
  }
})();
