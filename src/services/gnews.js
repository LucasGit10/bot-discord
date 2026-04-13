const chalk = require("chalk");

async function pegarNoticias(topico) {
    console.log(chalk.blue(`[GNews] Buscando notícias sobre: ${topico}`));
    const res = await fetch(
        `https://gnews.io/api/v4/search?q=${topico}&lang=pt&max=5&token=${process.env.GNEWS_KEY}`
    );

    const data = await res.json();

    if (!res.ok) {
        console.error(chalk.red("Erro na API do GNews:"), data);
        return [];
    }

    console.log(chalk.green(`[GNews] Foram encontradas ${data.articles?.length || 0} notícias.`));
    return data.articles || [];
}

module.exports = { pegarNoticias };