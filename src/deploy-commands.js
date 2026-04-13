require("dotenv").config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const chalk = require("chalk");

const commands = [
  new SlashCommandBuilder()
    .setName('noticias')
    .setDescription('Busca as últimas notícias e gera um resumo com IA')
    .addStringOption(option =>
      option.setName('topico')
        .setDescription('O assunto das notícias (ex: tecnologia, esportes)')
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName('grafico')
    .setDescription('Exibe o gráfico de tendência de sentimento para um tópico')
    .addStringOption(option =>
      option.setName('topico')
        .setDescription('O assunto para o gráfico')
        .setRequired(true)
    ),
].map(command => command.toJSON());

const token = process.env.DISCORD_TOKEN;
if (!token) {
    console.error(chalk.red("DISCORD_TOKEN não encontrado no arquivo .env!"));
    process.exit(1);
}

const clientId = Buffer.from(token.split('.')[0], 'base64').toString();

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(chalk.blue(`[Deploy] Iniciando registro de ${commands.length} comandos de barra (/)`));
    console.log(chalk.gray(`[Deploy] Usando Client ID: ${clientId}`));

    await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands },
    );

    console.log(chalk.green(`[Deploy] Comandos registrados com sucesso globalmente!`));
  } catch (error) {
    console.error(chalk.red("[Deploy] Erro ao registrar comandos:"), error);
  }
})();
