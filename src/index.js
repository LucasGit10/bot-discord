require("dotenv").config();
const chalk = require("chalk");
const boxen = require("boxen");
const ora = require("ora");
const { execSync } = require("child_process");
const http = require("http"); // Adicionado para o Render
const { Client, GatewayIntentBits, ActivityType } = require("discord.js");
const noticiasCommand = require("./commands/news");
const chartCommand = require("./commands/chart");

// Servidor básico para o Render não dar erro de port bind
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is running!');
}).listen(PORT, () => {
  console.log(`[Render] Servidor de health-check rodando na porta ${PORT}`);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once("ready", () => {
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

const runHealthChecks = async () => {
  const spinner = ora("Rodando testes de integridade (Health Checks)...").start();
  
  try {
    execSync("npm test", { stdio: 'ignore' });
    spinner.succeed(chalk.green("Testes concluídos com sucesso! Sistema está saudável."));
    return true;
  } catch (error) {
    spinner.fail(chalk.red("Os testes falharam! Verifique os módulos antes de iniciar o bot."));
    console.log(chalk.gray("\nPara ver detalhes do erro, execute: ") + chalk.white("npm test\n"));
    return false;
  }
};

(async () => {
  showBanner();
  
  const ok = await runHealthChecks();
  
  if (ok) {
    const loginSpinner = ora("Conectando ao Discord...").start();
    try {
      await client.login(process.env.DISCORD_TOKEN);
      loginSpinner.stop();
    } catch (err) {
      loginSpinner.fail(chalk.red("Erro ao conectar ao Discord. Verifique o seu TOKEN."));
      console.error(err);
    }
  } else {
    process.exit(1);
  }
})();
