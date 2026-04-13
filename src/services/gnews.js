const chalk = require("chalk");

async function pegarNoticias(topico) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
        console.log(chalk.blue(`[GNews] Buscando notícias sobre: ${topico}`));
        const start = Date.now();
        
        const res = await fetch(
            `https://gnews.io/api/v4/search?q=${topico}&lang=pt&max=5&token=${process.env.GNEWS_KEY}`,
            { signal: controller.signal }
        );

        clearTimeout(timeoutId);
        console.log(chalk.gray(`[GNews] API respondeu em ${Date.now() - start}ms`));

        const data = await res.json();

        if (!res.ok) {
            console.error(chalk.red("Erro na API GNews:"), data);
            return [];
        }

        return data.articles || [];
    } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
            console.error(chalk.red("[GNews] Tempo limite excedido (Timeout)."));
        } else {
            console.error(chalk.red("[GNews] Erro na busca:"), err);
        }
        return [];
    }
}

module.exports = { pegarNoticias };