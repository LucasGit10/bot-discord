const { resumirNoticias } = require("../src/services/ai");

global.fetch = jest.fn();

describe("Serviço Groq AI", () => {
    beforeEach(() => {
        fetch.mockClear();
    });

    it("deve retornar um objeto com resumo e análise quando a API do Groq responde com sucesso", async () => {
        const mockResponse = {
            choices: [
                {
                    message: {
                        content: JSON.stringify({
                            resumo: "Este é um resumo gerado pela IA.",
                            sentimento: "Positivo",
                            pontuacao: 8
                        })
                    }
                }
            ]
        };

        fetch.mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue(mockResponse)
        });

        const articles = [{ title: "Notícia Teste", url: "https://teste.com" }];
        const data = await resumirNoticias(articles);

        expect(data.resumo).toBe("Este é um resumo gerado pela IA.");
        expect(data.sentimento).toBe("Positivo");
        expect(data.pontuacao).toBe(8);
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("deve lançar um erro quando a API do Groq retorna erro de status", async () => {
        fetch.mockResolvedValue({
            ok: false,
            statusText: "Bad Request",
            json: jest.fn().mockResolvedValue({ error: "Invalid Model" })
        });

        const articles = [{ title: "Erro", url: "https://erro.com" }];
        
        await expect(resumirNoticias(articles)).rejects.toThrow("Groq API error: Bad Request");
    });
});
