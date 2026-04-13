const chalk = require("chalk");

async function resumirNoticias(articles) {
    console.log(chalk.magenta("[Groq] Iniciando resumo das notícias..."));
    const texto = articles.map(a => `- ${a.title}`).join("\n");

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.GROQ_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content: "Você é um analista de notícias. Responda APENAS em JSON com os campos: 'resumo' (string em português), 'sentimento' (string: Positivo, Negativo ou Neutro) e 'pontuacao' (número de 0 a 10 representando o impacto positivo/negativo)."
                },
                {
                    role: "user",
                    content: `Analise estas notícias:\n${texto}`
                }
            ]
        })
    });

    const data = await res.json();

    if (!res.ok) {
        console.error(chalk.red("Erro na API do Groq:"), data);
        throw new Error(`Groq API error: ${res.statusText}`);
    }

    if (!data.choices || data.choices.length === 0) {
        console.warn(chalk.yellow("Resposta inesperada do Groq:"), data);
        return { resumo: "Não foi possível resumir.", sentimento: "Neutro", pontuacao: 5 };
    }

    console.log(chalk.green("[Groq] Análise de sentimento gerada com sucesso!"));
    
    let content = data.choices[0].message.content;

    content = content.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
        return JSON.parse(content);
    } catch (parseError) {
        console.error(chalk.red("[Groq] Erro ao processar JSON da IA:"), parseError);
        console.log(chalk.gray("Conteúdo original:"), content);

        return { 
            resumo: content.substring(0, 500) + " (Erro de formatação na IA)", 
            sentimento: "Neutro", 
            pontuacao: 5 
        };
    }
}

module.exports = { resumirNoticias };