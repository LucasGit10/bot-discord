const { pegarNoticias } = require("../src/services/gnews");

global.fetch = jest.fn();

describe("Serviço GNews", () => {
    beforeEach(() => {
        fetch.mockClear();
    });

    it("deve retornar uma lista de notícias quando a API responde com sucesso", async () => {
        const mockResponse = {
            articles: [
                { title: "Notícia 1", url: "https://link1.com" },
                { title: "Notícia 2", url: "https://link2.com" }
            ]
        };

        fetch.mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue(mockResponse)
        });

        const noticias = await pegarNoticias("tecnologia");

        expect(noticias).toHaveLength(2);
        expect(noticias[0].title).toBe("Notícia 1");
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("deve retornar uma lista vazia quando a API falha", async () => {
        fetch.mockResolvedValue({
            ok: false,
            json: jest.fn().mockResolvedValue({ error: "API Error" })
        });

        const noticias = await pegarNoticias("invalido");

        expect(noticias).toEqual([]);
    });
});
