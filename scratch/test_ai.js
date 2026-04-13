require("dotenv").config();
const { resumirNoticias } = require("./src/services/ai");
const { pegarNoticias } = require("./src/services/gnews");

async function test() {
    try {
        const noticias = await pegarNoticias("tecnologia");
        console.log("Notícias encontradas:", noticias.length);
        const result = await resumirNoticias(noticias);
        console.log("Resultado da IA:", JSON.stringify(result, null, 2));
    } catch (err) {
        console.error("Erro no teste:", err);
    }
}

test();
